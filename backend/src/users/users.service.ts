/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Prisma, UserStatus } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getUsersPaginated(query: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    role?: string;
  }) {
    const { page, limit, search, status, role } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(status && { status: status as UserStatus }),
    };

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          applications: { include: { application: true } },
          roles: { include: { role: true } },
        },
      }),
    ]);

    const items = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      status: user.status,
      roles: user.roles.map((ur) => ur.role.name), // <-- FIXED!
      applications: user.applications.map((ua) => ({
        id: ua.application.id,
        name: ua.application.name,
      })),
      lastLogin: user.lastLogin,
      passwordLastChanged: user.passwordLastChanged,
    }));

    return {
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      items,
    };
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        applications: { include: { application: true } },
        roles: { include: { role: true } },
      },
    });
    if (!user) throw new NotFoundException();
    const { password, ...safe } = user;
    return {
      ...safe,
      applications: user.applications.map((ua) => ({
        id: ua.application.id,
        name: ua.application.name,
      })),
    };
  }

  async create(createUserDto: CreateUserDto) {
    const { roleIds, ...rest } = createUserDto;
    const hashed = await bcrypt.hash(rest.password, 10);
    const user = await this.prisma.user.create({
      data: {
        ...rest,
        password: hashed,
      },
    });

    // Assign roles if provided
    if (roleIds && roleIds.length) {
      for (const roleId of roleIds) {
        await this.prisma.userRole.create({
          data: { userId: user.id, roleId },
        });
      }
    }
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    const updates: any = { ...dto };
    if (dto.password) updates.password = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.update({
      where: { id },
      data: updates,
    });
    const { password, ...safe } = user;
    return safe;
  }

  async delete(id: string) {
    await this.prisma.user.delete({ where: { id } });
    return { success: true };
  }

  async assignApplication(userId: string, applicationId: string) {
    // Check both exist
    const [user, app] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.application.findUnique({ where: { id: applicationId } }),
    ]);
    if (!user) throw new NotFoundException('User not found');
    if (!app) throw new NotFoundException('Application not found');
    // Upsert assignment
    await this.prisma.userApplication.upsert({
      where: { userId_applicationId: { userId, applicationId } },
      update: {},
      create: { userId, applicationId },
    });
    return { success: true };
  }

  async removeApplication(userId: string, applicationId: string) {
    await this.prisma.userApplication.deleteMany({
      where: { userId, applicationId },
    });
    return { success: true };
  }

  async listUserApplications(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { applications: { include: { application: true } } },
    });
    if (!user) throw new NotFoundException();
    return user.applications.map((ua) => ({
      id: ua.application.id,
      name: ua.application.name,
      status: ua.application.status,
      type: ua.application.type,
      assignedAt: ua.assignedAt,
    }));
  }

  async assignRole(userId: string, roleId: string) {
    await this.prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId } },
      update: {},
      create: { userId, roleId },
    });
    return { success: true };
  }

  async removeRole(userId: string, roleId: string) {
    await this.prisma.userRole.deleteMany({ where: { userId, roleId } });
    return { success: true };
  }
}
