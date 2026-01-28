import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RecordingsController } from './recordings.controller';
import { RecordingsService } from './recordings.service';
import { DatabaseModule } from '../../database/database.module';
import { TranscriptionModule } from '../transcription/transcription.module';

@Module({
    imports: [
        ConfigModule,
        DatabaseModule,
        forwardRef(() => TranscriptionModule),
    ],
    controllers: [RecordingsController],
    providers: [RecordingsService],
    exports: [RecordingsService],
})
export class RecordingsModule { }
