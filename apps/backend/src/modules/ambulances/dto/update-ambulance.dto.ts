import { PartialType } from '@nestjs/swagger';
import { CreateAmbulanceDto } from './create-ambulance.dto';

export class UpdateAmbulanceDto extends PartialType(CreateAmbulanceDto) {}


