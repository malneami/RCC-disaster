import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { CaseFeedbackService } from './case-feedback.service';
import { CreateCaseFeedbackDto } from './dto/create-case-feedback.dto';
import { UpdateCaseFeedbackDto } from './dto/update-case-feedback.dto';
import { CaseFeedbackFilterDto } from './dto/case-feedback-filter.dto';

@ApiTags('case-feedback')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('case-feedback')
export class CaseFeedbackController {
  constructor(private readonly caseFeedbackService: CaseFeedbackService) {}

  @Post()
  @ApiOperation({ summary: 'Create case feedback' })
  @Roles(
    UserRole.ADMIN,
    UserRole.RCC,
    UserRole.QUALITY,
    UserRole.ED_DOCTOR,
    UserRole.ED_NURSE,
    UserRole.UNIT_NURSE,
    UserRole.CATH_LAB_NURSE,
    UserRole.CONSULTANT,
  )
  async create(@Body() createDto: CreateCaseFeedbackDto, @Req() req: any) {
    return this.caseFeedbackService.create(createDto, req.user.id);
  }

  @Get('pending')
  @ApiOperation({ summary: 'Get pending feedback for hospital' })
  @Roles(
    UserRole.ADMIN,
    UserRole.RCC,
    UserRole.QUALITY,
    UserRole.ED_DOCTOR,
    UserRole.ED_NURSE,
    UserRole.UNIT_NURSE,
    UserRole.CATH_LAB_NURSE,
    UserRole.CONSULTANT,
  )
  async getPending(@Query('hospitalId') hospitalId: string) {
    return this.caseFeedbackService.getPendingForHospital(hospitalId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all feedback with filters' })
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.QUALITY)
  async findAll(@Query() filters: CaseFeedbackFilterDto) {
    return this.caseFeedbackService.findAll(filters);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get feedback analytics' })
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.QUALITY)
  async getAnalytics(
    @Query('hospitalId') hospitalId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.caseFeedbackService.getAnalytics(
      hospitalId,
      startDate,
      endDate,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get feedback by ID' })
  @Roles(
    UserRole.ADMIN,
    UserRole.RCC,
    UserRole.QUALITY,
    UserRole.ED_DOCTOR,
    UserRole.ED_NURSE,
    UserRole.UNIT_NURSE,
    UserRole.CATH_LAB_NURSE,
    UserRole.CONSULTANT,
  )
  async findOne(@Param('id') id: string) {
    return this.caseFeedbackService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update feedback' })
  @Roles(UserRole.ADMIN, UserRole.RCC, UserRole.QUALITY)
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateCaseFeedbackDto,
    @Req() req: any,
  ) {
    return this.caseFeedbackService.update(id, updateDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete feedback' })
  @Roles(UserRole.ADMIN, UserRole.QUALITY)
  async remove(@Param('id') id: string) {
    return this.caseFeedbackService.remove(id);
  }
}
