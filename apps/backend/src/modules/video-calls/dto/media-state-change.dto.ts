import { IsString, IsNotEmpty, IsBoolean } from 'class-validator';

export class MediaStateChangeDto {
  @IsString()
  @IsNotEmpty()
  from!: string;

  @IsBoolean()
  video!: boolean;

  @IsBoolean()
  audio!: boolean;
}

