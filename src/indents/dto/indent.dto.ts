import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { uuidSchema, paginationQuerySchema } from '../../common/schemas/shared.schema';
import { IndentStatus } from '../../prisma/prisma-types';

const indentStatusSchema = z.enum([IndentStatus.DRAFT, IndentStatus.SUBMITTED, IndentStatus.APPROVED, IndentStatus.REJECTED]);

export const indentItemSchema = z
    .object({
        itemId: uuidSchema,
        quantity: z.coerce.number().min(0.01),
        remarks: z.string().optional(),
    })
    .strict();

export const createIndentSchema = z
    .object({
        indentNumber: z.string().min(1),
        companyId: uuidSchema,
        remarks: z.string().optional(),
        items: z.array(indentItemSchema).min(1),
    })
    .strict();

export const updateIndentSchema = z
    .object({
        remarks: z.string().optional(),
        items: z.array(indentItemSchema).min(1).optional(),
    })
    .strict();

export const indentActionSchema = z.enum(['submit', 'approve', 'reject']);

export const transitionIndentSchema = z
    .object({
        action: indentActionSchema,
    })
    .strict();

export const indentFilterSchema = z
    .object({
        companyId: uuidSchema.optional(),
        status: indentStatusSchema.optional(),
    })
    .strict();

export const indentListQuerySchema = paginationQuerySchema.extend({
    companyId: uuidSchema.optional(),
    status: indentStatusSchema.optional(),
});

export class IndentItemDto extends createZodDto(indentItemSchema) {}
export class CreateIndentDto extends createZodDto(createIndentSchema) {}
export class UpdateIndentDto extends createZodDto(updateIndentSchema) {}
export class TransitionIndentDto extends createZodDto(transitionIndentSchema) {}
export class IndentFilterDto extends createZodDto(indentFilterSchema) {}
export class IndentListQueryDto extends createZodDto(indentListQuerySchema) {}
