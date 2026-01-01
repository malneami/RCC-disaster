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
  Res,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { TraumaCasesService } from './trauma-cases.service';
import { CreateTraumaCaseDto } from './dto/create-trauma-case.dto';
import { UpdateTraumaCaseDto } from './dto/update-trauma-case.dto';
import { TraumaFilterDto } from './dto/trauma-filter.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Public } from '../../auth/decorators/public.decorator';
import { TraumaModeOfArrival, TraumaMechanismOfInjury } from '@prisma/client';
import { TraumaExportService } from './services/trauma-export.service';

@Controller('trauma-cases')
@UseGuards(JwtAuthGuard)
export class TraumaCasesController {
  constructor(
    private readonly traumaCasesService: TraumaCasesService,
    private readonly traumaExportService: TraumaExportService,
  ) {}

  @Post()
  @Public()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createTraumaCaseDto: CreateTraumaCaseDto, @Request() req: any) {
    const userId = req.user?.id || '4600ecc0-c41b-4d99-8ddd-78ef909182cb';
    return this.traumaCasesService.create(createTraumaCaseDto, userId);
  }

  @Get()
  @Public()
  async findAll(
    @Query('patientId') patientId?: string,
    @Query('originHospitalId') originHospitalId?: string,
    @Query('destinationHospitalId') destinationHospitalId?: string,
    @Query('modeOfArrival') modeOfArrival?: TraumaModeOfArrival,
    @Query('mechanismOfInjury') mechanismOfInjury?: TraumaMechanismOfInjury,
    @Query('criticalCase') criticalCase?: boolean,
    @Query('transferCase') transferCase?: boolean,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const filters = {
      patientId,
      originHospitalId,
      destinationHospitalId,
      modeOfArrival,
      mechanismOfInjury,
      criticalCase,
      transferCase,
      startDate,
      endDate,
      search,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    };

    return this.traumaCasesService.findAll(filters);
  }

  @Get('kpis')
  @Public()
  async getKPIs(
    @Query('hospitalId') hospitalId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.traumaCasesService.getKPISummary(hospitalId, startDate, endDate);
  }

  @Get('export')
  @Public()
  async exportToExcel(@Query() filters: TraumaFilterDto, @Res() res: Response) {
    try {
      const exportResult = await this.traumaExportService.exportTraumaCasesToExcel(filters);
      
      res.setHeader('Content-Type', exportResult.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);
      res.send(exportResult.buffer);
    } catch (error) {
      console.error('Export error:', error);
      throw new BadRequestException('Failed to export trauma cases');
    }
  }

  @Get(':id')
  @Public()
  async findOne(@Param('id') id: string) {
    return this.traumaCasesService.findOne(id);
  }

  @Patch(':id')
  @Public()
  async update(
    @Param('id') id: string,
    @Body() updateTraumaCaseDto: UpdateTraumaCaseDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || '4600ecc0-c41b-4d99-8ddd-78ef909182cb';
    return this.traumaCasesService.update(id, updateTraumaCaseDto, userId);
  }

  @Delete(':id')
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    return this.traumaCasesService.remove(id);
  }
}
