import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateDriverScheduleDto } from './dto/create-driver-schedule.dto';
import { UpdateDriverScheduleDto } from './dto/update-driver-schedule.dto';
import { DriverSchedule, Prisma } from '@prisma/client';

@Injectable()
export class DriverSchedulesService {
  private readonly logger = new Logger(DriverSchedulesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createScheduleDto: CreateDriverScheduleDto): Promise<DriverSchedule> {
    await this.validateScheduleEntities(createScheduleDto);
    await this.checkScheduleConflicts(createScheduleDto);

    const schedule = await this.prisma.driverSchedule.create({
      data: {
        ...createScheduleDto,
        shiftStart: new Date(createScheduleDto.shiftStart),
        shiftEnd: new Date(createScheduleDto.shiftEnd),
        breakStart: createScheduleDto.breakStart ? new Date(createScheduleDto.breakStart) : null,
        breakEnd: createScheduleDto.breakEnd ? new Date(createScheduleDto.breakEnd) : null,
      },
      include: this.getScheduleInclude(),
    });

    this.logger.log(`Driver schedule created: ${schedule.id}`);
    return schedule;
  }

  async findAll(): Promise<DriverSchedule[]> {
    return this.prisma.driverSchedule.findMany({
      where: { deletedAt: null },
      include: this.getScheduleInclude(),
      orderBy: { shiftStart: 'desc' },
    });
  }

  async findById(id: string): Promise<DriverSchedule> {
    const schedule = await this.prisma.driverSchedule.findUnique({
      where: { id },
      include: this.getScheduleInclude(),
    });

    if (!schedule) {
      throw new NotFoundException(`Driver schedule with ID ${id} not found`);
    }

    return schedule;
  }

  async update(id: string, updateScheduleDto: UpdateDriverScheduleDto): Promise<DriverSchedule> {
    const existingSchedule = await this.findById(id);

    const updateData = this.buildUpdateData(updateScheduleDto);

    const schedule = await this.prisma.driverSchedule.update({
      where: { id },
      data: updateData,
      include: this.getScheduleInclude(),
    });

    this.logger.log(`Driver schedule updated: ${schedule.id}`);
    return schedule;
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);

    await this.prisma.driverSchedule.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Driver schedule soft deleted: ${id}`);
  }

  async getSchedulesByDriver(driverId: string): Promise<DriverSchedule[]> {
    return this.prisma.driverSchedule.findMany({
      where: { driverId, deletedAt: null },
      include: {
        ambulance: {
          select: {
            id: true,
            callSign: true,
            plateNumber: true,
            type: true,
            status: true,
          },
        },
      },
      orderBy: { shiftStart: 'desc' },
    });
  }

  async getSchedulesByAmbulance(ambulanceId: string): Promise<DriverSchedule[]> {
    return this.prisma.driverSchedule.findMany({
      where: { ambulanceId, deletedAt: null },
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
      orderBy: { shiftStart: 'desc' },
    });
  }

  async getActiveSchedules(): Promise<DriverSchedule[]> {
    return this.prisma.driverSchedule.findMany({
      where: {
        status: 'ACTIVE',
        deletedAt: null,
      },
      include: this.getScheduleInclude(),
      orderBy: { shiftStart: 'asc' },
    });
  }

  async getSchedulesByDateRange(startDate: Date, endDate: Date): Promise<DriverSchedule[]> {
    return this.prisma.driverSchedule.findMany({
      where: {
        shiftStart: {
          gte: startDate,
          lte: endDate,
        },
        deletedAt: null,
      },
      include: this.getScheduleInclude(),
      orderBy: { shiftStart: 'asc' },
    });
  }

  async getDriverOvertime(driverId: string, startDate: Date, endDate: Date): Promise<number> {
    const schedules = await this.prisma.driverSchedule.findMany({
      where: {
        driverId,
        shiftStart: {
          gte: startDate,
          lte: endDate,
        },
        deletedAt: null,
      },
      select: {
        overtimeHours: true,
      },
    });

    return schedules.reduce((total, schedule) => total + (schedule.overtimeHours || 0), 0);
  }

  async startBreak(scheduleId: string): Promise<DriverSchedule> {
    const schedule = await this.findById(scheduleId);

    if (schedule.status !== 'ACTIVE') {
      throw new ConflictException('Cannot start break for inactive schedule');
    }
    if (schedule.breakStart) {
      throw new ConflictException('Break already started');
    }

    return this.prisma.driverSchedule.update({
      where: { id: scheduleId },
      data: { breakStart: new Date() },
      include: this.getScheduleInclude(),
    });
  }

  async endBreak(scheduleId: string): Promise<DriverSchedule> {
    const schedule = await this.findById(scheduleId);

    if (!schedule.breakStart) {
      throw new ConflictException('No active break to end');
    }

    const breakDuration = (Date.now() - schedule.breakStart.getTime()) / (1000 * 60 * 60);

    return this.prisma.driverSchedule.update({
      where: { id: scheduleId },
      data: { 
        breakEnd: new Date(),
        overtimeHours: (schedule.overtimeHours || 0) + breakDuration,
      },
      include: this.getScheduleInclude(),
    });
  }

  private getScheduleInclude() {
    return {
      driver: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phoneNumber: true,
          status: true,
        },
      },
      ambulance: {
        select: {
          id: true,
          callSign: true,
          plateNumber: true,
          type: true,
          status: true,
        },
      },
    };
  }

  private buildUpdateData(updateScheduleDto: UpdateDriverScheduleDto): Prisma.DriverScheduleUpdateInput {
    return {
      ...updateScheduleDto,
      shiftStart: updateScheduleDto.shiftStart ? new Date(updateScheduleDto.shiftStart) : undefined,
      shiftEnd: updateScheduleDto.shiftEnd ? new Date(updateScheduleDto.shiftEnd) : undefined,
      breakStart: updateScheduleDto.breakStart ? new Date(updateScheduleDto.breakStart) : undefined,
      breakEnd: updateScheduleDto.breakEnd ? new Date(updateScheduleDto.breakEnd) : undefined,
    };
  }

  private async validateScheduleEntities(dto: CreateDriverScheduleDto): Promise<void> {
    const [driver, ambulance] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: dto.driverId } }),
      this.prisma.ambulance.findUnique({ where: { id: dto.ambulanceId } }),
    ]);

    if (!driver) throw new NotFoundException(`Driver with ID ${dto.driverId} not found`);
    if (!ambulance) throw new NotFoundException(`Ambulance with ID ${dto.ambulanceId} not found`);
  }

  private async checkScheduleConflicts(dto: CreateDriverScheduleDto): Promise<void> {
    const shiftStart = new Date(dto.shiftStart);
    const shiftEnd = new Date(dto.shiftEnd);

    const conflictQuery = {
      deletedAt: null,
      OR: [
        { shiftStart: { gte: shiftStart, lt: shiftEnd } },
        { shiftEnd: { gt: shiftStart, lte: shiftEnd } },
        { shiftStart: { lte: shiftStart }, shiftEnd: { gte: shiftEnd } },
      ],
    };

    const [driverConflicts, ambulanceConflicts] = await Promise.all([
      this.prisma.driverSchedule.findMany({ where: { driverId: dto.driverId, ...conflictQuery } }),
      this.prisma.driverSchedule.findMany({ where: { ambulanceId: dto.ambulanceId, ...conflictQuery } }),
    ]);

    if (driverConflicts.length > 0) {
      throw new ConflictException(`Driver has conflicting schedule during this time period`);
    }
    if (ambulanceConflicts.length > 0) {
      throw new ConflictException(`Ambulance has conflicting schedule during this time period`);
    }
  }
}