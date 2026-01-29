import { IsOptional, IsString, IsEnum, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';

export class RecordingQueryDto {
    @IsOptional()
    @IsString()
    status?: string;

    @IsOptional()
    @IsString()
    callerId?: string;

    @IsOptional()
    @IsString()
    calleeId?: string;

    @IsOptional()
    @IsNumber()
    @Transform(({ value }) => parseInt(value))
    limit?: number;

    @IsOptional()
    @IsNumber()
    @Transform(({ value }) => parseInt(value))
    offset?: number;

    @IsOptional()
    @IsString()
    search?: string;
}
