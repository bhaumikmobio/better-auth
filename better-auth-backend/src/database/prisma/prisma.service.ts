import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';

let prismaClient: PrismaClient | null = null;

const getConnectionString = (): string => {
  const connectionString = process.env.POSTGRES_URL;
  if (!connectionString) {
    throw new Error('POSTGRES_URL is required when DATABASE=postgres');
  }
  return connectionString;
};

export const getPrismaClient = (): PrismaClient => {
  if (!prismaClient) {
    prismaClient = new PrismaClient({
      adapter: new PrismaPg({ connectionString: getConnectionString() }),
    });
  }

  return prismaClient;
};

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor() {
    super({
      adapter: new PrismaPg({ connectionString: getConnectionString() }),
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
