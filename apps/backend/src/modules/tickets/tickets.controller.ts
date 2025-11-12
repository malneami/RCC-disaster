import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, Res, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { Response } from 'express';
import { TicketsService } from './tickets.service';
import { TicketExportService } from './services/ticket-export.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto, UpdateTicketStatusDto, AssignTicketDto } from './dto/update-ticket.dto';
import { UpdateEMSStatusDto } from './dto/update-ems-status.dto';
import { TicketFilterDto } from './dto/ticket-filter.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Tickets')
@ApiBearerAuth()
@Controller('tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TicketsController {
  constructor(
    private readonly ticketsService: TicketsService,
    private readonly ticketExportService: TicketExportService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.DATA_COLLECTOR, UserRole.CATH_LAB_USER)
  async create(@Body() createTicketDto: CreateTicketDto, @Request() req: any) {
    return this.ticketsService.create(createTicketDto, req.user.id, req.user.role);
  }

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('pathway') pathway?: string,
    @Query('originHospitalId') originHospitalId?: string,
    @Query('destinationHospitalId') destinationHospitalId?: string,
    @Query('patientId') patientId?: string,
    @Query('assignedToId') assignedToId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
    @Query('emsStatus') emsStatus?: string,
    @Request() req?: any
  ) {
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 10;
    
    // Build filters object from individual query parameters
    const filters: any = {};
    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (pathway) filters.pathway = pathway;
    if (originHospitalId) filters.originHospitalId = originHospitalId;
    if (destinationHospitalId) filters.destinationHospitalId = destinationHospitalId;
    if (patientId) filters.patientId = patientId;
    if (assignedToId) filters.assignedToId = assignedToId;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (search) filters.search = search;
    if (sortBy) filters.sortBy = sortBy;
    if (sortOrder) filters.sortOrder = sortOrder;
    if (emsStatus) filters.emsStatus = emsStatus;
    
    return this.ticketsService.findAll(
      pageNum,
      limitNum,
      req?.user?.role,
      req?.user?.hospitalId,
      filters,
      req?.user?.id,
    );
  }

  @Get('statistics')
  async getStatistics(@Request() req: any) {
    return this.ticketsService.getStatistics(req.user.role, req.user.hospitalId);
  }

  @Get('statistics/priority')
  async getTicketsByPriority(@Request() req: any) {
    return this.ticketsService.getTicketsByPriority(req.user.role, req.user.hospitalId);
  }

  @Get('statistics/pathway')
  async getTicketsByPathway(@Request() req: any) {
    return this.ticketsService.getTicketsByPathway(req.user.role, req.user.hospitalId);
  }

  @Get('performance/comparison')
  @ApiOperation({ summary: 'Get performance comparison data by time period' })
  @ApiQuery({ name: 'period', required: true, description: 'Time period: daily, weekly, or monthly' })
  @ApiQuery({ name: 'hospitalId', required: false, description: 'Filter by hospital ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (ISO string)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (ISO string)' })
  async getPerformanceComparison(
    @Query('period') period: 'daily' | 'weekly' | 'monthly',
    @Request() req: any,
    @Query('hospitalId') hospitalId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.ticketsService.getPerformanceComparison(
      period,
      req.user.role,
      req.user.hospitalId,
      hospitalId,
      startDate,
      endDate
    );
  }

  @Get('export')
  @Public()
  async exportToExcel(@Query() filters: TicketFilterDto, @Res() res: Response) {
    try {
      const exportResult = await this.ticketExportService.exportTicketsToExcel(filters);
      
      res.setHeader('Content-Type', exportResult.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);
      res.send(exportResult.buffer);
    } catch (error) {
      throw new BadRequestException('Failed to export tickets');
    }
  }

  @Get(':id/recommended-ambulances')
  @Roles(UserRole.ADMIN, UserRole.RCC)
  @ApiOperation({ summary: 'Get recommended ambulances for a ticket with scoring' })
  async getRecommendedAmbulances(@Param('id') id: string) {
    return this.ticketsService.getRecommendedAmbulances(id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.ticketsService.findById(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTicketDto: UpdateTicketDto,
    @Request() req: any
  ) {
    return this.ticketsService.update(id, updateTicketDto, req.user.id, req.user.role);
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateTicketStatusDto,
    @Request() req: any
  ) {
    return this.ticketsService.updateStatus(id, updateStatusDto, req.user.id, req.user.role);
  }

  @Put(':id/assign')
  @Roles(UserRole.ADMIN, UserRole.RCC)
  async assign(
    @Param('id') id: string,
    @Body() assignTicketDto: AssignTicketDto,
    @Request() req: any
  ) {
    return this.ticketsService.assign(id, assignTicketDto, req.user.id, req.user.role);
  }

  @Put(':id/ems-status')
  @Roles(UserRole.EMS, UserRole.ADMIN, UserRole.RCC)
  async updateEMSStatus(
    @Param('id') id: string,
    @Body() updateEMSStatusDto: UpdateEMSStatusDto,
    @Request() req: any
  ) {
    return this.ticketsService.updateEMSStatus(
      id, 
      updateEMSStatusDto.emsStatus, 
      req.user.id, 
      req.user.role,
      updateEMSStatusDto.notes
    );
  }

  @Put(':id/acknowledge')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.HOSPITAL_USER, UserRole.CATH_LAB_USER)
  @ApiOperation({ summary: 'Acknowledge a critical case ticket' })
  async acknowledge(
    @Param('id') id: string,
    @Request() req: any
  ) {
    return this.ticketsService.acknowledge(id, req.user.id, req.user.role);
  }

  @Get('access-logs')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get ticket access logs with filtering (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'ticketId', required: false, type: String })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'accessType', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getAccessLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('ticketId') ticketId?: string,
    @Query('userId') userId?: string,
    @Query('accessType') accessType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.ticketsService.getAccessLogs({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
      ticketId,
      userId,
      accessType,
      startDate,
      endDate,
    });
  }

  @Get(':id/access-logs')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get access logs for a specific ticket (Admin only)' })
  @ApiParam({ name: 'id', description: 'Ticket ID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getTicketAccessLogs(
    @Param('id') ticketId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.ticketsService.getAccessLogs({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
      ticketId,
    });
  }
}