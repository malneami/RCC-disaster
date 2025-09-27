import { IsString, IsEmail, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDriverDto {
  @ApiProperty({ description: 'Driver first name' })
  @IsString()
  firstName!: string;

  @ApiProperty({ description: 'Driver last name' })
  @IsString()
  lastName!: string;

  @ApiProperty({ description: 'Driver email address', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'Driver phone number' })
  @IsString()
  phoneNumber!: string;

  @ApiProperty({ description: 'Hospital ID where driver is assigned', required: false })
  @IsOptional()
  @IsString()
  hospitalId?: string;

  @ApiProperty({ description: 'Driver status', enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' })
  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE'])
  status?: 'ACTIVE' | 'INACTIVE';
}
