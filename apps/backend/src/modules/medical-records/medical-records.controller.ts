import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { MedicalRecordsService } from './medical-records.service';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { UpdateMedicalRecordDto } from './dto/update-medical-record.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Medical Records')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('medical-records')
export class MedicalRecordsController {
  constructor(private readonly medicalRecordsService: MedicalRecordsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.DATA_COLLECTOR, UserRole.CATH_LAB_USER)
  @ApiOperation({ summary: 'Create a new medical record' })
  @ApiResponse({ status: 201, description: 'Medical record created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  create(@Body() createMedicalRecordDto: CreateMedicalRecordDto, @Request() req: any) {
    return this.medicalRecordsService.create(createMedicalRecordDto, req.user.id);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.DATA_COLLECTOR, UserRole.CATH_LAB_USER)
  @ApiOperation({ summary: 'Get all medical records with optional filters' })
  @ApiQuery({ name: 'patientId', required: false, description: 'Filter by patient ID' })
  @ApiQuery({ name: 'recordType', required: false, description: 'Filter by record type' })
  @ApiResponse({ status: 200, description: 'Medical records retrieved successfully' })
  findAll(
    @Query('patientId') patientId?: string,
    @Query('recordType') recordType?: string,
  ) {
    return this.medicalRecordsService.findAll(patientId, recordType as any);
  }

  @Get('patient/:patientId')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.DATA_COLLECTOR, UserRole.CATH_LAB_USER)
  @ApiOperation({ summary: 'Get all medical records for a specific patient' })
  @ApiParam({ name: 'patientId', description: 'Patient ID' })
  @ApiResponse({ status: 200, description: 'Medical records retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  findByPatient(@Param('patientId') patientId: string) {
    return this.medicalRecordsService.findByPatient(patientId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.DATA_COLLECTOR, UserRole.CATH_LAB_USER)
  @ApiOperation({ summary: 'Get a specific medical record by ID' })
  @ApiParam({ name: 'id', description: 'Medical record ID' })
  @ApiResponse({ status: 200, description: 'Medical record retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Medical record not found' })
  findOne(@Param('id') id: string) {
    return this.medicalRecordsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.DATA_COLLECTOR, UserRole.CATH_LAB_USER)
  @ApiOperation({ summary: 'Update a medical record' })
  @ApiParam({ name: 'id', description: 'Medical record ID' })
  @ApiResponse({ status: 200, description: 'Medical record updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - can only update own records' })
  @ApiResponse({ status: 404, description: 'Medical record not found' })
  update(
    @Param('id') id: string,
    @Body() updateMedicalRecordDto: UpdateMedicalRecordDto,
    @Request() req: any,
  ) {
    return this.medicalRecordsService.update(id, updateMedicalRecordDto, req.user.id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.DATA_COLLECTOR, UserRole.CATH_LAB_USER)
  @ApiOperation({ summary: 'Delete a medical record (soft delete)' })
  @ApiParam({ name: 'id', description: 'Medical record ID' })
  @ApiResponse({ status: 200, description: 'Medical record deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - can only delete own records' })
  @ApiResponse({ status: 404, description: 'Medical record not found' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.medicalRecordsService.remove(id, req.user.id);
  }
}
