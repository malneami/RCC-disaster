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
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
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
  constructor(private readonly medicalRecordsService: MedicalRecordsService) { }

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
    return this.medicalRecordsService.update(id, updateMedicalRecordDto, req.user.id, req.user.role);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.DATA_COLLECTOR, UserRole.CATH_LAB_USER)
  @ApiOperation({ summary: 'Delete a medical record (soft delete)' })
  @ApiParam({ name: 'id', description: 'Medical record ID' })
  @ApiResponse({ status: 200, description: 'Medical record deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - can only delete own records' })
  @ApiResponse({ status: 404, description: 'Medical record not found' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.medicalRecordsService.remove(id, req.user.id, req.user.role);
  }

  @Get('access-logs')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get medical record access logs with filtering (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'medicalRecordId', required: false, type: String })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'accessType', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getAccessLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('medicalRecordId') medicalRecordId?: string,
    @Query('userId') userId?: string,
    @Query('accessType') accessType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.medicalRecordsService.getAccessLogs({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
      medicalRecordId,
      userId,
      accessType,
      startDate,
      endDate,
    });
  }

  @Get(':id/access-logs')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get access logs for a specific medical record (Admin only)' })
  @ApiParam({ name: 'id', description: 'Medical record ID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getMedicalRecordAccessLogs(
    @Param('id') medicalRecordId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.medicalRecordsService.getAccessLogs({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
      medicalRecordId,
    });
  }

  @Post(':id/attachments')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.DATA_COLLECTOR, UserRole.CATH_LAB_USER)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload attachment to medical record' })
  @ApiParam({ name: 'id', description: 'Medical record ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Attachment uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file' })
  @ApiResponse({ status: 404, description: 'Medical record not found' })
  async uploadAttachment(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 50 * 1024 * 1024 }), // 50MB
          new FileTypeValidator({ fileType: /(image|video|application\/pdf)/ }),
        ],
      })
    ) file: { originalname: string; mimetype: string; size: number; buffer: Buffer },
    @Request() req: any,
  ) {
    return this.medicalRecordsService.uploadAttachment(id, file, req.user.id);
  }

  @Get('attachments/:attachmentId')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.DATA_COLLECTOR, UserRole.CATH_LAB_USER)
  @ApiOperation({ summary: 'Get attachment content' })
  @ApiParam({ name: 'attachmentId', description: 'Attachment ID' })
  @ApiResponse({ status: 200, description: 'Attachment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Attachment not found' })
  getAttachment(@Param('attachmentId') attachmentId: string) {
    return this.medicalRecordsService.getAttachment(attachmentId);
  }

  @Delete('attachments/:attachmentId')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.DATA_COLLECTOR, UserRole.CATH_LAB_USER)
  @ApiOperation({ summary: 'Delete an attachment' })
  @ApiParam({ name: 'attachmentId', description: 'Attachment ID' })
  @ApiResponse({ status: 200, description: 'Attachment deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - can only delete own attachments' })
  @ApiResponse({ status: 404, description: 'Attachment not found' })
  deleteAttachment(@Param('attachmentId') attachmentId: string, @Request() req: any) {
    return this.medicalRecordsService.deleteAttachment(attachmentId, req.user.id);
  }
}
