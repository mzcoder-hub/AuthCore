import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { ApplicationStatus, ApplicationType } from '@prisma/client';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';

@Injectable()
export class ApplicationService {
  constructor(private readonly prisma: PrismaService) {}

  async getApplicationsPaginated(query: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    type?: string;
  }) {
    const { page, limit, search, status, type } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ApplicationWhereInput = {
      ...(search && { name: { contains: search, mode: 'insensitive' } }),
      ...(status && { status: status as ApplicationStatus }),
      ...(type && { type: type as ApplicationType }),
      deletedAt: null,
    };

    const [total, apps] = await Promise.all([
      this.prisma.application.count({ where }),
      this.prisma.application.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      items: apps,
    };
  }

  async findById(id: string) {
    return this.prisma.application.findUnique({
      where: { id, deletedAt: null },
    });
  }

  async create(dto: CreateApplicationDto) {
    // Generate clientId, clientSecret if not provided
    const clientId = dto.clientId || randomUUID();
    const clientSecret = dto.clientSecret || randomUUID();

    return this.prisma.application.create({
      data: { ...dto, clientId, clientSecret },
    });
  }

  async update(id: string, dto: UpdateApplicationDto) {
    return this.prisma.application.update({ where: { id }, data: dto });
  }

  async delete(id: string) {
    await this.prisma.application.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { success: true };
  }

  async listApplicationUsers(applicationId: string) {
    const app = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: { users: { include: { user: { include: { roles: true } } } } },
    });
    if (!app) throw new NotFoundException();
    return app.users.map((ua) => ({
      id: ua.user.id,
      name: ua.user.name,
      email: ua.user.email,
      roles: ua.user.roles, // <-- ERROR: does not exist!
      assignedAt: ua.assignedAt,
    }));
  }

  async rotateClientSecret(applicationId: string) {
    const app = await this.prisma.application.findUnique({
      where: { id: applicationId },
    });
    if (!app) throw new NotFoundException('Application not found');

    const newSecret = randomUUID();
    const updated = await this.prisma.application.update({
      where: { id: applicationId },
      data: { clientSecret: newSecret },
    });

    return {
      clientId: updated.clientId,
      clientSecret: newSecret,
    };
  }
}
