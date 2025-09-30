import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateHospitalDto } from './dto/create-hospital.dto';
import { UpdateHospitalDto } from './dto/update-hospital.dto';
import { UpdateHospitalCapacityDto } from './dto/update-hospital-capacity.dto';
import { HospitalStatus } from '@prisma/client';

interface HospitalFilters {
  status?: HospitalStatus;
  cluster?: string;
  hasStemiService?: boolean;
  hasStrokeService?: boolean;
  hasTraumaService?: boolean;
}

@Injectable()
export class HospitalsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createHospitalDto: CreateHospitalDto) {
    return this.prisma.hospital.create({
      data: createHospitalDto,
    });
  }

  async findAll(filters: HospitalFilters = {}) {
    const where: any = { deletedAt: null };

    if (filters.status) where.status = filters.status;
    if (filters.cluster) where.cluster = filters.cluster;
    if (filters.hasStemiService !== undefined) where.hasStemiService = filters.hasStemiService;
    if (filters.hasStrokeService !== undefined) where.hasStrokeService = filters.hasStrokeService;
    if (filters.hasTraumaService !== undefined) where.hasTraumaService = filters.hasTraumaService;

    return this.prisma.hospital.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async getForRegistration() {
    return this.prisma.hospital.findMany({
      where: { 
        deletedAt: null,
        status: 'ACTIVE' // Only return active hospitals
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const hospital = await this.prisma.hospital.findFirst({
      where: { id, deletedAt: null },
    });

    if (!hospital) {
      throw new NotFoundException(`Hospital with ID ${id} not found`);
    }

    return hospital;
  }

  async update(id: string, updateHospitalDto: UpdateHospitalDto) {
    await this.findById(id);

    return this.prisma.hospital.update({
      where: { id },
      data: updateHospitalDto,
    });
  }

  async remove(id: string) {
    await this.findById(id);

    return this.prisma.hospital.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async updateCapacity(id: string, updateCapacityDto: UpdateHospitalCapacityDto) {
    const hospital = await this.findById(id);
    
    this.validateCapacityUpdate(hospital, updateCapacityDto);

    const updatedHospital = await this.prisma.hospital.update({
      where: { id },
      data: updateCapacityDto,
    });

    await this.checkCapacityAlerts(updatedHospital);
    
    return updatedHospital;
  }

  async getCapacityAlerts() {
    const hospitals = await this.prisma.hospital.findMany({
      where: { deletedAt: null },
    });

    const alerts = [];

    for (const hospital of hospitals) {
      const totalBeds = hospital.icuBeds + hospital.picuBeds + hospital.maleBeds + 
                       hospital.femaleBeds + hospital.pediatricBeds + hospital.standardBeds;
      const availableBeds = hospital.icuBedsAvailable + hospital.picuBedsAvailable + 
                           hospital.maleBedsAvailable + hospital.femaleBedsAvailable + 
                           hospital.pediatricBedsAvailable + hospital.standardBedsAvailable;
      
      const availabilityPercentage = totalBeds > 0 ? (availableBeds / totalBeds) * 100 : 0;

      if (availabilityPercentage <= 10) {
        alerts.push({
          hospitalId: hospital.id,
          hospitalName: hospital.name,
          type: 'CRITICAL',
          availabilityPercentage,
          availableBeds,
          totalBeds,
        });
      } else if (availabilityPercentage <= 25) {
        alerts.push({
          hospitalId: hospital.id,
          hospitalName: hospital.name,
          type: 'WARNING',
          availabilityPercentage,
          availableBeds,
          totalBeds,
        });
      }
    }

    return alerts;
  }

  async bulkUpdateCapacity(updates: Array<{ hospitalId: string; capacity: UpdateHospitalCapacityDto }>) {
    const results = [];

    for (const update of updates) {
      try {
        const result = await this.updateCapacity(update.hospitalId, update.capacity);
        results.push({ hospitalId: update.hospitalId, success: true, data: result });
      } catch (error) {
        results.push({ 
          hospitalId: update.hospitalId, 
          success: false, 
          error: (error as Error).message 
        });
      }
    }

    return results;
  }

  private validateCapacityUpdate(hospital: any, updateData: UpdateHospitalCapacityDto) {
    const fields = [
      'icuBeds', 'icuBedsAvailable', 'picuBeds', 'picuBedsAvailable',
      'maleBeds', 'maleBedsAvailable', 'femaleBeds', 'femaleBedsAvailable',
      'pediatricBeds', 'pediatricBedsAvailable', 'standardBeds', 'standardBedsAvailable',
      'nicuBeds', 'nicuBedsAvailable'
    ];

    for (const field of fields) {
      const value = (updateData as any)[field];
      if (value !== undefined && value < 0) {
        throw new BadRequestException(`${field} cannot be negative`);
      }
    }

    // Validate available beds don't exceed total beds
    if (updateData.icuBedsAvailable !== undefined && 
        updateData.icuBedsAvailable > (updateData.icuBeds ?? hospital.icuBeds)) {
      throw new BadRequestException('Available ICU beds cannot exceed total ICU beds');
    }

    if (updateData.picuBedsAvailable !== undefined && 
        updateData.picuBedsAvailable > (updateData.picuBeds ?? hospital.picuBeds)) {
      throw new BadRequestException('Available PICU beds cannot exceed total PICU beds');
    }
  }

  private async checkCapacityAlerts(hospital: any) {
    const totalBeds = hospital.icuBeds + hospital.picuBeds + hospital.maleBeds + 
                     hospital.femaleBeds + hospital.pediatricBeds + hospital.standardBeds;
    const availableBeds = hospital.icuBedsAvailable + hospital.picuBedsAvailable + 
                         hospital.maleBedsAvailable + hospital.femaleBedsAvailable + 
                         hospital.pediatricBedsAvailable + hospital.standardBedsAvailable;
    
    const availabilityPercentage = totalBeds > 0 ? (availableBeds / totalBeds) * 100 : 0;

    if (availabilityPercentage <= 10) {
      // Emit critical alert
      console.log(`🚨 CRITICAL ALERT: ${hospital.name} has only ${availabilityPercentage.toFixed(1)}% bed availability`);
    } else if (availabilityPercentage <= 25) {
      // Emit warning alert
      console.log(`⚠️ WARNING: ${hospital.name} has ${availabilityPercentage.toFixed(1)}% bed availability`);
    }
  }
}