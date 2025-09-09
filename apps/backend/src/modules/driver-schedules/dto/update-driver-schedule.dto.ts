import { PartialType } from '@nestjs/swagger';
import { CreateDriverScheduleDto } from './create-driver-schedule.dto';

export class UpdateDriverScheduleDto extends PartialType(CreateDriverScheduleDto) {}


