import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt/dist/jwt.service';
import * as bcrypt from 'bcrypt';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class UserService {
  private refreshTokens = [];

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  // Find a user by the email address

  async findOneByEmail(email: string): Promise<User | undefined> {
    return this.userRepository.findOneBy({ email });
  }

  // Validates user credentials

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.findOneByEmail(email);
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  // Handles user login

  async login(user: any) {
    const payload = { sub: user.id };

    // Generate access token
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '1h',
    });

    // Generate refresh token
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '30s',
    });

    // Store the refresh token in the array
    this.refreshTokens.push({
      userId: user.id,
      refreshToken: refreshToken,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    };
  }

  // Retrives a paginated list of users

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [users, totalCount] = await this.userRepository.findAndCount({
      skip: skip,
      take: limit,
      select: ['id', 'firstName', 'lastName', 'email'],
    });

    const totalPages = Math.ceil(totalCount / limit);

    return {
      data: users,
      meta: {
        page,
        limit,
        totalCount,
        totalPages,
        skip,
      },
    };
  }

  // Creates a new user

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { password } = createUserDto;
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    return this.userRepository.save(newUser);
  }

  // Find a user by the id

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOneBy({ id });

    if (!user) {
      throw new Error('User not found.');
    }

    return user;
  }

  // Update a user

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new Error('User not found.');
    }

    // Update user properties
    for (const key in updateUserDto) {
      if (updateUserDto[key] !== undefined) {
        user[key] = updateUserDto[key];
      }
    }

    // If password needs to be updated hash the new password
    if (updateUserDto.password) {
      user.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    return this.userRepository.save(user);
  }

  // Delete a user

  async remove(id: number): Promise<void> {
    const result = await this.userRepository.delete(id);

    if (result.affected === 0) {
      throw new Error('User not found');
    }
  }

  async refreshAccessToken(
    refreshToken: string,
  ): Promise<{ accessToken: string }> {
    const storedTokenData = this.findRefreshToken(refreshToken);

    if (!storedTokenData) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    try {
      // Verify the refresh token
      const payload = this.jwtService.verify(refreshToken);

      // Token is valid, generate a new access token
      return {
        accessToken: this.jwtService.sign(
          { sub: payload.sub },
          { expiresIn: '1h' },
        ),
      };
    } catch (e) {
      // Token is invalid or expired
      if (e.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Refresh token expired');
      }
      // Other errors
      throw e;
    }
  }

  // // Method to generate a new access token
  // async getNewAccessToken(userId: number): Promise<string> {
  //   const payload = { sub: userId };
  //   return this.jwtService.sign(payload, { expiresIn: '1m' });
  // }

  findRefreshToken(
    token: string,
  ): { userId: number; refreshToken: string } | undefined {
    // Find the refresh token in the array
    return this.refreshTokens.find((rt) => rt.refreshToken === token);
  }

  removeRefreshToken(token: string): void {
    // Filter out the refresh token from the array
    this.refreshTokens = this.refreshTokens.filter(
      (rt) => rt.refreshToken !== token,
    );
  }

  // // Method to find a refresh token in the array
  // findRefreshToken(token: string) {
  //   return this.refreshTokens.find((rt) => rt.refreshToken === token);
  // }

  async logout(token: string): Promise<void> {
    // Remove the refresh token from the stored tokens
    this.refreshTokens = this.refreshTokens.filter(
      (rt) => rt.refreshToken !== token,
    );
  }

  // Generate OTP
  generateOtp(): string {
    const otp = Math.floor(Math.random() * 9000) + 1000;

    return otp.toString();
  }

  // Handle Forgot Password
  async handleForgotPassword(email: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate OTP
    const otp = this.generateOtp();
    user.requestedAt = new Date();
    user.otp = otp;
    user.flag = true;
    await this.userRepository.save(user);

    // Send Email with OTP
    this.mailService.sendOtpEmail(user.email, otp);
  }

  // Reset Password
  async resetPassword(
    email: string,
    otp: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { email, otp, flag: true },
    });

    if (!user) {
      throw new BadRequestException('Invalid OTP or Email');
    }

    // Check if OTP is expired
    const expirationTime = Number(process.env.EXPIRATION);
    const currentTime = new Date();
    const requestedAt = new Date(user.requestedAt);
    const timeDiff = currentTime.getTime() - requestedAt.getTime();

    if (timeDiff > expirationTime * 1000) {
      // Invalidate OTP
      user.otp = null;
      user.flag = false;
      await this.userRepository.save(user);
      throw new BadRequestException('OTP has expired');
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and reset flag/otp
    user.password = hashedPassword;
    user.flag = false;
    user.otp = null;
    await this.userRepository.save(user);
  }
}
