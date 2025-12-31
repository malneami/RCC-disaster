import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';

import { UsersService } from '../modules/users/users.service';
import { ActivitiesService } from '../modules/activities/activities.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ActivityType, UserStatus } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly maxLoginAttempts = 5;
  private readonly lockoutDuration = 15 * 60 * 1000; // 15 minutes

  constructor(
    private usersService: UsersService,
    private activitiesService: ActivitiesService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status === UserStatus.LOCKED && user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException('Account is temporarily locked');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('Account is suspended');
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new UnauthorizedException('Account is inactive');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      await this.handleFailedLogin(user.id);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await this.usersService.resetLoginAttempts(user.id);
    }

    const { passwordHash, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto, ipAddress: string, userAgent: string) {
    try {
      const user = await this.validateUser(loginDto.email, loginDto.password);

      const payload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        hospitalId: user.hospitalId,
      };

      const accessToken = this.jwtService.sign(payload);
      const refreshToken = this.jwtService.sign(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      });

      // Update user with refresh token and last login
      await this.usersService.updateRefreshToken(user.id, refreshToken);
      await this.usersService.updateLastLogin(user.id);

      // Log activity
      await this.activitiesService.create({
        type: ActivityType.USER_LOGIN,
        description: `User ${user.email} logged in successfully`,
        userId: user.id,
        ipAddress,
        userAgent,
      });

      this.logger.log(`User ${user.email} logged in successfully`);

      return {
        user,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Login failed for email ${loginDto.email}: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  async logout(userId: string, ipAddress: string, userAgent: string) {
    await this.usersService.clearRefreshToken(userId);

    // Log activity
    await this.activitiesService.create({
      type: ActivityType.USER_LOGOUT,
      description: 'User logged out',
      userId,
      ipAddress,
      userAgent,
    });

    this.logger.log(`User ${userId} logged out`);
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.usersService.findById(userId);

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isRefreshTokenValid = await bcrypt.compare(refreshToken, user.refreshToken);

    if (!isRefreshTokenValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      hospitalId: user.hospitalId,
    };

    const newAccessToken = this.jwtService.sign(payload);
    const newRefreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET')
    });

    await this.usersService.updateRefreshToken(userId, newRefreshToken);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async register(registerDto: RegisterDto, createdById: string) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 12);

    const user = await this.usersService.create({
      ...registerDto,
      passwordHash: hashedPassword,
      createdById,
    });

    const { passwordHash, ...result } = user;
    return result;
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedNewPassword = await bcrypt.hash(changePasswordDto.newPassword, 12);

    await this.usersService.updatePassword(userId, hashedNewPassword);

    this.logger.log(`User ${userId} changed password successfully`);
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(forgotPasswordDto.email);

    if (!user) {
      // Don't reveal if email exists
      return { message: 'If the email exists, a reset link has been sent' };
    }

    const resetToken = await this.usersService.generatePasswordResetToken(user.id);

    // In production, send email with reset link
    this.logger.log(`Password reset token generated for user ${user.email}: ${resetToken}`);

    return { message: 'If the email exists, a reset link has been sent' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.usersService.findByPasswordResetToken(resetPasswordDto.token);

    if (!user || !user.passwordResetExpiry || user.passwordResetExpiry < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 12);

    await this.usersService.resetPassword(user.id, hashedPassword);

    this.logger.log(`User ${user.email} reset password successfully`);
  }

  async getUserProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { passwordHash, refreshToken, ...userWithoutSecrets } = user;
    return userWithoutSecrets;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.usersService.findById(userId);
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Convert UpdateProfileDto to UpdateUserDto format
    const updateData = {
      firstName: updateProfileDto.firstName,
      lastName: updateProfileDto.lastName,
      phoneNumber: updateProfileDto.phoneNumber,
    };

    const result = await this.usersService.updateUser(userId, updateData);
    
    this.logger.log(`User ${userId} updated profile successfully`);
    
    return result;
  }

  private async handleFailedLogin(userId: string) {
    const updatedUser = await this.usersService.incrementLoginAttempts(userId);

    if (updatedUser.loginAttempts >= this.maxLoginAttempts) {
      const lockUntil = new Date(Date.now() + this.lockoutDuration);
      await this.usersService.lockAccount(userId, lockUntil);
      this.logger.warn(`Account ${userId} locked due to failed login attempts`);
    }
  }
}