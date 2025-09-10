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
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { StemiCasesService } from './services/stemi-cases.service';
import { CreateStemiCaseDto, UpdateStemiCaseDto } from './dto/create-stemi-case.dto';
import { StemiFilterDto } from './dto/stemi-filter.dto';
import { Public } from '../../auth/decorators/public.decorator';

@Controller('stemi-cases')
@UseGuards(JwtAuthGuard)
export class StemiCasesController {
  constructor(private readonly stemiCasesService: StemiCasesService) {}

  @Post('test')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  async testCreate() {
    try {
      const userId = '433dc4e4-9b03-4d76-b513-840db55029a2'; // Admin user from seeded data
      const testData = {
        patientInfo: {
          firstName: 'Test',
          lastName: 'User',
          nationalId: '12345678941',
          dateOfBirth: '1990-01-01',
          gender: 'MALE',
          originHospitalId: '1',
          destinationHospitalId: '2'
        },
        admissionTime: '2025-09-10T12:03:00.000Z',
        modeOfArrival: 'AIR_TRANSPORT',
        criticalTimestamps: {},
        interventionsAndTreatments: {},
        clinicalAssessment: {},
        currentStatus: 'SUSPECTED'
      };
      console.log('Test endpoint called with data:', JSON.stringify(testData, null, 2));
      return await this.stemiCasesService.createStemiCase(testData, userId);
    } catch (error: any) {
      console.error('Test endpoint error:', error);
      console.error('Test endpoint error message:', error.message);
      console.error('Test endpoint error stack:', error.stack);
      throw new BadRequestException(`Test endpoint error: ${error.message}`);
    }
  }

  @Post()
  @Public()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createStemiCaseDto: any, @Request() req: any) {
    try {
      const userId = req.user?.id || '433dc4e4-9b03-4d76-b513-840db55029a2'; // Use admin user ID from seeded data
      console.log('Controller received data:', JSON.stringify(createStemiCaseDto, null, 2));
      return await this.stemiCasesService.createStemiCase(createStemiCaseDto, userId);
    } catch (error: any) {
      console.error('Controller error:', error);
      console.error('Controller error message:', error.message);
      console.error('Controller error stack:', error.stack);
      throw new BadRequestException(`Controller error: ${error.message}`);
    }
  }

  @Get()
  @Public()
  async findAll(@Query() filters: StemiFilterDto) {
    return await this.stemiCasesService.getStemiCases(filters);
  }

  @Get('kpis')
  @Public()
  async getKpiSummary(
    @Query('hospitalId') hospitalId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return await this.stemiCasesService.getKpiSummary(hospitalId, startDate, endDate);
  }

  @Get(':id')
  @Public()
  async findOne(@Param('id') id: string) {
    return await this.stemiCasesService.getStemiCaseById(id);
  }

  @Patch(':id')
  @Public()
  async update(
    @Param('id') id: string,
    @Body() updateStemiCaseDto: UpdateStemiCaseDto,
    @Request() req: any,
  ) {
    console.log('Controller update called with:', JSON.stringify({ id, updateStemiCaseDto }, null, 2));
    return await this.stemiCasesService.updateStemiCase(id, updateStemiCaseDto, req.user?.id || '4600ecc0-c41b-4d99-8ddd-78ef909182cb');
  }

  @Delete(':id')
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    return await this.stemiCasesService.deleteStemiCase(id);
  }
}
