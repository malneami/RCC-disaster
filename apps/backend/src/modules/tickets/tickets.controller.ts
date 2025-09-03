import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto, UpdateTicketStatusDto, AssignTicketDto } from './dto/update-ticket.dto';
import { TicketFilterDto } from './dto/ticket-filter.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

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
}