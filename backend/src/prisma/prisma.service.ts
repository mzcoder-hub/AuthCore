import { Injectable, OnModuleInit, INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

type PrismaClientEvent = 'beforeExit';

declare module '@prisma/client' {
  interface PrismaClient {
    $on(event: PrismaClientEvent, callback: () => Promise<void>): void;
  }
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    this.$on('beforeExit', async () => {
      await app.close();
    });
  }
}
