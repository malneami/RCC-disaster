import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DriverFilterDto {
  @ApiProperty({ description: 'Search term for driver name or email', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ description: 'Filter by driver status', enum: ['ACTIVE', 'INACTIVE'], required: false })
  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE'])
  status?: 'ACTIVE' | 'INACTIVE';

  @ApiProperty({ description: 'Filter by hospital ID', required: false })
  @IsOptional()
  @IsString()
  hospitalId?: string;

  @ApiProperty({ description: 'Page number for pagination', required: false, default: 1 })
  @IsOptional()
  page?: number;

  @ApiProperty({ description: 'Number of items per page', required: false, default: 10 })
  @IsOptional()
  limit?: number;
}

