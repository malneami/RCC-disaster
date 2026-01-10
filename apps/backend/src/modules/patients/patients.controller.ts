import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, Res, Header, HttpCode, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { PatientsService } from './patients.service';
import { MedicalRecordsService } from '../medical-records/medical-records.service';
import { DuplicateDetectionService } from './services/duplicate-detection.service';
import { PatientMergeService } from './patient-merge.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreatePatientDto, UpdatePatientDto } from './dto/patient.dto';
import { CreateAccessLogDto, UpdateAccessLogDto } from './dto/access-log.dto';

@ApiTags('Patients')
@ApiBearerAuth('JWT-auth')
@Controller('patients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PatientsController {
  constructor(
    private readonly patientsService: PatientsService,
    private readonly medicalRecordsService: MedicalRecordsService,
    private readonly duplicateDetectionService: DuplicateDetectionService,
    private readonly patientMergeService: PatientMergeService,
  ) { }

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
    @Request() req?: any,
  ) {
    // Build filters object from individual query parameters
    const filters: any = {};
    if (search) {
      try {
        filters.search = decodeURIComponent(search).trim();
      } catch (error) {
        filters.search = search.trim();
      }
    }
    if (gender) filters.gender = gender;
    if (maritalStatus) filters.maritalStatus = maritalStatus;
    if (privacyLevel) filters.privacyLevel = privacyLevel;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (bloodType) filters.bloodType = bloodType;
    if (hasInsurance) filters.hasInsurance = hasInsurance === 'true';
    if (hospitalId) filters.hospitalId = hospitalId;

    const ipAddress = req?.ip || req?.headers?.['x-forwarded-for'] || 'unknown';
    const userAgent = req?.headers?.['user-agent'] || 'unknown';

    return this.patientsService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      Object.keys(filters).length > 0 ? filters : undefined,
      req?.user?.id,
      ipAddress,
      userAgent,
    );
  }

  @Get('search')
  @ApiOperation({ summary: 'Search patients by name, MRN, or other criteria' })
  @ApiQuery({ name: 'q', description: 'Search query' })
  async search(@Query('q') query: string) {
    return this.patientsService.search(query);
  }

  @Get('latest-case/:nationalId')
  @ApiOperation({ summary: 'Get latest case information for a patient by National ID' })
  @ApiParam({ name: 'nationalId', description: 'Patient National ID' })
  async getLatestCaseInfo(@Param('nationalId') nationalId: string) {
    return this.patientsService.getLatestCaseInfo(nationalId);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.DATA_COLLECTOR, UserRole.CATH_LAB_USER)
  @ApiOperation({ summary: 'Create a new patient' })
  async create(@Body() createPatientDto: CreatePatientDto, @Request() req: any) {
    try {
      console.log('Creating patient with data:', createPatientDto);
      const result = await this.patientsService.create(createPatientDto, req.user.id);
      console.log('Patient created successfully:', result);
      return result;
    } catch (error) {
      console.error('Error creating patient:', error);
      throw error;
    }
  }

  @Get('access-logs')
  @Roles(UserRole.ADMIN, UserRole.RCC)
  @ApiOperation({ summary: 'Get patient access logs with filtering (Admin/RCC only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'patientId', required: false, type: String })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'accessType', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getAccessLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('patientId') patientId?: string,
    @Query('userId') userId?: string,
    @Query('accessType') accessType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      // Validate and parse pagination parameters
      const pageNum = page ? Math.max(1, parseInt(page, 10)) : 1;
      const limitNum = limit ? Math.min(100, Math.max(1, parseInt(limit, 10))) : 50; // Max 100 per page

      // Validate access type if provided
      const validAccessTypes = ['VIEW', 'CREATE', 'UPDATE', 'DELETE', 'EXPORT', 'SEARCH'];
      if (accessType && !validAccessTypes.includes(accessType)) {
        // Return empty results for invalid access type instead of error
        return {
          data: [],
          total: 0,
          page: pageNum,
          limit: limitNum,
          pages: 0,
        };
      }

      // Validate date format if provided
      if (startDate && !/^\d{4}-\d{2}-\d{2}/.test(startDate)) {
        throw new BadRequestException('Invalid startDate format. Expected YYYY-MM-DD');
      }
      if (endDate && !/^\d{4}-\d{2}-\d{2}/.test(endDate)) {
        throw new BadRequestException('Invalid endDate format. Expected YYYY-MM-DD');
      }

      // Validate date range
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          throw new BadRequestException('Invalid date values');
        }
        if (start > end) {
          throw new BadRequestException('startDate must be before or equal to endDate');
        }
      }

      const result = await this.patientsService.getAccessLogs({
        page: pageNum,
        limit: limitNum,
        patientId,
        userId,
        accessType,
        startDate,
        endDate,
      });

      // Ensure we return a proper response structure
      if (!result || typeof result !== 'object') {
        return {
          data: [],
          total: 0,
          page: pageNum,
          limit: limitNum,
          pages: 0,
        };
      }

      // Ensure data is an array and response has correct pagination
      return {
        data: Array.isArray(result.data) ? result.data : [],
        total: result.total || 0,
        page: result.page ?? pageNum,
        limit: result.limit ?? limitNum,
        pages: result.pages ?? Math.ceil((result.total || 0) / (result.limit ?? limitNum)),
      };
    } catch (error) {
      console.error('[PatientsController] getAccessLogs error:', error);
      throw error;
    }
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get patient statistics' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'hospitalId', required: false, type: String })
  async getStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('hospitalId') hospitalId?: string,
  ) {
    return this.patientsService.getStatistics({ startDate, endDate, hospitalId });
  }

  @Get('duplicates/groups')
  @ApiOperation({ summary: 'Get all duplicate patient groups' })
  @ApiQuery({ name: 'confidenceThreshold', required: false, type: Number })
  async getDuplicateGroups(@Query('confidenceThreshold') confidenceThreshold?: string) {
    return this.patientsService.getDuplicateGroups(
      confidenceThreshold ? parseFloat(confidenceThreshold) : 0.8,
    );
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
    const ipAddress = req?.ip || req?.headers?.['x-forwarded-for'] || req?.socket?.remoteAddress || 'unknown';
    const userAgent = req?.headers?.['user-agent'] || 'unknown';
    return this.patientsService.update(id, updatePatientDto, req.user.id, ipAddress, userAgent);
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

    // Sanitize filename for HTTP header - remove non-ASCII characters (including Arabic)
    // HTTP headers only support ASCII characters; Arabic characters would cause ERR_INVALID_CHAR
    const safeFilename = result.filename.replace(/[^\x00-\x7F]/g, '').replace(/[-]+/g, '-').replace(/^-|-$/g, '') || `patient-${id}.${format.toLowerCase()}`;

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    res.send(result.data);

  }

  @Get(':id/medical-records')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.DATA_COLLECTOR, UserRole.CATH_LAB_USER)
  @ApiOperation({ summary: 'Get medical records for a specific patient' })
  @ApiParam({ name: 'id', description: 'Patient ID' })
  async getMedicalRecords(@Param('id') patientId: string) {
    return this.medicalRecordsService.findByPatient(patientId);
  }

  @Get(':id/duplicates')
  @ApiOperation({ summary: 'Detect duplicates for a specific patient' })
  @ApiParam({ name: 'id', description: 'Patient ID' })
  @ApiQuery({ name: 'threshold', required: false, type: Number })
  async detectDuplicates(
    @Param('id') patientId: string,
    @Query('threshold') threshold?: string,
  ) {
    return this.duplicateDetectionService.detectDuplicates(
      patientId,
      threshold ? parseFloat(threshold) : 0.8,
    );
  }

  @Post('duplicates/merge')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.DATA_COLLECTOR)
  @ApiOperation({ summary: 'Merge duplicate patients' })
  async mergeDuplicates(
    @Body() body: { primaryPatientId: string; duplicatePatientIds: string[] },
    @Request() req: any,
  ) {
    return this.patientsService.mergeDuplicates(
      body.primaryPatientId,
      body.duplicatePatientIds,
      req.user.id,
    );
  }

  @Post('duplicates/ignore')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.DATA_COLLECTOR)
  @ApiOperation({ summary: 'Ignore duplicate detection for specific patients' })
  async ignoreDuplicates(
    @Body() body: { patientIds: string[] },
  ) {
    return this.patientsService.ignoreDuplicates(body.patientIds);
  }

  @Get(':id/access-logs')
  @ApiOperation({ summary: 'Get access logs for a specific patient' })
  @ApiParam({ name: 'id', description: 'Patient ID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getPatientAccessLogs(
    @Param('id') patientId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.patientsService.getAccessLogs({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
      patientId,
    });
  }

  @Post('access-logs')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.DATA_COLLECTOR, UserRole.CATH_LAB_USER)
  @ApiOperation({ summary: 'Create a new patient access log' })
  @ApiResponse({ status: 201, description: 'Access log created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Patient or User not found' })
  async createAccessLog(
    @Body() createAccessLogDto: CreateAccessLogDto,
    @Request() req: any,
  ) {
    return this.patientsService.createAccessLog(createAccessLogDto, req.user.id, req.ip, req.get('User-Agent'));
  }

  @Put('access-logs/:logId')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.DATA_COLLECTOR, UserRole.CATH_LAB_USER)
  @ApiOperation({ summary: 'Update an existing patient access log' })
  @ApiParam({ name: 'logId', description: 'Access Log ID' })
  @ApiResponse({ status: 200, description: 'Access log updated successfully' })
  @ApiResponse({ status: 404, description: 'Access log not found' })
  async updateAccessLog(
    @Param('logId') logId: string,
    @Body() updateAccessLogDto: UpdateAccessLogDto,
    @Request() req: any,
  ) {
    return this.patientsService.updateAccessLog(logId, updateAccessLogDto);
  }
}