import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { PregnancyKpiDailyAggregatesService } from './pregnancy-kpi-daily-aggregates.service';
import { CreatePregnancyKpiDailyAggregateDto } from './dto/create-pregnancy-kpi-daily-aggregate.dto';
import { UpdatePregnancyKpiDailyAggregateDto } from './dto/update-pregnancy-kpi-daily-aggregate.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('pregnancy-kpi-daily-aggregates')
@UseGuards(JwtAuthGuard)
export class PregnancyKpiDailyAggregatesController {
  constructor(private readonly service: PregnancyKpiDailyAggregatesService) {}

  @Post()
  async create(@Body() dto: CreatePregnancyKpiDailyAggregateDto) {
    return this.service.create(dto);
  }

  @Put('upsert')
  async upsert(@Body() dto: CreatePregnancyKpiDailyAggregateDto) {
    return this.service.upsert(dto);
  }

  @Get()
  async findAll(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('region') region?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.service.findAll({
      startDate,
      endDate,
      region,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePregnancyKpiDailyAggregateDto,
  ) {
    return this.service.update(id, dto);
  }
}
