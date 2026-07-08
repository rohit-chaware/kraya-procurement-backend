import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '../../prisma/prisma-types';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ItemLockService {
    private readonly logger = new Logger(ItemLockService.name);

    constructor(private readonly prisma: PrismaService) {}

    async lockItems(itemIds: string[], tx?: Prisma.TransactionClient): Promise<void> {
        this.logger.log('[lockItems] : locking items used in Indent, MI, or RFQ');
        if (!itemIds.length) {
            this.logger.log('[lockItems] : execution finished');
            return;
        }

        const uniqueIds = [...new Set(itemIds)];
        const client = tx ?? this.prisma;

        await client.item.updateMany({
            where: { id: { in: uniqueIds }, isLocked: false },
            data: { isLocked: true },
        });

        this.logger.log('[lockItems] : execution finished');
    }
}
