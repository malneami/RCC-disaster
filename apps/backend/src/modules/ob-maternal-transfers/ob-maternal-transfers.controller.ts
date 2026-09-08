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
import { ObMaternalTransfersService } from './ob-maternal-transfers.service';
import { CreateObMaternalTransferDto } from './dto/create-ob-maternal-transfer.dto';
import { UpdateObMaternalTransferDto } from './dto/update-ob-maternal-transfer.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ObMaternalTransferStatus } from '@prisma/client';

@Controller('ob-maternal-transfers')
@UseGuards(JwtAuthGuard)
export class ObMaternalTransfersController {
  constructor(private readonly obMaternalTransfersService: ObMaternalTransfersService) {}

  @Post()
  async create(@Body() dto: CreateObMaternalTransferDto, @Request() req: any) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }
    return this.obMaternalTransfersService.create(dto, userId);
  }

  @Get('kpi-summary')
  async getKPISummary(
    @Query('hospitalId') hospitalId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.obMaternalTransfersService.getKPISummary({
      hospitalId,
      startDate,
      endDate,
    });
  }

  @Get()
  async findAll(
    @Query('ticketId') ticketId?: string,
    @Query('patientId') patientId?: string,
    @Query('status') status?: ObMaternalTransferStatus,
    @Query('referringFacilityId') referringFacilityId?: string,
    @Query('destinationHospitalId') destinationHospitalId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.obMaternalTransfersService.findAll({
      ticketId,
      patientId,
      status,
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
    return this.obMaternalTransfersService.findById(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateObMaternalTransferDto) {
    return this.obMaternalTransfersService.update(id, dto);
  }
}
