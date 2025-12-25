import { ApiProperty } from '@nestjs/swagger';
import { BedStatus } from '@prisma/client';

export class BedStatusHistoryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: BedStatus, required: false })
  previousStatus?: BedStatus;

  @ApiProperty({ enum: BedStatus })
  newStatus!: BedStatus;

  @ApiProperty()
  changedAt!: Date;

  @ApiProperty({ required: false })
  reason?: string;

  @ApiProperty({ required: false })
  notes?: string;

  @ApiProperty()
  changedBy!: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

