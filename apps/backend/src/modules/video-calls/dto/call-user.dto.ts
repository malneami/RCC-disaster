import { IsString, IsNotEmpty } from 'class-validator';

export class CallUserDto {
  @IsString()
  @IsNotEmpty()
  userToCall!: string;

  @IsNotEmpty()
  signalData!: any;

  @IsString()
  @IsNotEmpty()
  from!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;
}

