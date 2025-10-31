import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateAmbulanceDto } from './dto/create-ambulance.dto';
import { UpdateAmbulanceDto } from './dto/update-ambulance.dto';
import { AmbulanceFilterDto } from './dto/ambulance-filter.dto';
import { Ambulance, Prisma, AmbulanceStatus, AmbulanceType, EquipmentStatus } from '@prisma/client';
import axios from 'axios';

interface AmbulanceFilters {
  status?: AmbulanceStatus;
  type?: string;
  equipmentStatus?: string;
  baseStation?: string;
  driverId?: string;
  isActive?: boolean;
  search?: string;
}

@Injectable()
export class AmbulancesService {
  private readonly logger = new Logger(AmbulancesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createAmbulanceDto: CreateAmbulanceDto): Promise<Ambulance> {
    // Validate IMEI format if provided
    if (createAmbulanceDto.vehicleImei && !/^\d{15}$/.test(createAmbulanceDto.vehicleImei)) {
      throw new BadRequestException('IMEI must be exactly 15 digits');
    }

    await this.checkUniqueConstraints(createAmbulanceDto);
    await this.validateDriver(createAmbulanceDto.driverId);

    const ambulance = await this.prisma.ambulance.create({
      data: createAmbulanceDto,
      include: {
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
    });

    this.logger.log(`Ambulance created: ${ambulance.callSign}`);
    return ambulance;
  }

  async findAll(filters: AmbulanceFilters = {}): Promise<Ambulance[]> {
    const where: Prisma.AmbulanceWhereInput = { deletedAt: null };

    if (filters.status) where.status = filters.status;
    if (filters.type) where.type = filters.type as AmbulanceType;
    if (filters.equipmentStatus) where.equipmentStatus = filters.equipmentStatus as EquipmentStatus;
    if (filters.baseStation) where.baseStation = { contains: filters.baseStation, mode: 'insensitive' };
    if (filters.driverId) where.driverId = filters.driverId;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;

    if (filters.search) {
      where.OR = [
        { callSign: { contains: filters.search, mode: 'insensitive' } },
        { plateNumber: { contains: filters.search, mode: 'insensitive' } },
        { vehicleImei: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.ambulance.findMany({
      where,
      include: {
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllGPS(filters: AmbulanceFilters = {}): Promise<any[]> {
    const response = await axios.get('http://gps3.tawasolmap.com/new_api/', {
      params: {
        api_key: "7798AA377F99763506758557AC7741A1",
        service: "objects",
        imeis: "*"
      }
    });
    return response.data;
  }

  async findById(id: string): Promise<Ambulance> {
    const ambulance = await this.prisma.ambulance.findFirst({
      where: { id, deletedAt: null },
      include: {
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
    });

    if (!ambulance) {
      throw new NotFoundException(`Ambulance with ID ${id} not found`);
    }

    return ambulance;
  }

  async findByVehicleImei(vehicleImei: string): Promise<Ambulance> {
    const ambulance = await this.prisma.ambulance.findUnique({
      where: { vehicleImei },
    });

    if (!ambulance) {
      throw new NotFoundException(`Ambulance with vehicle IMEI ${vehicleImei} not found`);
    }

    return ambulance;
  }


  async update(id: string, updateAmbulanceDto: UpdateAmbulanceDto): Promise<Ambulance> {
    await this.findById(id);

    if (updateAmbulanceDto.vehicleImei || updateAmbulanceDto.callSign || updateAmbulanceDto.plateNumber) {
      await this.checkUniqueConstraints(updateAmbulanceDto, id);
    }

    if (updateAmbulanceDto.driverId !== undefined) {
      await this.validateDriver(updateAmbulanceDto.driverId);
    }

    return this.prisma.ambulance.update({
      where: { id },
      data: updateAmbulanceDto,
      include: {
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
    });
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);

    await this.prisma.ambulance.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date() },
    });
  }

  async getAvailableAmbulances(): Promise<Ambulance[]> {
    return this.prisma.ambulance.findMany({
      where: {
        status: 'AVAILABLE',
        isActive: true,
        equipmentStatus: 'OPERATIONAL',
      },
      include: {
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateLocation(vehicleImei: string, lat: number, lng: number, address?: string): Promise<Ambulance> {
    const ambulance = await this.findByVehicleImei(vehicleImei);

    return this.prisma.ambulance.update({
      where: { id: ambulance.id },
      data: {
        currentLocationLat: lat,
        currentLocationLng: lng,
        currentLocationAddress: address,
        lastUpdated: new Date(),
      },
    });
  }


  private async checkUniqueConstraints(dto: CreateAmbulanceDto | UpdateAmbulanceDto, excludeId?: string): Promise<void> {
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

  private async validateDriver(driverId?: string): Promise<void> {
    if (driverId) {
      const driver = await this.prisma.user.findUnique({
        where: { id: driverId },
      });

      if (!driver) {
        throw new NotFoundException(`Driver with ID ${driverId} not found`);
      }

      // Check if driver is active
      if (driver.status !== 'ACTIVE') {
        throw new ConflictException(`Driver ${driver.firstName} ${driver.lastName} is not active`);
      }
    }
  }
}
