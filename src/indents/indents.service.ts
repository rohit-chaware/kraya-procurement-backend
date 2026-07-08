import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { IndentStatus, Prisma } from '../prisma/prisma-types';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIndentDto, IndentFilterDto, TransitionIndentDto, UpdateIndentDto } from './dto/indent.dto';
import { buildPaginatedResult, getPaginationParams, PaginationQueryDto } from '../common/dto/pagination.dto';
import { ItemLockService } from '../common/services/item-lock.service';

@Injectable()
export class IndentsService {
    private readonly logger = new Logger(IndentsService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly itemLockService: ItemLockService,
    ) {}

    private mapIndent<T extends { items: Array<{ quantity: Prisma.Decimal }> }>(indent: T) {
        return {
            ...indent,
            items: indent.items.map((item) => ({
                ...item,
                quantity: Number(item.quantity),
            })),
        };
    }

    private async validateItems(itemIds: string[]) {
        const items = await this.prisma.item.findMany({
            where: { id: { in: itemIds }, isDeleted: false },
        });
        if (items.length !== itemIds.length) {
            throw new BadRequestException('One or more items are invalid');
        }
    }

    async create(dto: CreateIndentDto, userId: string) {
        this.logger.log('[create] : creating indent');
        const company = await this.prisma.company.findUnique({
            where: { id: dto.companyId },
        });
        if (!company) {
            throw new BadRequestException('Invalid company ID');
        }

        await this.validateItems(dto.items.map((i) => i.itemId));

        try {
            const indent = await this.prisma.$transaction(async (tx) => {
                const created = await tx.indent.create({
                    data: {
                        indentNumber: dto.indentNumber,
                        companyId: dto.companyId,
                        createdByUserId: userId,
                        remarks: dto.remarks,
                        items: {
                            create: dto.items.map((item) => ({
                                itemId: item.itemId,
                                quantity: new Prisma.Decimal(item.quantity),
                                remarks: item.remarks,
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
            return this.mapIndent(indent);
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new ConflictException('Indent number already exists for company');
            }
            throw error;
        }
    }

    async findAll(query: PaginationQueryDto, filters: IndentFilterDto) {
        this.logger.log('[findAll] : listing indents');
        const { skip, take, page, limit } = getPaginationParams(query.page, query.limit);

        const where: Prisma.IndentWhereInput = {
            ...(filters.companyId ? { companyId: filters.companyId } : {}),
            ...(filters.status ? { status: filters.status } : {}),
        };

        const [indents, total] = await Promise.all([
            this.prisma.indent.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: { items: true },
            }),
            this.prisma.indent.count({ where }),
        ]);

        const data = indents.map((indent) => this.mapIndent(indent));
        this.logger.log('[findAll] : execution finished');
        return buildPaginatedResult(data, total, page, limit);
    }

    async findOne(id: string) {
        this.logger.log('[findOne] : fetching indent');
        const indent = await this.prisma.indent.findUnique({
            where: { id },
            include: { items: true },
        });
        if (!indent) {
            throw new NotFoundException('Indent not found');
        }
        this.logger.log('[findOne] : execution finished');
        return this.mapIndent(indent);
    }

    async update(id: string, dto: UpdateIndentDto) {
        this.logger.log('[update] : updating indent');
        const indent = await this.findOne(id);
        if (indent.status !== IndentStatus.DRAFT) {
            throw new BadRequestException('Only DRAFT indents can be updated');
        }

        if (dto.items) {
            const items = dto.items;
            await this.validateItems(items.map((i) => i.itemId));
            await this.prisma.$transaction(async (tx) => {
                await tx.indentItem.deleteMany({ where: { indentId: id } });
                await tx.indentItem.createMany({
                    data: items.map((item) => ({
                        indentId: id,
                        itemId: item.itemId,
                        quantity: new Prisma.Decimal(item.quantity),
                        remarks: item.remarks,
                    })),
                });
                await this.itemLockService.lockItems(
                    items.map((item) => item.itemId),
                    tx,
                );
            });
        }

        const updated = await this.prisma.indent.update({
            where: { id },
            data: { remarks: dto.remarks },
            include: { items: true },
        });
        this.logger.log('[update] : execution finished');
        return this.mapIndent(updated);
    }

    async transitionStatus(id: string, dto: TransitionIndentDto) {
        this.logger.log('[transitionStatus] : transitioning indent status');
        const indent = await this.findOne(id);

        const transitions: Record<TransitionIndentDto['action'], { from: IndentStatus; to: IndentStatus; label: string }> = {
            submit: {
                from: IndentStatus.DRAFT,
                to: IndentStatus.SUBMITTED,
                label: 'submitted',
            },
            approve: {
                from: IndentStatus.SUBMITTED,
                to: IndentStatus.APPROVED,
                label: 'approved',
            },
            reject: {
                from: IndentStatus.SUBMITTED,
                to: IndentStatus.REJECTED,
                label: 'rejected',
            },
        };

        const transition = transitions[dto.action];
        if (indent.status !== transition.from) {
            throw new BadRequestException(`Only ${transition.from} indents can be ${transition.label}`);
        }

        const updated = await this.prisma.indent.update({
            where: { id },
            data: { status: transition.to },
            include: { items: true },
        });
        this.logger.log('[transitionStatus] : execution finished');
        return this.mapIndent(updated);
    }
}
