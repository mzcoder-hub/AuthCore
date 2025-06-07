import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { PrismaClient } from '@prisma/client';
import { MetricsInterceptor } from './metrics/metrics.interceptor';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const prisma = new PrismaClient();

  async function getAllowedOrigins(origin: string): Promise<string[]> {
    const app = await prisma.application.findFirst({
      where: {
        corsOrigins: { has: origin }, // or: redirectUris: { has: origin }
      },
    });
    if (!app) {
      console.log('No application found for origin:', origin);
      return [];
    }

    return app.corsOrigins || []; // or: app.redirectUris || [];
  }

  // 🔐 Dynamic CORS middleware
  app.enableCors({
    origin: async (origin, callback) => {
      try {
        if (!origin) return callback(null, true);

        const allowedOrigins = await getAllowedOrigins(origin);

        if (allowedOrigins.includes(origin.toLowerCase())) {
          return callback(null, true);
        } else {
          return callback(new Error('CORS: Origin not allowed'));
        }
      } catch (err) {
        return callback(err);
      }
    },
    credentials: true,
  });

  app.useGlobalInterceptors(new MetricsInterceptor(app.get(PrismaService)));

  // 📄 Swagger setup
  const config = new DocumentBuilder()
    .setTitle('AuthCore API')
    .setDescription('SSO Authentication, User Management, and Application API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  app.setGlobalPrefix('api');
  await app.listen(5050);
}

bootstrap();
