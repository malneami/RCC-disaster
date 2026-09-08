import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  IsDateString,
  Min,
  Max,
} from 'class-validator';

export class CreateCaseFeedbackDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  ticketId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  reviewerName!: string;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  reviewDate!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  receivingConsultant?: string;

  // Section B - Operational Performance
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  activationAppropriateness!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  activationInappropriateReason?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  activationOtherReason?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  conferenceCallEffectiveness!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  conferenceCallIssue?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  conferenceCallIssueOther?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  destinationAppropriateness!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  destinationIssueReason?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  destinationIssueOther?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  transportSafety!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  transportSafetyIssue?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  transportSafetyIssueOther?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  teamSuitability!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  teamInadequacyReason?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  teamInadequacyOther?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  documentationQuality!: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  documentationMissingElements?: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  documentationMissingOther?: string;

  // Section C - Pathway-Specific
  @ApiPropertyOptional()
  @IsOptional()
  pathwayEvaluation?: any;

  // Section D - Outcome Assessment
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  patientOutcome!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  perinatalOutcome?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  complicationPreventable?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  preventableStage?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  preventableStageOther?: string;

  // Section E - Overall Evaluation
  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  rccCoordinationRating!: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  additionalComments?: string;
}
