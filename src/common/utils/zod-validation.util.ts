import { ZodError } from 'zod';
import { ApiValidationError } from '../types/api-response.type';

export function formatZodValidationErrors(error: unknown): ApiValidationError[] {
    if (!(error instanceof ZodError)) {
        return [];
    }

    return error.issues.map((issue) => ({
        path: issue.path.length > 0 ? issue.path.join('.') : 'body',
        message: issue.message,
        code: issue.code,
    }));
}
