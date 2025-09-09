import { PartialType } from '@nestjs/mapped-types';
import { CreateTraumaCaseDto } from './create-trauma-case.dto';

export class UpdateTraumaCaseDto extends PartialType(CreateTraumaCaseDto) {}