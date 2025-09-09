import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import gpsConfig from './gps.config';
import redisConfig from './redis.config';
import appConfig from './app.config';
import environmentConfig from './environment.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        gpsConfig,
        redisConfig,
        appConfig,
        environmentConfig,
      ],
      envFilePath: ['.env.local', '.env'],
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
    }),
  ],
  exports: [ConfigModule],
})
export class AppConfigModule {}


