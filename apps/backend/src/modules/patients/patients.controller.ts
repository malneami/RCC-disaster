import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { PatientsService } from './patients.service';
import { PatientSearchService } from './patient-search.service';
import { MedicalRecordsService } from '../medical-records/medical-records.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { UpdatePatientDto } from './dto/patient.dto';

@ApiTags('Patients')
@ApiBearerAuth('JWT-auth')
@Controller('patients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PatientsController {
  constructor(
    private readonly patientsService: PatientsService,
    private readonly patientSearchService: PatientSearchService,
    private readonly medicalRecordsService: MedicalRecordsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all patients with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'gender', required: false, type: String })
  @ApiQuery({ name: 'maritalStatus', required: false, type: String })
  @ApiQuery({ name: 'privacyLevel', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'bloodType', required: false, type: String })
  @ApiQuery({ name: 'hasInsurance', required: false, type: Boolean })
  @ApiQuery({ name: 'hospitalId', required: false, type: String })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('gender') gender?: string,
    @Query('maritalStatus') maritalStatus?: string,
    @Query('privacyLevel') privacyLevel?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('bloodType') bloodType?: string,
    @Query('hasInsurance') hasInsurance?: string,
    @Query('hospitalId') hospitalId?: string,
  ) {
    // Build filters object from individual query parameters
    const filters: any = {};
    if (search) filters.search = search;
    if (gender) filters.gender = gender;
    if (maritalStatus) filters.maritalStatus = maritalStatus;
    if (privacyLevel) filters.privacyLevel = privacyLevel;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (bloodType) filters.bloodType = bloodType;
    if (hasInsurance) filters.hasInsurance = hasInsurance === 'true';
    if (hospitalId) filters.hospitalId = hospitalId;

    return this.patientsService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      Object.keys(filters).length > 0 ? filters : undefined,
    );
  }

  @Get('search')
  @ApiOperation({ summary: 'Search patients by name, MRN, or other criteria' })
  @ApiQuery({ name: 'q', description: 'Search query' })
  async search(@Query('q') query: string) {
    return this.patientsService.search(query);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.DATA_COLLECTOR, UserRole.CATH_LAB_USER)
  @ApiOperation({ summary: 'Create a new patient' })
  async create(@Body() createPatientDto: any, @Request() req: any) {
    return this.patientsService.create(createPatientDto, req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get patient by ID' })
  @ApiParam({ name: 'id', description: 'Patient ID' })
  async findById(@Param('id') id: string) {
    return this.patientsService.findById(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.DATA_COLLECTOR, UserRole.CATH_LAB_USER)
  @ApiOperation({ summary: 'Update patient by ID' })
  @ApiParam({ name: 'id', description: 'Patient ID' })
  async update(@Param('id') id: string, @Body() updatePatientDto: UpdatePatientDto, @Request() req: any) {
    return this.patientsService.update(id, updatePatientDto, req.user.id);
  }

  @Get(':id/export')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.DATA_COLLECTOR, UserRole.CATH_LAB_USER)
  @ApiOperation({ summary: 'Export patient data' })
  @ApiParam({ name: 'id', description: 'Patient ID' })
  @ApiQuery({ name: 'format', required: false, enum: ['PDF', 'JSON', 'CSV'] })
  @ApiQuery({ name: 'includeMedicalRecords', required: false, type: Boolean })
  @ApiQuery({ name: 'includeAccessLogs', required: false, type: Boolean })
  async exportPatient(
    @Param('id') id: string,
    @Query('format') format: 'PDF' | 'JSON' | 'CSV' = 'PDF',
    @Query('includeMedicalRecords') includeMedicalRecords: string = 'true',
    @Query('includeAccessLogs') includeAccessLogs: string = 'false',
    @Request() req: any,
    @Res() res: Response,
  ) {
    const result = await this.patientsService.exportPatient(
      id,
      format,
      {
        includeMedicalRecords: includeMedicalRecords === 'true',
        includeAccessLogs: includeAccessLogs === 'true',
      },
      req.user.id,
    );

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.data);
  }

  @Get(':id/medical-records')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.DATA_COLLECTOR, UserRole.CATH_LAB_USER)
  @ApiOperation({ summary: 'Get medical records for a specific patient' })
  @ApiParam({ name: 'id', description: 'Patient ID' })
  async getMedicalRecords(@Param('id') patientId: string) {
    return this.medicalRecordsService.findByPatient(patientId);
  }

  @Get('search/national-id')
  @ApiOperation({ summary: 'Search patients by National ID (partial match)' })
  @ApiQuery({ name: 'q', description: 'Partial National ID (minimum 4 digits)', required: true })
  async searchByNationalId(@Query('q') query: string) {
    return this.patientSearchService.searchByNationalId(query);
  }

  @Get('search/name')
  @ApiOperation({ summary: 'Search patients by name' })
  @ApiQuery({ name: 'q', description: 'Name search query (minimum 2 characters)', required: true })
  async searchByName(@Query('q') query: string) {
    return this.patientSearchService.searchByName(query);
  }

  @Get('timeline/:patientId')
  @ApiOperation({ summary: 'Get patient timeline (all stroke cases and events)' })
  @ApiParam({ name: 'patientId', description: 'Patient ID' })
  async getPatientTimeline(@Param('patientId') patientId: string) {
    return this.patientSearchService.getPatientTimeline(patientId);
  }

  @Get('timeline/national-id/:nationalId')
  @ApiOperation({ summary: 'Get patient timeline by National ID' })
  @ApiParam({ name: 'nationalId', description: 'Patient National ID' })
  async getPatientTimelineByNationalId(@Param('nationalId') nationalId: string) {
    return this.patientSearchService.getPatientTimelineByNationalId(nationalId);
  }
}