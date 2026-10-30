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
import { NeonatalTransfersService } from './neonatal-transfers.service';
import { CreateNeonatalTransferDto } from './dto/create-neonatal-transfer.dto';
import { UpdateNeonatalTransferDto } from './dto/update-neonatal-transfer.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { NeonatalTransferStatus } from '@prisma/client';

@Controller('neonatal-transfers')
@UseGuards(JwtAuthGuard)
export class NeonatalTransfersController {
  constructor(private readonly neonatalTransfersService: NeonatalTransfersService) {}

  @Post()
  async create(@Body() dto: CreateNeonatalTransferDto, @Request() req: any) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    return this.neonatalTransfersService.create(dto, userId);
  }

  @Get('kpi-summary')
  async getKPISummary(
    @Query('hospitalId') hospitalId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.neonatalTransfersService.getKPISummary({ hospitalId, startDate, endDate });
  }

  @Get()
  async findAll(
    @Query('ticketId') ticketId?: string,
    @Query('patientId') patientId?: string,
    @Query('status') status?: NeonatalTransferStatus,
    @Query('acuityLevel') acuityLevel?: string,
    @Query('requiredNicuLevel') requiredNicuLevel?: string,
    @Query('referringFacilityId') referringFacilityId?: string,
    @Query('destinationHospitalId') destinationHospitalId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.neonatalTransfersService.findAll({
      ticketId,
      patientId,
      status,
      acuityLevel,
      requiredNicuLevel,
      referringFacilityId,
      destinationHospitalId,
      startDate,
      endDate,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.neonatalTransfersService.findById(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateNeonatalTransferDto) {
    return this.neonatalTransfersService.update(id, dto);
  }
}
