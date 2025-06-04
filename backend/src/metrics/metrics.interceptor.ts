import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Observable, tap } from 'rxjs';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const latency = Date.now() - start;
        this.prisma.apiMetrics
          .create({
            data: {
              endpoint: req.originalUrl,
              method: req.method,
              status: req.res.statusCode,
              latencyMs: latency,
            },
          })
          .catch((e) => {
            console.error('Failed to log API metric:', e);
          });
      }),
    );
  }
}
