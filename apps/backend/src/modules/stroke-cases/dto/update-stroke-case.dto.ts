import { PartialType } from '@nestjs/mapped-types';
import { CreateStrokeCaseDto } from './create-stroke-case.dto';

export class UpdateStrokeCaseDto extends PartialType(CreateStrokeCaseDto) {}