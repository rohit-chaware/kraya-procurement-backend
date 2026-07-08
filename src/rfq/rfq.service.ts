import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, RfqStatus } from '../prisma/prisma-types';
import { PrismaService } from '../prisma/prisma.service';
import { AttachVendorsDto, CreateRfqDto, RfqFilterDto } from './dto/rfq.dto';
import { buildPaginatedResult, getPaginationParams, PaginationQueryDto } from '../common/dto/pagination.dto';
import { ItemLockService } from '../common/services/item-lock.service';

@Injectable()
export class RfqService {
    private readonly logger = new Logger(RfqService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly itemLockService: ItemLockService,
    ) {}

    private mapRfq<T extends { items: Array<{ quantity: Prisma.Decimal }> }>(rfq: T) {
        return {
            ...rfq,
            items: rfq.items.map((item) => ({
                ...item,
                quantity: Number(item.quantity),
            })),
        };
    }

    async create(dto: CreateRfqDto, userId: string) {
        this.logger.log('[create] : creating RFQ');
        const company = await this.prisma.company.findUnique({
            where: { id: dto.companyId },
        });
        if (!company) {
            throw new BadRequestException('Invalid company ID');
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

        try {
            const rfq = await this.prisma.$transaction(async (tx) => {
                const created = await tx.rfq.create({
                    data: {
                        rfqNumber: dto.rfqNumber,
                        companyId: dto.companyId,
                        createdByUserId: userId,
                        items: {
                            create: dto.items.map((item) => ({
                                itemId: item.itemId,
                                quantity: new Prisma.Decimal(item.quantity),
                            })),
                        },
                    },
                    include: { items: true, vendors: true },
                });

                await this.itemLockService.lockItems(
                    dto.items.map((item) => item.itemId),
                    tx,
                );

                return created;
            });
            this.logger.log('[create] : execution finished');
            return this.mapRfq(rfq);
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new ConflictException('RFQ number already exists for company');
            }
            throw error;
        }
    }

    async findAll(query: PaginationQueryDto, filters: RfqFilterDto) {
        this.logger.log('[findAll] : listing RFQs');
        const { skip, take, page, limit } = getPaginationParams(query.page, query.limit);

        const where: Prisma.RfqWhereInput = {
            ...(filters.companyId ? { companyId: filters.companyId } : {}),
            ...(filters.status ? { status: filters.status } : {}),
        };

        const [rfqs, total] = await Promise.all([
            this.prisma.rfq.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: {
                    items: true,
                    vendors: { include: { vendor: true } },
                    quotes: { include: { items: true, vendor: true } },
                },
            }),
            this.prisma.rfq.count({ where }),
        ]);

        const data = rfqs.map((rfq) => this.mapRfq(rfq));
        this.logger.log('[findAll] : execution finished');
        return buildPaginatedResult(data, total, page, limit);
    }

    async findOne(id: string) {
        this.logger.log('[findOne] : fetching RFQ');
        const rfq = await this.prisma.rfq.findUnique({
            where: { id },
            include: {
                items: true,
                vendors: { include: { vendor: true } },
                quotes: { include: { items: true, vendor: true } },
            },
        });
        if (!rfq) {
            throw new NotFoundException('RFQ not found');
        }
        this.logger.log('[findOne] : execution finished');
        return this.mapRfq(rfq);
    }

    async attachVendors(id: string, dto: AttachVendorsDto) {
        this.logger.log('[attachVendors] : attaching vendors to RFQ');
        const rfq = await this.findOne(id);
        if (rfq.status !== RfqStatus.DRAFT) {
            throw new BadRequestException('Vendors can only be attached to DRAFT RFQs');
        }

        const vendors = await this.prisma.vendor.findMany({
            where: { id: { in: dto.vendorIds } },
        });
        if (vendors.length !== dto.vendorIds.length) {
            throw new BadRequestException('One or more vendor IDs are invalid');
        }

        await this.prisma.rfqVendor.createMany({
            data: dto.vendorIds.map((vendorId) => ({ rfqId: id, vendorId })),
            skipDuplicates: true,
        });

        this.logger.log('[attachVendors] : execution finished');
        return this.findOne(id);
    }

    async send(id: string) {
        this.logger.log('[send] : sending RFQ');
        const rfq = await this.prisma.rfq.findUnique({
            where: { id },
            include: { vendors: true, items: true },
        });
        if (!rfq) {
            throw new NotFoundException('RFQ not found');
        }
        if (rfq.status !== RfqStatus.DRAFT) {
            throw new BadRequestException('Only DRAFT RFQs can be sent');
        }
        if (!rfq.vendors.length) {
            throw new BadRequestException('Attach at least one vendor before sending');
        }
        if (!rfq.items.length) {
            throw new BadRequestException('RFQ must have at least one item');
        }

        const updated = await this.prisma.rfq.update({
            where: { id },
            data: { status: RfqStatus.SENT },
            include: {
                items: true,
                vendors: { include: { vendor: true } },
            },
        });
        this.logger.log('[send] : execution finished');
        return this.mapRfq(updated);
    }

    async close(id: string) {
        this.logger.log('[close] : closing RFQ');
        const rfq = await this.findOne(id);
        if (rfq.status !== RfqStatus.SENT) {
            throw new BadRequestException('Only SENT RFQs can be closed');
        }

        const updated = await this.prisma.rfq.update({
            where: { id },
            data: { status: RfqStatus.CLOSED },
            include: {
                items: true,
                vendors: { include: { vendor: true } },
                quotes: { include: { items: true, vendor: true } },
            },
        });
        this.logger.log('[close] : execution finished');
        return this.mapRfq(updated);
    }
}
