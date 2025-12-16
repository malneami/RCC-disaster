import { IsString, IsNotEmpty } from 'class-validator';

export class EndCallDto {
  @IsString()
  @IsNotEmpty()
  from!: string;
}

