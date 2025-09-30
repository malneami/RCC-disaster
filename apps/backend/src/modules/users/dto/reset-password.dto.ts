import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';

export class AdminResetPasswordDto {
  @IsString({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(100, { message: 'Password must not exceed 100 characters' })
  password!: string;

  @IsOptional()
  @IsString({ message: 'Admin comments must be a string' })
  @MaxLength(500, { message: 'Admin comments must not exceed 500 characters' })
  adminComments?: string;
}
