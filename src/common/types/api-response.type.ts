import { PaginatedResult } from '../dto/pagination.dto';

export interface ApiResponseMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface ApiValidationError {
    path: string;
    message: string;
    code: string;
}

export interface ApiResponse<T = unknown> {
    success: boolean;
    statusCode: number;
    message: string;
    data: T | null;
    meta?: ApiResponseMeta;
    errors?: ApiValidationError[];
    timestamp: string;
}

export function isApiResponse(value: unknown): value is ApiResponse {
    return (
        typeof value === 'object' &&
        value !== null &&
        'success' in value &&
        'statusCode' in value &&
        'message' in value &&
        'data' in value &&
        'timestamp' in value
    );
}

export function isPaginatedResult<T>(value: unknown): value is PaginatedResult<T> {
    return (
        typeof value === 'object' &&
        value !== null &&
        'data' in value &&
        Array.isArray((value as PaginatedResult<T>).data) &&
        'meta' in value &&
        typeof (value as PaginatedResult<T>).meta === 'object' &&
        (value as PaginatedResult<T>).meta !== null
    );
}

export function buildSuccessResponse<T>(data: T, statusCode = 200, message = 'Success'): ApiResponse<T> {
    return {
        success: true,
        statusCode,
        message,
        data,
        timestamp: new Date().toISOString(),
    };
}

export function buildPaginatedApiResponse<T>(result: PaginatedResult<T>, statusCode = 200, message = 'Success'): ApiResponse<T[]> {
    return {
        success: true,
        statusCode,
        message,
        data: result.data,
        meta: result.meta,
        timestamp: new Date().toISOString(),
    };
}

export function buildErrorResponse(statusCode: number, message: string, errors?: ApiValidationError[]): ApiResponse<null> {
    return {
        success: false,
        statusCode,
        message,
        data: null,
        errors,
        timestamp: new Date().toISOString(),
    };
}
