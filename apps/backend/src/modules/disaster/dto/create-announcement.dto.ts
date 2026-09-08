import { IsArray, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAnnouncementDto {
  @ApiProperty({ description: 'Disaster incident ID' })
  @IsNotEmpty()
  @IsUUID()
  incidentId!: string;

  @ApiProperty({ type: [String], description: 'Target hospital IDs' })
  @IsArray()
  @IsUUID('4', { each: true })
  targetHospitalIds!: string[];
}
