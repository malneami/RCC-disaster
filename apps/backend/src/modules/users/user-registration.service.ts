import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateUserRegistrationRequestDto, ApproveUserRegistrationRequestDto, RejectUserRegistrationRequestDto } from './dto/user-registration.dto';
import { UserRole, RegistrationRequestStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserRegistrationService {
  constructor(private readonly prisma: PrismaService) {}

  async createRegistrationRequest(dto: CreateUserRegistrationRequestDto) {
    // Check if email already exists in users table
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    // Check if there's already a pending request for this email
    const existingRequest = await this.prisma.userRegistrationRequest.findUnique({
      where: { email: dto.email },
    });

    if (existingRequest && existingRequest.status === RegistrationRequestStatus.PENDING) {
      throw new ConflictException('A pending registration request already exists for this email');
    }

    // Validate hospital if provided
    if (dto.hospitalId) {
      const hospital = await this.prisma.hospital.findUnique({
        where: { id: dto.hospitalId },
      });

      if (!hospital) {
        throw new BadRequestException('Invalid hospital ID');
      }
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(dto.password, 12);

    // Create the registration request
    const request = await this.prisma.userRegistrationRequest.create({
      data: {
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phoneNumber: dto.phoneNumber,
        requestedRole: dto.requestedRole,
        hospitalId: dto.hospitalId,
        justification: dto.justification,
        passwordHash, // Store the hashed password
      },
      include: {
        hospital: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return request;
  }

  async getAllRegistrationRequests(status?: RegistrationRequestStatus) {
    const whereClause = status ? { status } : {};

    const requests = await this.prisma.userRegistrationRequest.findMany({
      where: whereClause,
      include: {
        hospital: {
          select: {
            id: true,
            name: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return requests;
  }

  async getRegistrationRequestById(id: string) {
    const request = await this.prisma.userRegistrationRequest.findUnique({
      where: { id },
      include: {
        hospital: {
          select: {
            id: true,
            name: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Registration request not found');
    }

    return request;
  }

  async approveRegistrationRequest(id: string, reviewerId: string, dto: ApproveUserRegistrationRequestDto) {
    const request = await this.getRegistrationRequestById(id);

    if (request.status !== RegistrationRequestStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be approved');
    }

    // Start a transaction
    const result = await this.prisma.$transaction(async (tx: any) => {
      // Update the registration request
      const updatedRequest = await tx.userRegistrationRequest.update({
        where: { id },
        data: {
          status: RegistrationRequestStatus.APPROVED,
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
          adminComments: dto.adminComments,
        },
        include: {
          hospital: {
            select: {
              id: true,
              name: true,
            },
          },
          reviewer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      // Create the user account using the stored password
      const newUser = await tx.user.create({
        data: {
          email: request.email,
          firstName: request.firstName,
          lastName: request.lastName,
          phoneNumber: request.phoneNumber,
          role: request.requestedRole,
          hospitalId: request.hospitalId,
          passwordHash: request.passwordHash, // Use the stored password hash
          isEmailVerified: true, // User provided their own password, so we can verify email
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          hospital: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return {
        request: updatedRequest,
        user: newUser,
      };
    });

    return result;
  }

  async rejectRegistrationRequest(id: string, reviewerId: string, dto: RejectUserRegistrationRequestDto) {
    const request = await this.getRegistrationRequestById(id);

    if (request.status !== RegistrationRequestStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be rejected');
    }

    const updatedRequest = await this.prisma.userRegistrationRequest.update({
      where: { id },
      data: {
        status: RegistrationRequestStatus.REJECTED,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        adminComments: dto.adminComments,
      },
      include: {
        hospital: {
          select: {
            id: true,
            name: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return updatedRequest;
  }

  async getRegistrationRequestStats() {
    const stats = await this.prisma.userRegistrationRequest.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
    });

    const result = {
      pending: 0,
      approved: 0,
      rejected: 0,
      total: 0,
    };

    stats.forEach((stat: any) => {
      result[stat.status.toLowerCase() as keyof typeof result] = stat._count.status;
      result.total += stat._count.status;
    });

    return result;
  }

  private generateTemporaryPassword(): string {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    return password;
  }
}
