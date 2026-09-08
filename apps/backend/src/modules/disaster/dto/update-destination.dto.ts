import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateDestinationDto {
  @ApiProperty({ description: 'Destination hospital ID' })
  @IsNotEmpty()
  @IsUUID()
  destinationHospitalId!: string;
}
