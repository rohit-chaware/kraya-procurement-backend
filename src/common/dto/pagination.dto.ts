import { createZodDto } from 'nestjs-zod';
import { paginationQuerySchema } from '../schemas/shared.schema';

export class PaginationQueryDto extends createZodDto(paginationQuerySchema) {}

export interface PaginatedResult<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export function buildPaginatedResult<T>(data: T[], total: number, page: number, limit: number): PaginatedResult<T> {
    return {
        data,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1,
        },
    };
}

export function getPaginationParams(page = 1, limit = 10) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    return {
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
        page: safePage,
        limit: safeLimit,
    };
}
