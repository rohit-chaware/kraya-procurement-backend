import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { paginationQuerySchema, uuidSchema } from '../../common/schemas/shared.schema';

export const createItemSchema = z
    .object({
        itemId: z.string().min(1),
        companyId: uuidSchema,
        itemCode: z.string().min(1),
        name: z.string().min(1),
        description: z.string().optional(),
        unit: z.string().min(1),
        price: z.coerce.number().min(0),
    })
    .strict();

export const updateItemSchema = z
    .object({
        itemCode: z.string().min(1).optional(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        unit: z.string().min(1).optional(),
        price: z.coerce.number().min(0).optional(),
    })
    .strict();

export const itemFilterSchema = z
    .object({
        companyId: uuidSchema.optional(),
        search: z.string().optional(),
        itemCode: z.string().optional(),
    })
    .strict();

export const itemListQuerySchema = paginationQuerySchema.extend({
    companyId: uuidSchema.optional(),
    search: z.string().optional(),
    itemCode: z.string().optional(),
});

export class CreateItemDto extends createZodDto(createItemSchema) {}
export class UpdateItemDto extends createZodDto(updateItemSchema) {}
export class ItemFilterDto extends createZodDto(itemFilterSchema) {}
export class ItemListQueryDto extends createZodDto(itemListQuerySchema) {}
