import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

export class StrokeFilterDto {
  @IsOptional()
  @IsString()
  hospitalId?: string;

  @IsOptional()
  @IsString()
  originHospitalId?: string;

  @IsOptional()
  @IsString()
  destinationHospitalId?: string;

  @IsOptional()
  @IsEnum(['ISCHEMIC', 'HEMORRHAGIC', 'TIA', 'UNKNOWN'])
  strokeType?: 'ISCHEMIC' | 'HEMORRHAGIC' | 'TIA' | 'UNKNOWN';

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsEnum(['AMBULANCE_RED_CRESCENT', 'PRIVATE_CAR', 'TRANSFERRED_FROM_ANOTHER_HOSPITAL'])
  modeOfArrival?: 'AMBULANCE_RED_CRESCENT' | 'PRIVATE_CAR' | 'TRANSFERRED_FROM_ANOTHER_HOSPITAL';

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
