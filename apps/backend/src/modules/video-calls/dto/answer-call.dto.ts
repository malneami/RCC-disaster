import { IsString, IsNotEmpty } from 'class-validator';

export class AnswerCallDto {
  @IsNotEmpty()
  signal!: any;

  @IsString()
  @IsNotEmpty()
  to!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;
}

