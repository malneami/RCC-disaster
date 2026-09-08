import { PartialType } from '@nestjs/mapped-types';
import { CreateObMaternalTransferDto } from './create-ob-maternal-transfer.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { ObMaternalTransferStatus } from '@prisma/client';

export class UpdateObMaternalTransferDto extends PartialType(CreateObMaternalTransferDto) {
  @IsOptional()
  @IsEnum(ObMaternalTransferStatus)
  status?: ObMaternalTransferStatus;
}
