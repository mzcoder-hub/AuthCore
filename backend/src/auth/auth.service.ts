import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { addDays } from 'date-fns';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
        applications: true,
      },
    });

    const app = await this.prisma.application.findUnique({
      where: { clientId: dto.client_id },
    });

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      // Log failed login attempt
      await this.prisma.auditLog.create({
        data: {
          event: 'login_failed',
          userId: user?.id ?? null,
          applicationId: app?.id ?? null,
          ipAddress: null,
          details: { method: 'password', success: false, email: dto.email },
        },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!app) throw new UnauthorizedException('Invalid application');

    const isAssigned =
      user.applications &&
      user.applications.some((ua) => ua.applicationId === app.id);

    if (!isAssigned) {
      // Optional: log this event as well
      await this.prisma.auditLog.create({
        data: {
          event: 'login_denied',
          userId: user.id,
          applicationId: app.id,
          details: { method: 'password', reason: 'not assigned to app' },
        },
      });
      throw new UnauthorizedException(
        `${app.name} is not available for you. Please contact your administrator.`,
      );
    }

    // 👉 Update lastLogin for the user
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // JWT access token
    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
      applicationId: app.id,
    };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: `${app.accessTokenLifetime || 15}m`,
    });

    // Revoke previous refresh tokens for this user/app
    await this.prisma.authToken.updateMany({
      where: {
        userId: user.id,
        applicationId: app.id,
        type: 'refresh',
        revokedAt: null,
        expiresAt: { gt: new Date() }, // only revoke non-expired tokens
      },
      data: {
        revokedAt: new Date(),
      },
    });

    // Opaque refresh token
    const refreshToken = randomUUID();
    await this.prisma.authToken.create({
      data: {
        token: refreshToken,
        type: 'refresh',
        userId: user.id,
        applicationId: app.id,
        expiresAt: addDays(new Date(), app.refreshTokenLifetime || 7),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        event: dto.state ? 'login_success_with_state' : 'login_success',
        userId: user.id,
        applicationId: app.id,
        details: { method: 'password', success: true },
      },
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'bearer',
      expiresIn: (app.accessTokenLifetime || 15) * 60,
      redirectTo: dto.redirectUri
        ? `${dto.redirectUri}?token=${accessToken}&state=${dto.state}`
        : undefined,
    };
  }

  async refreshToken(refreshToken: string) {
    const token = await this.prisma.authToken.findUnique({
      where: { token: refreshToken },
    });
    if (!token || token.revokedAt || token.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: token.userId },
      include: { roles: true, applications: true },
    });
    const app = await this.prisma.application.findUnique({
      where: { id: token.applicationId },
    });
    if (!user || !app) throw new UnauthorizedException();

    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
      applicationId: app.id,
    };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: `${app.accessTokenLifetime || 15}m`,
    });

    return {
      accessToken,
      tokenType: 'bearer',
      expiresIn: (app.accessTokenLifetime || 15) * 60,
    };
  }
}
