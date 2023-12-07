import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column({ default: false })
  flag: boolean;

  @Column({ nullable: true, length: 4 })
  otp: string;

  @Column({ nullable: true })
  requestedAt: Date;
}
