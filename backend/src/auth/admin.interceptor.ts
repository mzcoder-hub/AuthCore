import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class AdminAuditInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const user = req.user;

    const excludedPaths = ['/auth/login', '/auth/refresh', '/auth/logout'];

    // Only log for admin/superadmin roles
    const isAdmin =
      user &&
      user.roles &&
      user.roles.some((roleObj) =>
        ['Admin', 'Superadmin'].includes(
          // Handles different nesting just in case
          roleObj?.role?.name ??
            roleObj?.name ??
            (typeof roleObj === 'string' ? roleObj : undefined),
        ),
      );

    if (!isAdmin || excludedPaths.includes(req.path)) {
      return next.handle();
    }

    if (!isAdmin) {
      return next.handle();
    }

    return next.handle().pipe(
      tap({
        next: async (result) => {
          // Log the admin action
          await this.prisma.auditLog.create({
            data: {
              event: 'admin_action',
              userId: user.userId,
              applicationId: user.applicationId ?? null,
              details: {
                method: req.method,
                path: req.originalUrl || req.url,
                body: req.body,
                params: req.params,
                query: req.query,
                result,
              },
              ipAddress: req.ip,
              userAgent: req.headers['user-agent'],
            },
          });
        },
      }),
    );
  }
}
