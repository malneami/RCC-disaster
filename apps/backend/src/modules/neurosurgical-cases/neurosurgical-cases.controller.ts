import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { NeurosurgicalCaseStatus, NeurosurgicalSeverity } from '@prisma/client';
import { NeurosurgicalCasesService } from './neurosurgical-cases.service';
import {
  ActivateFromTicketDto,
  CreateNeurosurgicalCaseDto,
  UpdateNeurosurgicalCaseDto,
} from './dto/neurosurgical-case.dto';

@ApiTags('Neurosurgical Cases')
@ApiBearerAuth('JWT-auth')
@Controller('neurosurgical-cases')
@UseGuards(JwtAuthGuard)
export class NeurosurgicalCasesController {
  constructor(private readonly neurosurgicalCasesService: NeurosurgicalCasesService) {}

  @Post()
  @ApiOperation({ summary: 'Create neurosurgical pathway case' })
  async create(@Body() dto: CreateNeurosurgicalCaseDto, @Request() req: any) {
    return this.neurosurgicalCasesService.create(dto, req.user.id);
  }

  @Post('from-ticket/:ticketId')
  @ApiOperation({ summary: 'Activate neurosurgical pathway from existing ticket' })
  async activateFromTicket(
    @Param('ticketId') ticketId: string,
    @Body() dto: ActivateFromTicketDto,
    @Request() req: any,
  ) {
    return this.neurosurgicalCasesService.activateFromTicket(ticketId, dto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List neurosurgical cases' })
  async findAll(
    @Query('ticketId') ticketId?: string,
    @Query('patientId') patientId?: string,
    @Query('status') status?: NeurosurgicalCaseStatus,
    @Query('severity') severity?: NeurosurgicalSeverity,
    @Query('originHospitalId') originHospitalId?: string,
    @Query('destinationHospitalId') destinationHospitalId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.neurosurgicalCasesService.findAll({
      ticketId,
      patientId,
      status,
      severity,
      originHospitalId,
      destinationHospitalId,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Get('kpis')
  @ApiOperation({ summary: 'Neurosurgical KPI aggregate summary' })
  async getKpiSummary(
    @Query('hospitalId') hospitalId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.neurosurgicalCasesService.getKpiSummary({
      hospitalId,
      startDate,
      endDate,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get neurosurgical case by id' })
  async findById(@Param('id') id: string) {
    return this.neurosurgicalCasesService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update neurosurgical case' })
  async update(@Param('id') id: string, @Body() dto: UpdateNeurosurgicalCaseDto) {
    return this.neurosurgicalCasesService.update(id, dto);
  }

  @Post(':id/close')
  @ApiOperation({ summary: 'Close neurosurgical case (requires disposition + outcome)' })
  async close(@Param('id') id: string, @Request() req: any) {
    return this.neurosurgicalCasesService.close(id, req.user.id);
  }
}
