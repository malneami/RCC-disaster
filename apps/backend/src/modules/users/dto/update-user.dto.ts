import { IsString, IsOptional, IsEnum, MaxLength, MinLength } from 'class-validator';
import { UserRole } from '@prisma/client';

export class UpdateUserDto {
  @IsOptional()
  @IsEnum(UserRole, { message: 'Please select a valid role' })
  role?: UserRole;

  @IsOptional()
  @IsString({ message: 'Hospital ID must be a string' })
  hospitalId?: string;

  @IsOptional()
  @IsString({ message: 'First name must be a string' })
  @MinLength(2, { message: 'First name must be at least 2 characters long' })
  @MaxLength(50, { message: 'First name must not exceed 50 characters' })
  firstName?: string;

  @IsOptional()
  @IsString({ message: 'Last name must be a string' })
  @MinLength(2, { message: 'Last name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Last name must not exceed 50 characters' })
  lastName?: string;

  @IsOptional()
  @IsString({ message: 'Phone number must be a string' })
  phoneNumber?: string;

  @IsOptional()
  @IsString({ message: 'Admin comments must be a string' })
  @MaxLength(500, { message: 'Admin comments must not exceed 500 characters' })
  adminComments?: string;
}
