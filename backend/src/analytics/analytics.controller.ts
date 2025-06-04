import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('users/total')
  async getTotalUsers() {
    return { total: await this.analyticsService.totalUsers() };
  }

  @Get('applications/total')
  async getTotalApplications() {
    return { total: await this.analyticsService.totalApplications() };
  }

  @Get('requests/per-minute')
  async getRequestsPerMinute(@Query('window') window = 60) {
    return await this.analyticsService.requestsPerMinute(Number(window));
  }

  @Get('users/by-application')
  async getUsersByApplication() {
    return await this.analyticsService.usersByApplication();
  }
}
