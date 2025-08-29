import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../auth/decorators/public.decorator';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  async check() {
    return this.healthService.checkHealth();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get system statistics' })
  async getStats() {
    return this.healthService.getSystemStats();
  }
}