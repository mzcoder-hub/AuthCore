import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ApplicationModule } from './applications/applications.module';
import { UserModule } from './users/users.module';
import { RoleModule } from './roles/roles.module';
import { PermissionModule } from './permissions/permissions.module';
import { MetricsModule } from './metrics/metrics.module';
import { AnalyticsService } from './analytics/analytics.service';
import { AnalyticsController } from './analytics/analytics.controller';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AdminAuditInterceptor } from './auth/admin.interceptor';

@Module({
  imports: [
    PrismaModule,
    UserModule,
    RoleModule,
    PermissionModule,
    ApplicationModule,
    AuthModule,
    MetricsModule,
  ],
  controllers: [AppController, AnalyticsController],
  providers: [
    AppService,
    AnalyticsService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AdminAuditInterceptor,
    },
  ],
})
export class AppModule {}
