import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsBoolean,
  IsNotEmpty,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MaternalStatus, PerinatalStatus } from '@prisma/client';

export class CreatePregnancyOutcomeDto {
  @IsString()
  @IsNotEmpty()
  caseId!: string;

  @IsEnum(MaternalStatus)
  @IsNotEmpty()
  maternalStatus!: MaternalStatus;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  maternalIcuAdmission?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  massiveTransfusion?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  eclampsiaEvent?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  majorPph?: boolean;

  @IsEnum(PerinatalStatus)
  @IsNotEmpty()
  perinatalStatus!: PerinatalStatus;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  nicuAdmission?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  apgar5?: number;
}
