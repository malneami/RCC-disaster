import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
  Request,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { StemiOutcomeFormService } from './services/stemi-outcome-form.service';
import { UpdateStemiOutcomeFormDto } from './dto/stemi-outcome-form.dto';

@Controller('stemi-cases/outcome-form')
@UseGuards(JwtAuthGuard)
export class StemiOutcomeFormController {
  constructor(
    private readonly stemiOutcomeFormService: StemiOutcomeFormService,
  ) {}

  /**
   * Update STEMI case outcome form
   */
  @Put(':stemiCaseId')
  async updateOutcomeForm(
    @Param('stemiCaseId') stemiCaseId: string,
    @Body() updateDto: UpdateStemiOutcomeFormDto,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    return this.stemiOutcomeFormService.updateOutcomeForm(
      stemiCaseId,
      updateDto,
      userId,
    );
  }

  /**
   * Get STEMI case outcome form data
   */
  @Get(':stemiCaseId')
  async getOutcomeForm(@Param('stemiCaseId') stemiCaseId: string) {
    return this.stemiOutcomeFormService.getOutcomeForm(stemiCaseId);
  }

  /**
   * Get STEMI cases with outcome form completeness
   */
  @Get()
  async getCasesWithCompleteness(
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
  ) {
    return this.stemiOutcomeFormService.getCasesWithCompleteness(page, limit);
  }

  /**
   * Get outcome form statistics
   */
  @Get('stats/overview')
  async getOutcomeFormStats() {
    return this.stemiOutcomeFormService.getOutcomeFormStats();
  }
}
