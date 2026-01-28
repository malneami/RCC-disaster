import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TranscriptionGateway } from './transcription.gateway';
import { TranscriptionService } from './transcription.service';
import { PrismaService } from '../../database/prisma.service';
import { RecordingsModule } from '../recordings/recordings.module';

@Module({
    imports: [
        ConfigModule,
        JwtModule,
        forwardRef(() => RecordingsModule),
    ],
    providers: [TranscriptionGateway, TranscriptionService, PrismaService],
    exports: [TranscriptionService],
})
export class TranscriptionModule { }