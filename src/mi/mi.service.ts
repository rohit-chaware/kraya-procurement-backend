import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { MiStatus, Prisma } from '../prisma/prisma-types';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMiDto, MiFilterDto } from './dto/mi.dto';
import { buildPaginatedResult, getPaginationParams, PaginationQueryDto } from '../common/dto/pagination.dto';
import { ItemLockService } from '../common/services/item-lock.service';

@Injectable()
export class MiService {
    private readonly logger = new Logger(MiService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly itemLockService: ItemLockService,
    ) {}

    private mapMi<T extends { items: Array<{ quantity: Prisma.Decimal }> }>(mi: T) {
        return {
            ...mi,
            items: mi.items.map((item) => ({
                ...item,
                quantity: Number(item.quantity),
            })),
        };
    }

    async create(dto: CreateMiDto, userId: string) {
        this.logger.log('[create] : creating material issue');
        if (dto.indentId) {
            const indent = await this.prisma.indent.findUnique({
                where: { id: dto.indentId },
            });
            if (!indent) {
                throw new BadRequestException('Invalid indent ID');
            }
        }

        const items = await this.prisma.item.findMany({
            where: {
                id: { in: dto.items.map((i) => i.itemId) },
                isDeleted: false,
            },
        });
        if (items.length !== dto.items.length) {
            throw new BadRequestException('One or more items are invalid');
        }

        const mi = await this.prisma.$transaction(async (tx) => {
            const created = await tx.materialIssue.create({
                data: {
                    miNumber: dto.miNumber,
                    indentId: dto.indentId,
                    issuedByUserId: userId,
                    items: {
                        create: dto.items.map((item) => ({
                            itemId: item.itemId,
                            quantity: new Prisma.Decimal(item.quantity),
                        })),
                    },
                },
                include: { items: true },
            });

            await this.itemLockService.lockItems(
                dto.items.map((item) => item.itemId),
                tx,
            );

            return created;
        });
        this.logger.log('[create] : execution finished');
        return this.mapMi(mi);
    }

    async findAll(query: PaginationQueryDto, filters: MiFilterDto) {
        this.logger.log('[findAll] : listing material issues');
        const { skip, take, page, limit } = getPaginationParams(query.page, query.limit);

        const where: Prisma.MaterialIssueWhereInput = {
            ...(filters.status ? { status: filters.status } : {}),
            ...(filters.indentId ? { indentId: filters.indentId } : {}),
        };

        const [records, total] = await Promise.all([
            this.prisma.materialIssue.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: { items: true },
            }),
            this.prisma.materialIssue.count({ where }),
        ]);

        const data = records.map((mi) => this.mapMi(mi));
        this.logger.log('[findAll] : execution finished');
        return buildPaginatedResult(data, total, page, limit);
    }

    async findOne(id: string) {
        this.logger.log('[findOne] : fetching material issue');
        const mi = await this.prisma.materialIssue.findUnique({
            where: { id },
            include: { items: true },
        });
        if (!mi) {
            throw new NotFoundException('Material issue not found');
        }
        this.logger.log('[findOne] : execution finished');
        return this.mapMi(mi);
    }

    async issue(id: string) {
        this.logger.log('[issue] : issuing material');
        const mi = await this.findOne(id);
        if (mi.status !== MiStatus.DRAFT) {
            throw new BadRequestException('Only DRAFT MI can be issued');
        }

        const updated = await this.prisma.materialIssue.update({
            where: { id },
            data: { status: MiStatus.ISSUED },
            include: { items: true },
        });
        this.logger.log('[issue] : execution finished');
        return this.mapMi(updated);
    }
}
