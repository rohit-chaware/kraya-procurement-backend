import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse, buildPaginatedApiResponse, buildSuccessResponse, isApiResponse, isPaginatedResult } from '../types/api-response.type';

@Injectable()
export class ApiResponseInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse> {
        const response = context.switchToHttp().getResponse<Response>();

        return next.handle().pipe(
            map((data) => {
                if (isApiResponse(data)) {
                    return data;
                }

                const statusCode = response.statusCode ?? 200;

                if (isPaginatedResult(data)) {
                    return buildPaginatedApiResponse(data, statusCode);
                }

                return buildSuccessResponse(data ?? null, statusCode);
            }),
        );
    }
}
