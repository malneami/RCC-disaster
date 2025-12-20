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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EmsAssignmentsService } from './ems-assignments.service';
import { CreateEmsAssignmentDto } from './dto/create-ems-assignment.dto';
import { UpdateEmsAssignmentDto } from './dto/update-ems-assignment.dto';
import { AssignmentFilterDto } from './dto/assignment-filter.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('EMS Assignments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ems-assignments')
export class EmsAssignmentsController {
  constructor(private readonly emsAssignmentsService: EmsAssignmentsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.EMS, UserRole.RCC)
  @ApiOperation({ summary: 'Create a new EMS assignment' })
  @ApiResponse({ status: 201, description: 'EMS assignment created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 404, description: 'Resource not found' })
  async create(@Body() createAssignmentDto: CreateEmsAssignmentDto, @Request() req: any) {
    return this.emsAssignmentsService.create(createAssignmentDto, req.user.id);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.EMS, UserRole.RCC)
  @ApiOperation({ summary: 'Get all EMS assignments with optional filtering' })
  @ApiResponse({ status: 200, description: 'List of EMS assignments retrieved successfully' })
  async findAll(@Query() filter: AssignmentFilterDto) {
    return this.emsAssignmentsService.findAll(filter);
  }

  @Get('active')
  @Roles(UserRole.ADMIN, UserRole.EMS, UserRole.RCC)
  @ApiOperation({ summary: 'Get all active EMS assignments' })
  @ApiResponse({ status: 200, description: 'List of active EMS assignments retrieved successfully' })
  async getActiveAssignments() {
    return this.emsAssignmentsService.getActiveAssignments();
  }

  @Get('ambulance/:ambulanceId')
  @Roles(UserRole.ADMIN, UserRole.EMS, UserRole.RCC)
  @ApiOperation({ summary: 'Get assignments for a specific ambulance' })
  @ApiResponse({ status: 200, description: 'Assignments retrieved successfully' })
  async getAssignmentsByAmbulance(@Param('ambulanceId') ambulanceId: string) {
    return this.emsAssignmentsService.getAssignmentsByAmbulance(ambulanceId);
  }

  @Get('driver/:driverId')
  @Roles(UserRole.ADMIN, UserRole.EMS, UserRole.RCC)
  @ApiOperation({ summary: 'Get assignments for a specific driver' })
  @ApiResponse({ status: 200, description: 'Assignments retrieved successfully' })
  async getAssignmentsByDriver(@Param('driverId') driverId: string) {
    return this.emsAssignmentsService.getAssignmentsByDriver(driverId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.EMS, UserRole.RCC)
  @ApiOperation({ summary: 'Get EMS assignment by ID' })
  @ApiResponse({ status: 200, description: 'EMS assignment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'EMS assignment not found' })
  async findOne(@Param('id') id: string) {
    return this.emsAssignmentsService.findById(id);
  }

  @Get(':id/diagnose')
  @Roles(UserRole.ADMIN, UserRole.EMS, UserRole.RCC)
  @ApiOperation({ summary: 'Diagnose assignment status and zone logs' })
  @ApiResponse({ status: 200, description: 'Diagnostic information retrieved successfully' })
  async diagnoseAssignment(@Param('id') id: string) {
    return this.emsAssignmentsService.diagnoseAssignment(id);
  }

  @Post(':id/auto-fix')
  @Roles(UserRole.ADMIN, UserRole.EMS, UserRole.RCC)
  @ApiOperation({ summary: 'Auto-fix assignment status based on timestamps and zone logs' })
  @ApiResponse({ status: 200, description: 'Assignment status fixed successfully' })
  async autoFixAssignment(@Param('id') id: string) {
    return this.emsAssignmentsService.autoFixAssignmentStatus(id);
  }

  @Post('fix-all-departures')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Retroactively fix departure times for all assignments based on zone logs' })
  @ApiResponse({ status: 200, description: 'Departure times fixed successfully' })
  async fixAllDepartures() {
    return this.emsAssignmentsService.fixAllDepartureTimes();
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.EMS, UserRole.RCC)
  @ApiOperation({ summary: 'Update EMS assignment' })
  @ApiResponse({ status: 200, description: 'EMS assignment updated successfully' })
  @ApiResponse({ status: 404, description: 'EMS assignment not found' })
  async update(@Param('id') id: string, @Body() updateAssignmentDto: UpdateEmsAssignmentDto, @Request() req: any) {
    return this.emsAssignmentsService.update(id, updateAssignmentDto, req.user.id);
  }

  @Post(':id/start')
  @Roles(UserRole.ADMIN, UserRole.EMS, UserRole.RCC)
  @ApiOperation({ summary: 'Start EMS assignment journey' })
  @ApiResponse({ status: 200, description: 'Assignment started successfully' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  async startAssignment(@Param('id') id: string, @Request() req: any) {
    return this.emsAssignmentsService.update(id, { 
      status: 'EMS_ARRIVAL',
      actualArrivalTime: new Date().toISOString()
    }, req.user.id);
  }

  @Post(':id/arrived')
  @Roles(UserRole.ADMIN, UserRole.EMS, UserRole.RCC)
  @ApiOperation({ summary: 'Mark EMS assignment as arrived' })
  @ApiResponse({ status: 200, description: 'Assignment marked as arrived successfully' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  async markArrived(@Param('id') id: string, @Request() req: any) {
    return this.emsAssignmentsService.update(id, { 
      status: 'ARRIVED',
      journeyEndTime: new Date().toISOString()
    }, req.user.id);
  }

  @Post(':id/departed')
  @Roles(UserRole.ADMIN, UserRole.EMS, UserRole.RCC)
  @ApiOperation({ summary: 'Mark EMS assignment as departed' })
  @ApiResponse({ status: 200, description: 'Assignment marked as departed successfully' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  async markDeparted(@Param('id') id: string, @Request() req: any) {
    return this.emsAssignmentsService.update(id, { 
      status: 'DEPARTED',
      journeyStartTime: new Date().toISOString()
    }, req.user.id);
  }


  @Post(':id/complete')
  @Roles(UserRole.ADMIN, UserRole.EMS, UserRole.RCC)
  @ApiOperation({ summary: 'Complete EMS assignment' })
  @ApiResponse({ status: 200, description: 'Assignment completed successfully' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  async completeAssignment(@Param('id') id: string, @Request() req: any) {
    return this.emsAssignmentsService.update(id, { 
      status: 'ARRIVED',
      journeyEndTime: new Date().toISOString()
    }, req.user.id);
  }

  @Post(':id/start-location-monitoring')
  @Roles(UserRole.ADMIN, UserRole.EMS, UserRole.RCC)
  @ApiOperation({ summary: 'Start automatic location monitoring for EMS assignment' })
  @ApiResponse({ status: 200, description: 'Location monitoring started successfully' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  async startLocationMonitoring(@Param('id') id: string) {
    await this.emsAssignmentsService.startLocationMonitoring(id);
    return { message: 'Location monitoring started for assignment', assignmentId: id };
  }

  @Post('start-all-location-monitoring')
  @Roles(UserRole.ADMIN, UserRole.EMS, UserRole.RCC)
  @ApiOperation({ summary: 'Start location monitoring for all active EMS assignments' })
  @ApiResponse({ status: 200, description: 'Location monitoring started for all active assignments' })
  async startAllLocationMonitoring() {
    await this.emsAssignmentsService.startLocationMonitoringForAllActiveAssignments();
    return { message: 'Location monitoring started for all active assignments' };
  }

  @Get('active-for-monitoring')
  @Roles(UserRole.ADMIN, UserRole.EMS, UserRole.RCC)
  @ApiOperation({ summary: 'Get all active EMS assignments that should be monitored' })
  @ApiResponse({ status: 200, description: 'Active assignments retrieved successfully' })
  async getActiveAssignmentsForMonitoring() {
    return this.emsAssignmentsService.getActiveAssignmentsForMonitoring();
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.EMS)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete EMS assignment (soft delete)' })
  @ApiResponse({ status: 204, description: 'EMS assignment deleted successfully' })
  @ApiResponse({ status: 404, description: 'EMS assignment not found' })
  async remove(@Param('id') id: string) {
    await this.emsAssignmentsService.remove(id);
  }
}
