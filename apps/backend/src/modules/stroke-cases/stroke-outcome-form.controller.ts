import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { StrokeOutcomeFormService } from './services/stroke-outcome-form.service';
import { StrokeOutcomeFormDto, UpdateStrokeOutcomeFormDto } from './dto/stroke-outcome-form.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Stroke Outcome Form')
@ApiBearerAuth()
@Controller('stroke-cases/outcome-form')
@UseGuards(JwtAuthGuard)
export class StrokeOutcomeFormController {
  constructor(private readonly strokeOutcomeFormService: StrokeOutcomeFormService) {}

  @Post(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update stroke case outcome form' })
  @ApiResponse({ status: 200, description: 'Outcome form updated successfully' })
  @ApiResponse({ status: 404, description: 'Stroke case not found' })
  async updateOutcomeForm(
    @Param('id') strokeCaseId: string,
    @Body() outcomeFormDto: StrokeOutcomeFormDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('User ID not found in request');
    }

    return this.strokeOutcomeFormService.updateOutcomeForm(
      strokeCaseId,
      outcomeFormDto,
      userId,
    );
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update stroke case outcome form (PUT)' })
  @ApiResponse({ status: 200, description: 'Outcome form updated successfully' })
  @ApiResponse({ status: 404, description: 'Stroke case not found' })
  async updateOutcomeFormPut(
    @Param('id') strokeCaseId: string,
    @Body() outcomeFormDto: UpdateStrokeOutcomeFormDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('User ID not found in request');
    }

    return this.strokeOutcomeFormService.updateOutcomeForm(
      strokeCaseId,
      outcomeFormDto,
      userId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get stroke case outcome form data' })
  @ApiResponse({ status: 200, description: 'Outcome form data retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Stroke case not found' })
  async getOutcomeForm(@Param('id') strokeCaseId: string) {
    return this.strokeOutcomeFormService.getOutcomeForm(strokeCaseId);
  }

  @Get()
  @ApiOperation({ summary: 'Get stroke cases with outcome form completeness' })
  @ApiResponse({ status: 200, description: 'Cases with completeness data retrieved successfully' })
  async getCasesWithCompleteness(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;

    return this.strokeOutcomeFormService.getCasesWithCompleteness(pageNum, limitNum);
  }

  @Get('stats/overview')
  @ApiOperation({ summary: 'Get outcome form statistics overview' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getOutcomeFormStats() {
    return this.strokeOutcomeFormService.getOutcomeFormStats();
  }
}
