import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsEnum, IsOptional, Matches } from 'class-validator';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({
    description: 'User email address',
    example: 'newuser@rcc-healthcare.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  @IsString()
  @MinLength(2)
  firstName!: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  @IsString()
  @MinLength(2)
  lastName!: string;

  @ApiProperty({
    description: 'User phone number',
    example: '555-0123',
    required: false,
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({
    description: 'User role in the system',
    enum: UserRole,
    example: UserRole.DATA_COLLECTOR,
  })
  @IsEnum(UserRole)
  role!: UserRole;

  @ApiProperty({
    description: 'User password (min 8 chars, must include uppercase, lowercase, number, and special char)',
    example: 'SecurePass123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    {
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    },
  )
  password!: string;

  @ApiProperty({
    description: 'Hospital ID (required for hospital-specific roles)',
    required: false,
  })
  @IsOptional()
  @IsString()
  hospitalId?: string;
}