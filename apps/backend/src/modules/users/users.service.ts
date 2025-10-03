import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: { 
        email,
        deletedAt: null, // Exclude soft-deleted users
      },
      include: {
        hospital: true,
      },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findFirst({
      where: { 
        id,
        deletedAt: null, // Exclude soft-deleted users
      },
      include: {
        hospital: true,
      },
    });
  }

  async findByPasswordResetToken(token: string) {
    return this.prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpiry: {
          gt: new Date(),
        },
        deletedAt: null, // Exclude soft-deleted users
      },
    });
  }

  async create(userData: any) {
    return this.prisma.user.create({
      data: userData,
      include: {
        hospital: true,
      },
    });
  }

  async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        refreshToken: hashedRefreshToken,
        sessionExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });
  }

  async clearRefreshToken(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        refreshToken: null,
        sessionExpiry: null,
      },
    });
  }

  async updateLastLogin(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { lastLogin: new Date() },
    });
  }

  async incrementLoginAttempts(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        loginAttempts: {
          increment: 1,
        },
      },
    });
  }

  async resetLoginAttempts(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
      },
    });
  }

  async lockAccount(userId: string, lockUntil: Date) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        status: UserStatus.LOCKED,
        lockedUntil: lockUntil,
      },
    });
  }

  async updatePassword(userId: string, hashedPassword: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    });
  }

  async generatePasswordResetToken(userId: string) {
    const token = randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordResetToken: token,
        passwordResetExpiry: expiry,
      },
    });

    return token;
  }

  async resetPassword(userId: string, hashedPassword: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: hashedPassword,
        passwordResetToken: null,
        passwordResetExpiry: null,
        status: UserStatus.ACTIVE,
        loginAttempts: 0,
        lockedUntil: null,
      },
    });
  }

  async findAll(page = 1, limit = 10, role?: UserRole) {
    const skip = (page - 1) * limit;
    
    const where = {
      deletedAt: null,
      ...(role && { role }),
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: {
          hospital: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users.map(({ passwordHash, refreshToken, ...user }) => user),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async resetUserPassword(userId: string, newPassword: string): Promise<{ user: any }> {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.status !== 'ACTIVE') {
      throw new Error('Cannot reset password for inactive user');
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update user password
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        loginAttempts: 0, // Reset login attempts
        lockedUntil: null, // Unlock account if locked
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
      },
    });

    return {
      user: updatedUser,
    };
  }

  async updateUser(userId: string, updateData: UpdateUserDto): Promise<{ user: any }> {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Validate hospital if provided
    if (updateData.hospitalId) {
      const hospital = await this.prisma.hospital.findUnique({
        where: { id: updateData.hospitalId },
      });

      if (!hospital) {
        throw new Error('Invalid hospital ID');
      }
    }

    // Prepare update data
    const updatePayload: any = {};
    if (updateData.role) updatePayload.role = updateData.role;
    if (updateData.hospitalId !== undefined) updatePayload.hospitalId = updateData.hospitalId;
    if (updateData.firstName) updatePayload.firstName = updateData.firstName;
    if (updateData.lastName) updatePayload.lastName = updateData.lastName;
    if (updateData.phoneNumber !== undefined) updatePayload.phoneNumber = updateData.phoneNumber;

    // Update user
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updatePayload,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        phoneNumber: true,
        hospitalId: true,
        hospital: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      user: updatedUser,
    };
  }

  async deleteUser(userId: string): Promise<{ message: string; user: any }> {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Prevent deletion of admin users
    if (user.role === 'ADMIN') {
      throw new Error('Cannot delete admin users');
    }

    // Check for active assignments created by this user
    const activeAssignments = await this.prisma.eMSAssignment.count({
      where: {
        createdBy: userId,
        status: {
          notIn: ['ARRIVED', 'CANCELLED'],
        },
      },
    });

    if (activeAssignments > 0) {
      throw new Error('Cannot delete user with active EMS assignments');
    }

    // Check for pending tickets created by this user
    const pendingTickets = await this.prisma.ticket.count({
      where: {
        createdById: userId,
        status: {
          notIn: ['COMPLETED', 'CANCELLED'],
        },
      },
    });

    if (pendingTickets > 0) {
      throw new Error('Cannot delete user with pending tickets');
    }

    // Perform soft delete by setting deletedAt timestamp
    const deletedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        status: UserStatus.INACTIVE,
        email: `deleted_${Date.now()}_${user.email}`, // Make email unique for soft delete
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        deletedAt: true,
      },
    });

    this.logger.log(`User ${user.email} (${user.id}) has been soft deleted`);

    return {
      message: `User ${user.firstName} ${user.lastName} has been deleted successfully`,
      user: deletedUser,
    };
  }

}