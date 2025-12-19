import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { DriverFilterDto } from './dto/driver-filter.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class DriversService {
  private readonly logger = new Logger(DriversService.name);

  constructor(private prisma: PrismaService) {}

  async create(createDriverDto: CreateDriverDto) {
    try {
      // Check if email already exists (only if email is provided)
      if (createDriverDto.email) {
        const existingUser = await this.prisma.user.findUnique({
          where: { email: createDriverDto.email },
        });

        if (existingUser) {
          throw new ConflictException('Email already exists');
        }
      }

      // Generate a temporary password (drivers will need to reset it)
      const tempPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      const driver = await this.prisma.user.create({
        data: {
          firstName: createDriverDto.firstName,
          lastName: createDriverDto.lastName,
          email: createDriverDto.email,
          phoneNumber: createDriverDto.phoneNumber,
          passwordHash: hashedPassword,
          role: 'EMS',
          status: createDriverDto.status || 'ACTIVE',
          hospitalId: createDriverDto.hospitalId,
          isEmailVerified: false,
        },
        include: {
          hospital: true,
        },
      });

      // Remove sensitive data
      const { passwordHash, refreshToken, ...driverWithoutSecrets } = driver;
      
      this.logger.log(`Driver created: ${driver.firstName} ${driver.lastName}${driver.email ? ` (${driver.email})` : ''}`);
      return driverWithoutSecrets;
    } catch (error) {
      this.logger.error('Failed to create driver:', error);
      throw error;
    }
  }

  async findAll(filter: DriverFilterDto) {
    try {
      const page = filter.page || 1;
      const limit = filter.limit || 10;
      const skip = (page - 1) * limit;

      const where: any = {
        deletedAt: null,
        role: 'EMS',
      };

      if (filter.status) {
        where.status = filter.status;
      }

      if (filter.hospitalId) {
        where.hospitalId = filter.hospitalId;
      }

      if (filter.search) {
        where.OR = [
          { firstName: { contains: filter.search, mode: 'insensitive' } },
          { lastName: { contains: filter.search, mode: 'insensitive' } },
          { email: { contains: filter.search, mode: 'insensitive' } },
        ];
      }

      const [drivers, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          skip,
          take: limit,
          include: {
            hospital: true,
            emsAssignmentDriver: {
              where: {
                status: {
                  in: ['EMS_CONTACT', 'EN_ROUTE', 'EMS_ARRIVAL', 'DEPARTED'],
                },
                deletedAt: null,
              },
              select: {
                id: true,
                status: true,
                ticket: {
                  select: {
                    ticketNumber: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
        this.prisma.user.count({ where }),
      ]);

      // Remove sensitive data
      const driversWithoutSecrets = drivers.map(
        ({ passwordHash, refreshToken, emsAssignmentDriver, ...driver }) => ({
          ...driver,
          activeAssignment:
            emsAssignmentDriver && emsAssignmentDriver.length > 0
              ? emsAssignmentDriver[0]
              : null,
        }),
      );

      return {
        data: driversWithoutSecrets,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error('Failed to fetch drivers:', error);
      throw error;
    }
  }

  async getActiveDrivers() {
    try {
      const drivers = await this.prisma.user.findMany({
        where: {
          deletedAt: null,
          role: 'EMS',
          status: 'ACTIVE',
        },
        include: {
          hospital: true,
        },
        orderBy: {
          firstName: 'asc',
        },
      });

      // Remove sensitive data
      return drivers.map(({ passwordHash, refreshToken, ...driver }) => driver);
    } catch (error) {
      this.logger.error('Failed to fetch active drivers:', error);
      throw error;
    }
  }

  async findById(id: string) {
    try {
      const driver = await this.prisma.user.findUnique({
        where: { id, deletedAt: null, role: 'EMS' },
        include: {
          hospital: true,
        },
      });

      if (!driver) {
        throw new NotFoundException('Driver not found');
      }

      // Remove sensitive data
      const { passwordHash, refreshToken, ...driverWithoutSecrets } = driver;
      return driverWithoutSecrets;
    } catch (error) {
      this.logger.error(`Failed to fetch driver ${id}:`, error);
      throw error;
    }
  }

  async update(id: string, updateDriverDto: UpdateDriverDto) {
    try {
      // Check if driver exists
      const existingDriver = await this.prisma.user.findUnique({
        where: { id, deletedAt: null, role: 'EMS' },
      });

      if (!existingDriver) {
        throw new NotFoundException('Driver not found');
      }

      // Check if email is being changed and if it already exists
      if (updateDriverDto.email && updateDriverDto.email !== existingDriver.email) {
        const emailExists = await this.prisma.user.findUnique({
          where: { email: updateDriverDto.email },
        });

        if (emailExists) {
          throw new ConflictException('Email already exists');
        }
      }

      const updatedDriver = await this.prisma.user.update({
        where: { id },
        data: updateDriverDto,
        include: {
          hospital: true,
        },
      });

      // Remove sensitive data
      const { passwordHash, refreshToken, ...driverWithoutSecrets } = updatedDriver;
      
      this.logger.log(`Driver updated: ${updatedDriver.firstName} ${updatedDriver.lastName}${updatedDriver.email ? ` (${updatedDriver.email})` : ''}`);
      return driverWithoutSecrets;
    } catch (error) {
      this.logger.error(`Failed to update driver ${id}:`, error);
      throw error;
    }
  }

  async remove(id: string) {
    try {
      const driver = await this.prisma.user.findUnique({
        where: { id, deletedAt: null, role: 'EMS' },
      });

      if (!driver) {
        throw new NotFoundException('Driver not found');
      }

      await this.prisma.user.update({
        where: { id },
        data: {
          deletedAt: new Date(),
        },
      });

      this.logger.log(`Driver soft deleted: ${driver.firstName} ${driver.lastName}${driver.email ? ` (${driver.email})` : ''}`);
    } catch (error) {
      this.logger.error(`Failed to delete driver ${id}:`, error);
      throw error;
    }
  }
}
