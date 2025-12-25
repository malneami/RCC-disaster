import { ApiProperty } from '@nestjs/swagger';
import { BedStatus, BedType } from '@prisma/client';

export class UnitInfoDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: BedType })
  bedType!: BedType;
}

export class HospitalInfoDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;
}

export class PatientInfoDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ required: false })
  nationalId?: string;

  @ApiProperty({ required: false })
  age?: number;

  @ApiProperty({ required: false })
  gender?: string;

  @ApiProperty({ required: false })
  mrn?: string;
}

export class BedResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  bedNumber!: string;

  @ApiProperty({ enum: BedStatus })
  status!: BedStatus;

  @ApiProperty({ required: false })
  location?: string;

  @ApiProperty()
  isOperational!: boolean;

  @ApiProperty({ type: UnitInfoDto })
  unit!: UnitInfoDto;

  @ApiProperty({ type: HospitalInfoDto })
  hospital!: HospitalInfoDto;

  @ApiProperty({ type: PatientInfoDto, required: false })
  currentPatient?: PatientInfoDto;
}

