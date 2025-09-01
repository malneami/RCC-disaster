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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CriticalCasesService } from './critical-cases.service';
import { CreateCriticalCaseDto, UpdateCriticalCaseDto } from './dto/create-critical-case.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Critical Cases')
@Controller('critical-cases')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CriticalCasesController {
  constructor(private readonly criticalCasesService: CriticalCasesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new critical case' })
  @ApiResponse({ status: 201, description: 'Critical case created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  create(@Body() createCriticalCaseDto: CreateCriticalCaseDto, @Request() req: any) {
    return this.criticalCasesService.create(createCriticalCaseDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all critical cases' })
  @ApiResponse({ status: 200, description: 'List of critical cases' })
  @ApiQuery({ name: 'hospitalId', required: false, description: 'Filter by hospital ID' })
  findAll(@Query('hospitalId') hospitalId?: string) {
    return this.criticalCasesService.findAll(hospitalId);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active critical cases' })
  @ApiResponse({ status: 200, description: 'List of active critical cases' })
  @ApiQuery({ name: 'hospitalId', required: false, description: 'Filter by hospital ID' })
  findActive(@Query('hospitalId') hospitalId?: string) {
    return this.criticalCasesService.findActive(hospitalId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get critical cases statistics' })
  @ApiResponse({ status: 200, description: 'Critical cases statistics' })
  @ApiQuery({ name: 'hospitalId', required: false, description: 'Filter by hospital ID' })
  getStats(@Query('hospitalId') hospitalId?: string) {
    return this.criticalCasesService.getStats(hospitalId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a critical case by ID' })
  @ApiResponse({ status: 200, description: 'Critical case found' })
  @ApiResponse({ status: 404, description: 'Critical case not found' })
  findOne(@Param('id') id: string) {
    return this.criticalCasesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a critical case' })
  @ApiResponse({ status: 200, description: 'Critical case updated successfully' })
  @ApiResponse({ status: 404, description: 'Critical case not found' })
  update(@Param('id') id: string, @Body() updateCriticalCaseDto: UpdateCriticalCaseDto) {
    return this.criticalCasesService.update(id, updateCriticalCaseDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a critical case' })
  @ApiResponse({ status: 200, description: 'Critical case deleted successfully' })
  @ApiResponse({ status: 404, description: 'Critical case not found' })
  remove(@Param('id') id: string) {
    return this.criticalCasesService.remove(id);
  }
}
