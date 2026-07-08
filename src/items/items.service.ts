import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '../prisma/prisma-types';
import { PrismaService } from '../prisma/prisma.service';
import { CreateItemDto, ItemFilterDto, UpdateItemDto } from './dto/item.dto';
import { buildPaginatedResult, getPaginationParams, PaginationQueryDto } from '../common/dto/pagination.dto';

@Injectable()
export class ItemsService {
    private readonly logger = new Logger(ItemsService.name);

    constructor(private readonly prisma: PrismaService) {}

    private mapItem<T extends { price: Prisma.Decimal }>(item: T) {
        return {
            ...item,
            price: Number(item.price),
        };
    }

    async create(dto: CreateItemDto, userId: string) {
        this.logger.log('[create] : creating item');
        const company = await this.prisma.company.findUnique({
            where: { id: dto.companyId },
        });
        if (!company) {
            throw new BadRequestException('Invalid company ID');
        }

        try {
            const item = await this.prisma.item.create({
                data: {
                    itemId: dto.itemId,
                    companyId: dto.companyId,
                    itemCode: dto.itemCode,
                    name: dto.name,
                    description: dto.description,
                    unit: dto.unit,
                    price: new Prisma.Decimal(dto.price),
                    createdByUserId: userId,
                },
            });
            this.logger.log('[create] : execution finished');
            return this.mapItem(item);
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new ConflictException('Item ID must be unique');
            }
            throw error;
        }
    }

    async findAll(query: PaginationQueryDto, filters: ItemFilterDto) {
        this.logger.log('[findAll] : listing items');
        const { skip, take, page, limit } = getPaginationParams(query.page, query.limit);

        const where: Prisma.ItemWhereInput = {
            isDeleted: false,
            ...(filters.companyId ? { companyId: filters.companyId } : {}),
            ...(filters.itemCode ? { itemCode: filters.itemCode } : {}),
            ...(filters.search
                ? {
                      OR: [
                          { name: { contains: filters.search, mode: 'insensitive' } },
                          { itemCode: { contains: filters.search, mode: 'insensitive' } },
                          { itemId: { contains: filters.search, mode: 'insensitive' } },
                      ],
                  }
                : {}),
        };

        const [items, total] = await Promise.all([
            this.prisma.item.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.item.count({ where }),
        ]);

        const data = items.map((item) => this.mapItem(item));
        this.logger.log('[findAll] : execution finished');
        return buildPaginatedResult(data, total, page, limit);
    }

    async findOne(id: string) {
        this.logger.log('[findOne] : fetching item');
        const item = await this.prisma.item.findFirst({
            where: { id, isDeleted: false },
        });
        if (!item) {
            throw new NotFoundException('Item not found');
        }
        this.logger.log('[findOne] : execution finished');
        return this.mapItem(item);
    }

    async update(id: string, dto: UpdateItemDto, userId: string) {
        this.logger.log('[update] : updating item');
        const item = await this.findOne(id);
        if (item.isLocked) {
            throw new BadRequestException('Item is locked because it is used in Indent, MI, or RFQ');
        }

        const updated = await this.prisma.item.update({
            where: { id },
            data: {
                itemCode: dto.itemCode,
                name: dto.name,
                description: dto.description,
                unit: dto.unit,
                price: dto.price !== undefined ? new Prisma.Decimal(dto.price) : undefined,
                lastUpdatedByUserId: userId,
            },
        });
        this.logger.log('[update] : execution finished');
        return this.mapItem(updated);
    }

    async softDelete(id: string, userId: string) {
        this.logger.log('[softDelete] : soft deleting item');
        const item = await this.findOne(id);
        if (item.isLocked) {
            throw new BadRequestException('Item is locked because it is used in Indent, MI, or RFQ');
        }

        const deleted = await this.prisma.item.update({
            where: { id },
            data: {
                isDeleted: true,
                lastUpdatedByUserId: userId,
            },
        });
        this.logger.log('[softDelete] : execution finished');
        return this.mapItem(deleted);
    }
}
