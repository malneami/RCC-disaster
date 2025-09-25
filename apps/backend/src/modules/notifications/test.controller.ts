import { Controller, Post, Get } from '@nestjs/common';
import { Public } from '../../auth/decorators/public.decorator';

@Controller('test-notifications')
export class TestNotificationsController {
  @Post('test')
  @Public()
  async testEndpoint() {
    return { message: 'Test notifications controller is working', timestamp: new Date().toISOString() };
  }

  @Get('health')
  @Public()
  async healthCheck() {
    return { status: 'ok', controller: 'test-notifications' };
  }
}
