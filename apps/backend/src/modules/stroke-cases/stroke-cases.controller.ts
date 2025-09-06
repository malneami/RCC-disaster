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
} from '@nestjs/common';
import { StrokeCasesService } from './stroke-cases.service';
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
  constructor(private readonly strokeCasesService: StrokeCasesService) {}

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
      console.log('User ID:', req.user?.id || 'fdb96cd9-d484-4f21-83ea-917cff0cb059');
      
      const result = await this.strokeCasesService.create(createStrokeCaseDto, req.user?.id || 'fdb96cd9-d484-4f21-83ea-917cff0cb059');
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
      const result = await this.strokeCasesService.create(data, req.user?.id || 'fdb96cd9-d484-4f21-83ea-917cff0cb059');
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
    @Query('strokeType') strokeType?: string,
    @Query('status') status?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const filters: any = {};
    
    if (hospitalId) filters.hospitalId = hospitalId;
    if (strokeType) filters.strokeType = strokeType as any;
    if (status) filters.status = status as any;
    if (dateFrom) filters.dateFrom = new Date(dateFrom);
    if (dateTo) filters.dateTo = new Date(dateTo);

    return this.strokeCasesService.findAll(filters);
  }

  @Get('kpi-summary')
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.DATA_COLLECTOR)
  getKPISummary(
    @Query('hospitalId') hospitalId?: string,
    @Query('year') yearStr?: string,
    @Query('month') monthStr?: string,
  ) {
    const year = yearStr ? parseInt(yearStr, 10) : undefined;
    const month = monthStr ? parseInt(monthStr, 10) : undefined;
    return this.strokeCasesService.getKPISummary(hospitalId, year, month);
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
      
      const result = await this.strokeCasesService.update(id, updateStrokeCaseDto, req.user?.id || 'fdb96cd9-d484-4f21-83ea-917cff0cb059');
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
}
