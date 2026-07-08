import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { uuidSchema, paginationQuerySchema } from '../../common/schemas/shared.schema';
import { RfqStatus } from '../../prisma/prisma-types';

const rfqStatusSchema = z.enum([RfqStatus.DRAFT, RfqStatus.SENT, RfqStatus.CLOSED]);

export const rfqItemSchema = z
    .object({
        itemId: uuidSchema,
        quantity: z.coerce.number().min(0.01),
    })
    .strict();

export const createRfqSchema = z
    .object({
        rfqNumber: z.string().min(1),
        companyId: uuidSchema,
        items: z.array(rfqItemSchema).min(1),
    })
    .strict();

export const attachVendorsSchema = z
    .object({
        vendorIds: z.array(uuidSchema).min(1),
    })
    .strict();

export const rfqFilterSchema = z
    .object({
        companyId: uuidSchema.optional(),
        status: rfqStatusSchema.optional(),
    })
    .strict();

export const rfqListQuerySchema = paginationQuerySchema.extend({
    companyId: uuidSchema.optional(),
    status: rfqStatusSchema.optional(),
});

export class RfqItemDto extends createZodDto(rfqItemSchema) {}
export class CreateRfqDto extends createZodDto(createRfqSchema) {}
export class AttachVendorsDto extends createZodDto(attachVendorsSchema) {}
export class RfqFilterDto extends createZodDto(rfqFilterSchema) {}
export class RfqListQueryDto extends createZodDto(rfqListQuerySchema) {}
