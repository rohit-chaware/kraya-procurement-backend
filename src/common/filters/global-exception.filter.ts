import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';
import { ZodValidationException } from 'nestjs-zod';
import { ApiValidationError, buildErrorResponse } from '../types/api-response.type';
import { formatZodValidationErrors } from '../utils/zod-validation.util';

function mapIssueLikeErrors(errors: unknown[]): ApiValidationError[] {
    return errors
        .filter(
            (error): error is { path?: unknown[]; message: string; code?: string } =>
                typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string',
        )
        .map((issue) => ({
            path: Array.isArray(issue.path) && issue.path.length > 0 ? issue.path.map(String).join('.') : 'body',
            message: issue.message,
            code: issue.code ?? 'invalid',
        }));
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        if (exception instanceof ZodValidationException) {
            const errors = formatZodValidationErrors(exception.getZodError());

            response.status(HttpStatus.BAD_REQUEST).json(buildErrorResponse(HttpStatus.BAD_REQUEST, 'Validation failed', errors));
            return;
        }

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message: string | string[] = 'Internal server error';

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
            } else {
                const body = exceptionResponse as {
                    message?: string | string[];
                    errors?: unknown[];
                };

                message = body.message ?? exception.message;

                if (Array.isArray(body.errors) && body.errors.length > 0) {
                    const validationErrors = mapIssueLikeErrors(body.errors);

                    if (validationErrors.length > 0) {
                        response
                            .status(status)
                            .json(buildErrorResponse(status, typeof message === 'string' ? message : 'Validation failed', validationErrors));
                        return;
                    }
                }
            }
        } else if (exception instanceof Error) {
            this.logger.error(exception.message, exception.stack);
        }

        const primaryMessage = Array.isArray(message) ? message[0] : message;
        const errors =
            Array.isArray(message) && message.length > 1
                ? message.map((item) => ({
                      path: 'body',
                      message: item,
                      code: 'bad_request',
                  }))
                : undefined;

        response.status(status).json(buildErrorResponse(status, primaryMessage, errors));
    }
}
