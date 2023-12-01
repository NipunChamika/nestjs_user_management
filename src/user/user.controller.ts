import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  Res,
  HttpStatus,
  HttpException,
  UnauthorizedException,
  Req,
  InternalServerErrorException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LocalAuthGuard } from './local-auth.guard';
import { AuthGuard } from '@nestjs/passport';
import { ParseIntPipe } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Request as ExpressRequest, Response } from 'express';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // Handles user login authentication

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) {
    return this.userService.login(req.user);
  }

  // Handles Refresh Tokens

  @Post('token')
  async refreshToken(@Body() body: { refreshToken: string }) {
    const refreshToken = body.refreshToken;
    const storedTokenData = this.userService.findRefreshToken(refreshToken);

    try {
      return await this.userService.refreshAccessToken(refreshToken);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        // Remove the expired token
        this.userService.removeRefreshToken(refreshToken);
        throw error;
      }
      // Other possible exceptions
      throw new InternalServerErrorException('Could not refresh access token');
    }

    // if (!storedTokenData) {
    //   throw new UnauthorizedException('Invalid refresh token');
    // }

    // // Use UserService to generate a new access token
    // const newAccessToken = await this.userService.getNewAccessToken(
    //   storedTokenData.userId,
    // );
    // return { accessToken: newAccessToken };
  }

  // Retrieves all users with pagination

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Query('page', new ParseIntPipe()) page: number = 1,
    @Query('limit', new ParseIntPipe()) limit: number = 10,
  ) {
    return this.userService.findAll(page, limit);
  }

  // Handles creating new users

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    // return this.userService.create(createUserDto);
    try {
      await this.userService.create(createUserDto);
      return {
        code: HttpStatus.CREATED,
        status: 'Success',
        description: 'User created successfully.',
      };
    } catch (error) {
      throw new HttpException(
        {
          code: HttpStatus.BAD_REQUEST,
          status: 'Bad Request',
          description: 'Error creating user.',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Retrieve a user based on the id

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    try {
      const user = await this.userService.findOne(id);
      const { password, ...userWithoutPassword } = user;

      return {
        code: HttpStatus.OK,
        status: 'Success',
        description: 'User retrieved successfully.',
        user: userWithoutPassword,
      };
    } catch (error) {
      throw new HttpException(
        {
          code: HttpStatus.NOT_FOUND,
          status: 'Not Found',
          description: 'User not found.',
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  // Update a user

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    try {
      await this.userService.update(+id, updateUserDto);
      return {
        code: HttpStatus.OK,
        status: 'Success',
        description: 'User updated successfully.',
      };
    } catch (error) {
      throw new HttpException(
        {
          code: HttpStatus.NOT_FOUND,
          status: 'Not Found',
          description: 'User not found.',
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  // Delete a user

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string) {
    try {
      await this.userService.remove(+id);

      return {
        code: HttpStatus.OK,
        status: 'Success',
        description: 'User deleted successfully.',
      };
    } catch (error) {
      throw new HttpException(
        {
          code: HttpStatus.NOT_FOUND,
          status: 'Not Found',
          description: 'User not found.',
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Post('logout')
  async logout(@Body() body) {
    const { refreshToken } = body;

    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    // Call UserService to handle logout process
    await this.userService.logout(refreshToken);

    return {
      code: HttpStatus.OK,
      status: 'Success',
      description: 'Logged out successfully',
    };
  }
}
