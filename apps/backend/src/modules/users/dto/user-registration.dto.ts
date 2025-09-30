import { IsEmail, IsString, IsOptional, IsEnum, MinLength, MaxLength } from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateUserRegistrationRequestDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email!: string;

  @IsString({ message: 'First name is required' })
  @MinLength(2, { message: 'First name must be at least 2 characters long' })
  @MaxLength(50, { message: 'First name must not exceed 50 characters' })
  firstName!: string;

  @IsString({ message: 'Last name is required' })
  @MinLength(2, { message: 'Last name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Last name must not exceed 50 characters' })
  lastName!: string;

  @IsString({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(100, { message: 'Password must not exceed 100 characters' })
  password!: string;

  @IsOptional()
  @IsString({ message: 'Phone number must be a string' })
  phoneNumber?: string;

  @IsEnum(UserRole, { message: 'Please select a valid role' })
  requestedRole!: UserRole;

  @IsOptional()
  @IsString({ message: 'Hospital ID must be a string' })
  hospitalId?: string;

  @IsOptional()
  @IsString({ message: 'Justification must be a string' })
  @MaxLength(500, { message: 'Justification must not exceed 500 characters' })
  justification?: string;
}

export class ApproveUserRegistrationRequestDto {
  @IsOptional()
  @IsString({ message: 'Admin comments must be a string' })
  @MaxLength(500, { message: 'Admin comments must not exceed 500 characters' })
  adminComments?: string;
}

export class RejectUserRegistrationRequestDto {
  @IsString({ message: 'Admin comments are required for rejection' })
  @MaxLength(500, { message: 'Admin comments must not exceed 500 characters' })
  adminComments!: string;
}
