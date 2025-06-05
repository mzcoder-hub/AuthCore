import { Injectable } from '@nestjs/common';
import { subMinutes } from 'date-fns';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async totalUsers() {
    return this.prisma.user.count();
  }

  async totalApplications() {
    return this.prisma.application.count();
  }

  async requestsPerMinute(windowMinutes = 60) {
    const since = subMinutes(new Date(), windowMinutes);
    const logs = await this.prisma.apiMetrics.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    });

    // Group by minute
    const chartData: { minute: string; count: number }[] = [];
    const counts: Record<string, number> = {};

    logs.forEach((log) => {
      const minute = log.createdAt.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:MM"
      counts[minute] = (counts[minute] || 0) + 1;
    });

    // Build chart points (fill missing minutes)
    for (let i = windowMinutes - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 60 * 1000);
      const minuteKey = d.toISOString().slice(0, 16);
      chartData.push({
        minute: minuteKey,
        count: counts[minuteKey] || 0,
      });
    }
    return chartData;
  }

  async usersByApplication() {
    const apps = await this.prisma.application.findMany({
      select: {
        id: true,
        name: true,
        users: { select: { userId: true } },
      },
    });

    return apps.map((app) => ({
      id: app.id,
      name: app.name,
      totalUsers: app.users.length,
    }));
  }

  async getRecentActivity(type?: string, limit: number = 20) {
    const where: any = {};
    if (type === 'auth') {
      where.event = {
        in: ['login', 'logout', 'token_refresh', 'password_changed'],
      };
    } else if (type === 'admin') {
      where.event = { in: ['admin_action'] };
    } else if (type === 'error') {
      where.event = { in: ['error', 'login_failed'] };
    }
    const logs = await this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: true,
        application: true,
      },
    });

    // Map to the shape you want for the frontend
    return logs.map((log) => ({
      event: log.event,
      user: log.user ? log.user.email : null,
      application: log.application ? log.application.name : null,
      details: log.details || null,
      ipAddress: log.ipAddress,
      time: log.createdAt,
    }));
  }
}
