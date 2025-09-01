import { IsString, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { HospitalTicketType, HospitalTicketStatus, TicketPriority } from '@prisma/client';

export class CreateHospitalTicketDto {
  @ApiProperty({ description: 'Ticket title' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ description: 'Ticket description' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ description: 'Ticket type', enum: HospitalTicketType })
  @IsEnum(HospitalTicketType)
  type!: HospitalTicketType;

  @ApiProperty({ description: 'Ticket priority', enum: TicketPriority })
  @IsEnum(TicketPriority)
  priority!: TicketPriority;

  @ApiProperty({ description: 'Ticket status', enum: HospitalTicketStatus })
  @IsEnum(HospitalTicketStatus)
  @IsOptional()
  status?: HospitalTicketStatus;

  @ApiProperty({ description: 'Hospital ID' })
  @IsString()
  @IsNotEmpty()
  hospitalId!: string;

  @ApiProperty({ description: 'Assigned user ID' })
  @IsString()
  @IsOptional()
  assignedToId?: string;
}

export class UpdateHospitalTicketDto {
  @ApiProperty({ description: 'Ticket title' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ description: 'Ticket description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Ticket type', enum: HospitalTicketType })
  @IsEnum(HospitalTicketType)
  @IsOptional()
  type?: HospitalTicketType;

  @ApiProperty({ description: 'Ticket priority', enum: TicketPriority })
  @IsEnum(TicketPriority)
  @IsOptional()
  priority?: TicketPriority;

  @ApiProperty({ description: 'Ticket status', enum: HospitalTicketStatus })
  @IsEnum(HospitalTicketStatus)
  @IsOptional()
  status?: HospitalTicketStatus;

  @ApiProperty({ description: 'Assigned user ID' })
  @IsString()
  @IsOptional()
  assignedToId?: string;
}
