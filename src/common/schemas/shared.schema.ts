import { z } from 'zod';

export const uuidSchema = z.uuid();

export const paginationQuerySchema = z
    .object({
        page: z.coerce.number().int().min(1).optional().default(1),
        limit: z.coerce.number().int().min(1).max(100).optional().default(10),
    })
    .strict();
