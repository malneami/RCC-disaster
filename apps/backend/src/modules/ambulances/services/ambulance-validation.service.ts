import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateAmbulanceDto } from '../dto/create-ambulance.dto';
import { UpdateAmbulanceDto } from '../dto/update-ambulance.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AmbulanceValidationService {
  constructor(private readonly prisma: PrismaService) {}

  validateIMEIFormat(imei?: string): void {
    if (imei && !/^\d{15}$/.test(imei)) {
      throw new BadRequestException('IMEI must be exactly 15 digits');
    }
  }

  async checkUniqueConstraints(dto: CreateAmbulanceDto | UpdateAmbulanceDto, excludeId?: string): Promise<void> {
    const where: Prisma.AmbulanceWhereInput = excludeId ? { id: { not: excludeId } } : {};

    const checks = [
      { field: 'vehicleImei', value: dto.vehicleImei },
      { field: 'callSign', value: dto.callSign },
      { field: 'plateNumber', value: dto.plateNumber },
      { field: 'vin', value: dto.vin },
    ];

    for (const check of checks) {
      if (check.value) {
        const existing = await this.prisma.ambulance.findFirst({
          where: { ...where, [check.field]: check.value },
        });
        if (existing) {
          throw new ConflictException(`${check.field} ${check.value} already exists`);
        }
      }
    }
  }

  async validateDriver(driverId?: string): Promise<void> {
    if (driverId) {
      const driver = await this.prisma.user.findUnique({
        where: { id: driverId },
      });

      if (!driver) {
        throw new NotFoundException(`Driver with ID ${driverId} not found`);
      }

      if (driver.status !== 'ACTIVE') {
        throw new ConflictException(`Driver ${driver.firstName} ${driver.lastName} is not active`);
      }
    }
  }
}

