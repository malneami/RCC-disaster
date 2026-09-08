import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DisasterCommandRole } from '@prisma/client';

export class AssignCommandRoleDto {
  @ApiProperty({ description: 'User ID to assign to the role' })
  @IsNotEmpty()
  @IsUUID()
  userId!: string;

  @ApiProperty({
    enum: DisasterCommandRole,
    description: 'Command role to assign',
  })
  @IsNotEmpty()
  @IsEnum(DisasterCommandRole)
  role!: DisasterCommandRole;
}
