import { Controller, Get } from '@nestjs/common';
import { MetricsService } from './metrics.service';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get('api')
  getApiStats() {
    return this.metricsService.getApiStats();
  }

  @Get('tokens')
  getTokenStats() {
    return this.metricsService.getTokenStats();
  }
}
