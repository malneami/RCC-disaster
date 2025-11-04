import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateAmbulanceDto } from './dto/create-ambulance.dto';
import { UpdateAmbulanceDto } from './dto/update-ambulance.dto';
import { AmbulanceFilterDto } from './dto/ambulance-filter.dto';
import { Ambulance, Prisma, AmbulanceStatus, AmbulanceType, EquipmentStatus } from '@prisma/client';
import axios from 'axios';
import { GPSMappingService } from '../../common/services/gps-mapping.service';
import { AmbulanceValidationService } from './services/ambulance-validation.service';

interface AmbulanceFilters {
  status?: AmbulanceStatus;
  type?: string;
  equipmentStatus?: string;
  baseStation?: string;
  driverId?: string;
  isActive?: boolean;
  search?: string;
}

interface GPSApiResponse {
  status: boolean;
  data: any[];
}

@Injectable()
export class AmbulancesService {
  private readonly logger = new Logger(AmbulancesService.name);
  private readonly driverInclude = {
    driver: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
      },
    },
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly gpsMappingService: GPSMappingService,
    private readonly validationService: AmbulanceValidationService,
  ) {}

  async create(createAmbulanceDto: CreateAmbulanceDto): Promise<Ambulance> {
    this.validationService.validateIMEIFormat(createAmbulanceDto.vehicleImei);
    await this.validationService.checkUniqueConstraints(createAmbulanceDto);
    await this.validationService.validateDriver(createAmbulanceDto.driverId);

    const ambulance = await this.prisma.ambulance.create({
      data: createAmbulanceDto,
      include: this.driverInclude,
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
      include: this.driverInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllGPS(filters: AmbulanceFilters = {}): Promise<any> {
    const response = await axios.post<GPSApiResponse>('http://gps3.tawasolmap.com/new_api/', {
      api_key: "7798AA377F99763506758557AC7741A1",
      service: "objects",
      imeis: "*"
    }, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Map GPS objects to consistent format
    if (response.data.status && response.data.data) {
      const mappedData = this.gpsMappingService.mapGPSObjects(response.data.data);
      return {
        status: response.data.status,
        data: mappedData,
      };
    }
    
    return response.data;
  }

  async findById(id: string): Promise<Ambulance> {
    const ambulance = await this.prisma.ambulance.findFirst({
      where: { id, deletedAt: null },
      include: this.driverInclude,
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
      await this.validationService.checkUniqueConstraints(updateAmbulanceDto, id);
    }

    if (updateAmbulanceDto.driverId !== undefined) {
      await this.validationService.validateDriver(updateAmbulanceDto.driverId);
    }

    return this.prisma.ambulance.update({
      where: { id },
      data: updateAmbulanceDto,
      include: this.driverInclude,
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
      include: this.driverInclude,
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
}
