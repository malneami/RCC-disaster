import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto, UpdateTicketStatusDto, AssignTicketDto } from './dto/update-ticket.dto';
import { UpdateEMSStatusDto } from './dto/update-ems-status.dto';
import { TicketFilterDto } from './dto/ticket-filter.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Tickets')
@ApiBearerAuth()
@Controller('tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

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
    
    return this.ticketsService.findAll(
      pageNum,
      limitNum,
      req?.user?.role,
      req?.user?.hospitalId,
      filters
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
}