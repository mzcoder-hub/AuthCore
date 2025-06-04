import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { subMinutes } from 'date-fns';

@Injectable()
export class MetricsService {
  constructor(private readonly prisma: PrismaService) {}

  // Fetch average latency, errors, etc.
  async getApiStats() {
    const [total, avgLatency, errorCount, perEndpoint] = await Promise.all([
      this.prisma.apiMetrics.count(),
      this.prisma.apiMetrics.aggregate({ _avg: { latencyMs: true } }),
      this.prisma.apiMetrics.count({ where: { status: { gte: 400 } } }),
      this.prisma.apiMetrics.groupBy({
        by: ['endpoint'],
        _avg: { latencyMs: true },
        _count: { _all: true },
      }),
    ]);
    return {
      total,
      avgLatency: avgLatency._avg.latencyMs,
      errorCount,
      perEndpoint,
    };
  }

  // Token issuance rates
  async getTokenStats() {
    // Last 30 days by day
    const daily = await this.prisma.authToken.groupBy({
      by: ['type'],
      _count: { _all: true },
      where: {
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    });
    return daily;
  }

  async getFailedLoginAttempts(ip: string, windowMinutes = 10) {
    const since = subMinutes(new Date(), windowMinutes);
    return this.prisma.auditLog.count({
      where: {
        event: 'login_failed',
        ipAddress: ip,
        createdAt: { gte: since },
      },
    });
  }
}
