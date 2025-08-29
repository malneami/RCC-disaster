import { Controller, Get, Param, Query, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ServiceType } from '@prisma/client';
import { TicketsService } from './tickets.service';

@ApiTags('Tickets')
@ApiBearerAuth('JWT-auth')
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all tickets with pagination and role-based filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Request() req?: any,
  ) {
    return this.ticketsService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      req.user?.role,
      req.user?.hospitalId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ticket by ID' })
  @ApiParam({ name: 'id', description: 'Ticket ID' })
  async findById(@Param('id') id: string) {
    return this.ticketsService.findById(id);
  }
}