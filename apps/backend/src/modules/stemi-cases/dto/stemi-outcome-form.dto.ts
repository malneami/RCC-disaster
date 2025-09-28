import { IsOptional, IsString, IsBoolean, IsDateString, IsInt, Min, Max } from 'class-validator';

export class StemiOutcomeFormDto {
  // PCI Procedure Phase
  @IsOptional()
  @IsDateString()
  cathLabActivationTime?: string;

  @IsOptional()
  @IsDateString()
  cathLabArrivalTime?: string;

  @IsOptional()
  @IsDateString()
  pciProcedureStartTime?: string;

  @IsOptional()
  @IsDateString()
  pciProcedureCompleteTime?: string;

  // Post-PCI Management Phase
  @IsOptional()
  @IsString()
  postPciComplications?: string;

  @IsOptional()
  @IsString()
  dischargeStatus?: string; // STABLE, COMPLICATIONS, TRANSFERRED, etc.

  @IsOptional()
  @IsString()
  dischargeMedications?: string;

  @IsOptional()
  @IsDateString()
  followUpAppointmentDate?: string;

  @IsOptional()
  @IsString()
  followUpAppointmentProvider?: string;

  // Follow-up Call Phase
  @IsOptional()
  @IsBoolean()
  followUpCallCompleted?: boolean;

  @IsOptional()
  @IsDateString()
  followUpCallDate?: string;

  // Outcome Form Management
  @IsOptional()
  @IsBoolean()
  outcomeFormCompleted?: boolean;

  @IsOptional()
  @IsDateString()
  outcomeFormCompletionDate?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  outcomePercentageCompleteness?: number;
}

export class UpdateStemiOutcomeFormDto {
  // PCI Procedure Phase
  @IsOptional()
  @IsDateString()
  cathLabActivationTime?: string;

  @IsOptional()
  @IsDateString()
  cathLabArrivalTime?: string;

  @IsOptional()
  @IsDateString()
  pciProcedureStartTime?: string;

  @IsOptional()
  @IsDateString()
  pciProcedureCompleteTime?: string;

  // Post-PCI Management Phase
  @IsOptional()
  @IsString()
  postPciComplications?: string;

  @IsOptional()
  @IsString()
  dischargeStatus?: string;

  @IsOptional()
  @IsString()
  dischargeMedications?: string;

  @IsOptional()
  @IsDateString()
  followUpAppointmentDate?: string;

  @IsOptional()
  @IsString()
  followUpAppointmentProvider?: string;

  // Follow-up Call Phase
  @IsOptional()
  @IsBoolean()
  followUpCallCompleted?: boolean;

  @IsOptional()
  @IsDateString()
  followUpCallDate?: string;

  // Outcome Form Management
  @IsOptional()
  @IsBoolean()
  outcomeFormCompleted?: boolean;

  @IsOptional()
  @IsDateString()
  outcomeFormCompletionDate?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  outcomePercentageCompleteness?: number;
}
