import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { PrismaClient } from '@prisma/client';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const prisma = new PrismaClient();

  // 🔁 In-memory CORS cache
  let corsCache: string[] = [];
  let lastFetched = 0;
  const TTL = 5 * 60 * 1000; // 5 minutes

  async function getAllowedOrigins(): Promise<string[]> {
    const now = Date.now();
    if (now - lastFetched < TTL && corsCache.length > 0) {
      return corsCache;
    }

    const apps = await prisma.application.findMany();
    corsCache = apps
      .flatMap((a) => a.applicationUrls || [])
      .map((url) => url.toLowerCase().trim())
      .filter((url, i, arr) => !!url && arr.indexOf(url) === i);

    lastFetched = now;
    return corsCache;
  }

  // 🔐 Dynamic CORS middleware
  app.enableCors({
    origin: async (origin, callback) => {
      try {
        if (!origin) return callback(null, true);

        const allowedOrigins = await getAllowedOrigins();
        // console.log('Allowed Origins:', allowedOrigins);

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
