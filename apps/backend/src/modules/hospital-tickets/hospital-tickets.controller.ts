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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { HospitalTicketsService } from './hospital-tickets.service';
import { CreateHospitalTicketDto, UpdateHospitalTicketDto } from './dto/create-hospital-ticket.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Hospital Tickets')
@Controller('hospital-tickets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class HospitalTicketsController {
  constructor(private readonly hospitalTicketsService: HospitalTicketsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new hospital ticket' })
  @ApiResponse({ status: 201, description: 'Hospital ticket created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  create(@Body() createHospitalTicketDto: CreateHospitalTicketDto, @Request() req: any) {
    return this.hospitalTicketsService.create(createHospitalTicketDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all hospital tickets' })
  @ApiResponse({ status: 200, description: 'List of hospital tickets' })
  @ApiQuery({ name: 'hospitalId', required: false, description: 'Filter by hospital ID' })
  findAll(@Query('hospitalId') hospitalId?: string) {
    return this.hospitalTicketsService.findAll(hospitalId);
  }

  @Get('open')
  @ApiOperation({ summary: 'Get open hospital tickets' })
  @ApiResponse({ status: 200, description: 'List of open hospital tickets' })
  @ApiQuery({ name: 'hospitalId', required: false, description: 'Filter by hospital ID' })
  findOpen(@Query('hospitalId') hospitalId?: string) {
    return this.hospitalTicketsService.findOpen(hospitalId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get hospital tickets statistics' })
  @ApiResponse({ status: 200, description: 'Hospital tickets statistics' })
  @ApiQuery({ name: 'hospitalId', required: false, description: 'Filter by hospital ID' })
  getStats(@Query('hospitalId') hospitalId?: string) {
    return this.hospitalTicketsService.getStats(hospitalId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a hospital ticket by ID' })
  @ApiResponse({ status: 200, description: 'Hospital ticket found' })
  @ApiResponse({ status: 404, description: 'Hospital ticket not found' })
  findOne(@Param('id') id: string) {
    return this.hospitalTicketsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a hospital ticket' })
  @ApiResponse({ status: 200, description: 'Hospital ticket updated successfully' })
  @ApiResponse({ status: 404, description: 'Hospital ticket not found' })
  update(@Param('id') id: string, @Body() updateHospitalTicketDto: UpdateHospitalTicketDto) {
    return this.hospitalTicketsService.update(id, updateHospitalTicketDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a hospital ticket' })
  @ApiResponse({ status: 200, description: 'Hospital ticket deleted successfully' })
  @ApiResponse({ status: 404, description: 'Hospital ticket not found' })
  remove(@Param('id') id: string) {
    return this.hospitalTicketsService.remove(id);
  }
}
