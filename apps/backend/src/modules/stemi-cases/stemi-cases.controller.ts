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

  @Post()
  @Public()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createStemiCaseDto: CreateStemiCaseDto, @Request() req: any) {
    return await this.stemiCasesService.createStemiCase(createStemiCaseDto, req.user?.id || '4600ecc0-c41b-4d99-8ddd-78ef909182cb');
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
    return await this.stemiCasesService.updateStemiCase(id, updateStemiCaseDto, req.user?.id || '4600ecc0-c41b-4d99-8ddd-78ef909182cb');
  }

  @Delete(':id')
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    return await this.stemiCasesService.deleteStemiCase(id);
  }
}
