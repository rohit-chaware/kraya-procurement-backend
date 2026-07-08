import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma, RfqStatus } from '../prisma/prisma-types';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVendorDto, SubmitVendorQuoteDto, UpdateVendorDto, VendorFilterDto, VendorLoginDto } from './dto/vendor.dto';
import { comparePassword, hashPassword, sanitizeVendor } from '../common/utils/password.util';
import { JwtVendorPayload } from '../common/decorators/current-user.decorator';
import { buildPaginatedResult, getPaginationParams, PaginationQueryDto } from '../common/dto/pagination.dto';

@Injectable()
export class VendorsService {
    private readonly logger = new Logger(VendorsService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
    ) {}

    async create(dto: CreateVendorDto) {
        this.logger.log('[create] : creating vendor');
        const existing = await this.prisma.vendor.findUnique({
            where: { email: dto.email },
        });
        if (existing) {
            throw new ConflictException('Vendor email already exists');
        }

        const vendor = await this.prisma.vendor.create({
            data: {
                name: dto.name,
                email: dto.email,
                phone: dto.phone,
                address: dto.address,
                companyName: dto.companyName,
                password: await hashPassword(dto.password),
            },
        });
        this.logger.log('[create] : execution finished');
        return sanitizeVendor(vendor);
    }

    async findAll(query: PaginationQueryDto, filters: VendorFilterDto) {
        this.logger.log('[findAll] : listing vendors');
        const { skip, take, page, limit } = getPaginationParams(query.page, query.limit);

        const where = filters.search
            ? {
                  OR: [
                      {
                          name: { contains: filters.search, mode: 'insensitive' as const },
                      },
                      {
                          email: { contains: filters.search, mode: 'insensitive' as const },
                      },
                      {
                          companyName: {
                              contains: filters.search,
                              mode: 'insensitive' as const,
                          },
                      },
                  ],
              }
            : {};

        const [vendors, total] = await Promise.all([
            this.prisma.vendor.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.vendor.count({ where }),
        ]);

        const data = vendors.map((vendor) => sanitizeVendor(vendor));
        this.logger.log('[findAll] : execution finished');
        return buildPaginatedResult(data, total, page, limit);
    }

    async findOne(id: string) {
        this.logger.log('[findOne] : fetching vendor');
        const vendor = await this.prisma.vendor.findUnique({ where: { id } });
        if (!vendor) {
            throw new NotFoundException('Vendor not found');
        }
        this.logger.log('[findOne] : execution finished');
        return sanitizeVendor(vendor);
    }

    async update(id: string, dto: UpdateVendorDto) {
        this.logger.log('[update] : updating vendor');
        await this.findOne(id);

        if (dto.email) {
            const existing = await this.prisma.vendor.findFirst({
                where: { email: dto.email, NOT: { id } },
            });
            if (existing) {
                throw new ConflictException('Vendor email already exists');
            }
        }

        const vendor = await this.prisma.vendor.update({
            where: { id },
            data: {
                name: dto.name,
                email: dto.email,
                phone: dto.phone,
                address: dto.address,
                companyName: dto.companyName,
                password: dto.password ? await hashPassword(dto.password) : undefined,
            },
        });
        this.logger.log('[update] : execution finished');
        return sanitizeVendor(vendor);
    }

    async login(dto: VendorLoginDto) {
        this.logger.log('[login] : authenticating vendor');
        const vendor = await this.prisma.vendor.findUnique({
            where: { email: dto.email },
        });
        if (!vendor) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const valid = await comparePassword(dto.password, vendor.password);
        if (!valid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const payload: JwtVendorPayload = {
            sub: vendor.id,
            email: vendor.email,
            type: 'vendor',
        };

        const accessToken = await this.jwtService.signAsync(payload);

        this.logger.log('[login] : execution finished');
        return {
            accessToken,
            vendor: sanitizeVendor(vendor),
        };
    }

    async submitQuote(rfqId: string, vendorId: string, dto: SubmitVendorQuoteDto) {
        this.logger.log('[submitQuote] : submitting vendor quote');
        const rfq = await this.prisma.rfq.findUnique({
            where: { id: rfqId },
            include: { items: true, vendors: true },
        });
        if (!rfq) {
            throw new NotFoundException('RFQ not found');
        }
        if (rfq.status !== RfqStatus.SENT) {
            throw new BadRequestException('Quotes can only be submitted for SENT RFQs');
        }

        const isAttached = rfq.vendors.some((v) => v.vendorId === vendorId);
        if (!isAttached) {
            throw new BadRequestException('Vendor is not attached to this RFQ');
        }

        const rfqItemIds = new Set(rfq.items.map((i) => i.id));
        for (const item of dto.items) {
            if (!rfqItemIds.has(item.rfqItemId)) {
                throw new BadRequestException(`Invalid RFQ item ID: ${item.rfqItemId}`);
            }
        }

        const rfqItemMap = new Map(rfq.items.map((i) => [i.id, i]));

        const quote = await this.prisma.vendorQuote.upsert({
            where: {
                rfqId_vendorId: { rfqId, vendorId },
            },
            create: {
                rfqId,
                vendorId,
                items: {
                    create: dto.items.map((item) => {
                        const rfqItem = rfqItemMap.get(item.rfqItemId)!;
                        return {
                            rfqItemId: item.rfqItemId,
                            itemId: rfqItem.itemId,
                            quantity: new Prisma.Decimal(item.quantity),
                            perUnitRate: new Prisma.Decimal(item.perUnitRate),
                        };
                    }),
                },
            },
            update: {
                items: {
                    deleteMany: {},
                    create: dto.items.map((item) => {
                        const rfqItem = rfqItemMap.get(item.rfqItemId)!;
                        return {
                            rfqItemId: item.rfqItemId,
                            itemId: rfqItem.itemId,
                            quantity: new Prisma.Decimal(item.quantity),
                            perUnitRate: new Prisma.Decimal(item.perUnitRate),
                        };
                    }),
                },
            },
            include: {
                items: true,
                vendor: true,
                rfq: true,
            },
        });

        this.logger.log('[submitQuote] : execution finished');
        return {
            ...quote,
            vendor: sanitizeVendor(quote.vendor),
            items: quote.items.map((item) => ({
                ...item,
                quantity: Number(item.quantity),
                perUnitRate: Number(item.perUnitRate),
            })),
        };
    }

    async getVendorRfqs(vendorId: string, query: PaginationQueryDto) {
        this.logger.log('[getVendorRfqs] : listing vendor RFQs');
        const { skip, take, page, limit } = getPaginationParams(query.page, query.limit);

        const where = {
            vendors: { some: { vendorId } },
            status: RfqStatus.SENT,
        };

        const [rfqs, total] = await Promise.all([
            this.prisma.rfq.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: {
                    items: { include: { item: true } },
                    vendors: true,
                },
            }),
            this.prisma.rfq.count({ where }),
        ]);

        const data = rfqs.map((rfq) => ({
            ...rfq,
            items: rfq.items.map((item) => ({
                ...item,
                quantity: Number(item.quantity),
            })),
        }));

        this.logger.log('[getVendorRfqs] : execution finished');
        return buildPaginatedResult(data, total, page, limit);
    }
}
