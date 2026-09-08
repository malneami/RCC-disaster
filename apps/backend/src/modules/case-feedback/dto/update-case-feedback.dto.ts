import { PartialType } from '@nestjs/swagger';
import { CreateCaseFeedbackDto } from './create-case-feedback.dto';

export class UpdateCaseFeedbackDto extends PartialType(CreateCaseFeedbackDto) {}
