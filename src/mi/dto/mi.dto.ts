import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { uuidSchema, paginationQuerySchema } from '../../common/schemas/shared.schema';
import { MiStatus } from '../../prisma/prisma-types';

const miStatusSchema = z.enum([MiStatus.DRAFT, MiStatus.ISSUED]);

export const miItemSchema = z
    .object({
        itemId: uuidSchema,
        quantity: z.coerce.number().min(0.01),
    })
    .strict();

export const createMiSchema = z
    .object({
        miNumber: z.string().min(1),
        indentId: uuidSchema.optional(),
        items: z.array(miItemSchema).min(1),
    })
    .strict();

export const miFilterSchema = z
    .object({
        status: miStatusSchema.optional(),
        indentId: uuidSchema.optional(),
    })
    .strict();

export const miListQuerySchema = paginationQuerySchema.extend({
    status: miStatusSchema.optional(),
    indentId: uuidSchema.optional(),
});

export class MiItemDto extends createZodDto(miItemSchema) {}
export class CreateMiDto extends createZodDto(createMiSchema) {}
export class MiFilterDto extends createZodDto(miFilterSchema) {}
export class MiListQueryDto extends createZodDto(miListQuerySchema) {}
