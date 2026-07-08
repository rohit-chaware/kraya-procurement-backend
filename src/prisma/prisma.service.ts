import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaService.name);

    constructor() {
        const adapter = new PrismaPg({
            connectionString: process.env.DATABASE_URL,
        });
        super({ adapter });
    }

    async onModuleInit() {
        this.logger.log('[PrismaService] : connecting to database');
        await this.$connect();
        this.logger.log('[PrismaService] : execution finished');
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}
