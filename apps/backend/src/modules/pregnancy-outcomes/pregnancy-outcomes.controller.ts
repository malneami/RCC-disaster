import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { PregnancyOutcomesService } from './pregnancy-outcomes.service';
import { CreatePregnancyOutcomeDto } from './dto/create-pregnancy-outcome.dto';
import { UpdatePregnancyOutcomeDto } from './dto/update-pregnancy-outcome.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { MaternalStatus, PerinatalStatus } from '@prisma/client';

@Controller('pregnancy-outcomes')
@UseGuards(JwtAuthGuard)
export class PregnancyOutcomesController {
  constructor(private readonly pregnancyOutcomesService: PregnancyOutcomesService) {}

  @Post()
  async create(@Body() dto: CreatePregnancyOutcomeDto) {
    return this.pregnancyOutcomesService.create(dto);
  }

  @Get()
  async findAll(
    @Query('caseId') caseId?: string,
    @Query('maternalStatus') maternalStatus?: MaternalStatus,
    @Query('perinatalStatus') perinatalStatus?: PerinatalStatus,
    @Query('reviewFlag') reviewFlag?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.pregnancyOutcomesService.findAll({
      caseId,
      maternalStatus,
      perinatalStatus,
      reviewFlag: reviewFlag === 'true' ? true : reviewFlag === 'false' ? false : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Get('by-case/:caseId')
  async findByCaseId(@Param('caseId') caseId: string) {
    return this.pregnancyOutcomesService.findByCaseId(caseId);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.pregnancyOutcomesService.findById(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdatePregnancyOutcomeDto) {
    return this.pregnancyOutcomesService.update(id, dto);
  }
}
