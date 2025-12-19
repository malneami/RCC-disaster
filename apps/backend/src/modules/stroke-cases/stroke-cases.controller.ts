import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  ParseIntPipe,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { StrokeCasesService } from './stroke-cases.service';
import { StrokeExportService } from './services/stroke-export.service';
import { StrokeFilterDto } from './dto/stroke-filter.dto';
import { CreateStrokeCaseDto } from './dto/create-stroke-case.dto';
import { CreateStrokeCaseV2Dto } from './dto/create-stroke-case-v2.dto';
import { UpdateStrokeCaseDto } from './dto/update-stroke-case.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { UserRole } from '@prisma/client';

@Controller('stroke-cases')
export class StrokeCasesController {
  constructor(
    private readonly strokeCasesService: StrokeCasesService,
    private readonly strokeExportService: StrokeExportService,
  ) {}

  @Post()
  @Public()
  async create(@Body() createStrokeCaseDto: CreateStrokeCaseV2Dto, @Request() req: any) {
    console.log('=== CONTROLLER METHOD CALLED ===');
    console.log('Method: POST /stroke-cases');
    console.log('Timestamp:', new Date().toISOString());
    
    try {
      console.log('=== STROKE CASE CREATION DEBUG V2 ===');
      console.log('Received DTO:', JSON.stringify(createStrokeCaseDto, null, 2));
      console.log('DTO keys:', Object.keys(createStrokeCaseDto));
      console.log('User ID:', req.user?.id || '4600ecc0-c41b-4d99-8ddd-78ef909182cb');
      
      const result = await this.strokeCasesService.create(createStrokeCaseDto, req.user?.id || '4600ecc0-c41b-4d99-8ddd-78ef909182cb');
      console.log('=== SERVICE CALL COMPLETED ===');
      return result;
    } catch (error) {
      console.error('=== CONTROLLER ERROR ===');
      console.error('Error:', error);
      console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace');
      throw error;
    }
  }

  @Post('test')
  test(@Body() body: any) {
    console.log('=== TEST ENDPOINT ===');
    console.log('Received body:', JSON.stringify(body, null, 2));
    return { message: 'Test endpoint working', received: body };
  }

  @Post('test-mrn')
  @Public()
  async testMRN(@Body() data: any, @Request() req: any) {
    console.log('=== TEST MRN ENDPOINT CALLED ===');
    console.log('Data:', JSON.stringify(data, null, 2));
    
    try {
      const result = await this.strokeCasesService.create(data, req.user?.id || '4600ecc0-c41b-4d99-8ddd-78ef909182cb');
      return { message: 'MRN test successful', result };
    } catch (error) {
      console.error('MRN test error:', error);
      return { message: 'MRN test failed', error: error instanceof Error ? error.message : String(error) };
    }
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.EMS, UserRole.DATA_COLLECTOR)
  findAll(
    @Query('hospitalId') hospitalId?: string,
    @Query('originHospitalId') originHospitalId?: string,
    @Query('destinationHospitalId') destinationHospitalId?: string,
    @Query('strokeType') strokeType?: string,
    @Query('status') status?: string,
    @Query('modeOfArrival') modeOfArrival?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const filters: any = {};
    
    if (hospitalId) filters.hospitalId = hospitalId;
    if (originHospitalId) filters.originHospitalId = originHospitalId;
    if (destinationHospitalId) filters.destinationHospitalId = destinationHospitalId;
    if (strokeType) filters.strokeType = strokeType as any;
    if (status) filters.status = status as any;
    if (modeOfArrival) filters.modeOfArrival = modeOfArrival as any;
    if (dateFrom) filters.dateFrom = new Date(dateFrom);
    if (dateTo) filters.dateTo = new Date(dateTo);

    return this.strokeCasesService.findAll(filters);
  }

  @Get('paginated')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.EMS, UserRole.DATA_COLLECTOR)
  async findAllPaginated(
    @Query('hospitalId') hospitalId?: string,
    @Query('originHospitalId') originHospitalId?: string,
    @Query('destinationHospitalId') destinationHospitalId?: string,
    @Query('strokeType') strokeType?: string,
    @Query('status') status?: string,
    @Query('modeOfArrival') modeOfArrival?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('search') search?: string,
    @Query('limit', ParseIntPipe) limit = 10,
    @Query('offset', ParseIntPipe) offset = 0,
  ) {
    const filters: any = {};

    if (hospitalId) filters.hospitalId = hospitalId;
    if (originHospitalId) filters.originHospitalId = originHospitalId;
    if (destinationHospitalId) filters.destinationHospitalId = destinationHospitalId;
    if (strokeType) filters.strokeType = strokeType as any;
    if (status) filters.status = status as any;
    if (modeOfArrival) filters.modeOfArrival = modeOfArrival as any;
    if (dateFrom) filters.dateFrom = new Date(dateFrom);
    if (dateTo) filters.dateTo = new Date(dateTo);
    if (search) filters.search = search;

    return this.strokeCasesService.findAllPaginated(filters, limit, offset);
  }


  @Get('export')
  @Public()
  async exportToExcel(@Query() filters: StrokeFilterDto, @Res() res: Response) {
    try {
      const exportResult = await this.strokeExportService.exportStrokeCasesToExcel(filters);
      
      res.setHeader('Content-Type', exportResult.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);
      res.send(exportResult.buffer);
    } catch (error) {
      throw new BadRequestException('Failed to export stroke cases');
    }
  }

  @Get('kpi-summary')
  @Public()
  async getKPISummary(
    @Query('hospitalId') hospitalId?: string,
    @Query('timeframe') timeframe?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.strokeCasesService.getKPISummary({
      hospitalId,
      timeframe,
      startDate,
      endDate,
    });
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.EMS, UserRole.DATA_COLLECTOR)
  findOne(@Param('id') id: string) {
    return this.strokeCasesService.findOne(id);
  }

  @Patch(':id')
  @Public()
  async update(
    @Param('id') id: string,
    @Body() updateStrokeCaseDto: UpdateStrokeCaseDto,
    @Request() req: any,
  ) {
    try {
      console.log('=== STROKE CASE UPDATE DEBUG ===');
      console.log('Stroke Case ID:', id);
      console.log('Update DTO:', JSON.stringify(updateStrokeCaseDto, null, 2));
      console.log('DTO keys:', Object.keys(updateStrokeCaseDto));
      
      const result = await this.strokeCasesService.update(id, updateStrokeCaseDto, req.user?.id || '4600ecc0-c41b-4d99-8ddd-78ef909182cb');
      console.log('=== UPDATE SUCCESSFUL ===');
      return result;
    } catch (error) {
      console.error('=== UPDATE ERROR ===');
      console.error('Error:', error);
      console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace');
      throw error;
    }
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.RCC)
  remove(@Param('id') id: string) {
    return this.strokeCasesService.remove(id);
  }

  @Get('kpi-details/:kpiId')
  @Public()
  async getKPIDetails(
    @Param('kpiId') kpiId: string,
    @Query('hospitalId') hospitalId?: string,
    @Query('timeframe') timeframe?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.strokeCasesService.getKPIDetails(kpiId, {
      hospitalId,
      timeframe,
      startDate,
      endDate,
    });
  }
}
