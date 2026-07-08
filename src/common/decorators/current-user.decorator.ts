import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface JwtUserPayload {
    sub: string;
    email: string;
    isAdmin: boolean;
    type: 'user';
}

export interface JwtVendorPayload {
    sub: string;
    email: string;
    type: 'vendor';
}

export type JwtPayload = JwtUserPayload | JwtVendorPayload;

export function isUserPayload(payload: JwtPayload | undefined): payload is JwtUserPayload {
    return payload?.type === 'user';
}

export function isVendorPayload(payload: JwtPayload | undefined): payload is JwtVendorPayload {
    return payload?.type === 'vendor';
}

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): JwtUserPayload => {
    const request = ctx.switchToHttp().getRequest<{ user: JwtUserPayload }>();
    return request.user;
});

export const CurrentVendor = createParamDecorator((_data: unknown, ctx: ExecutionContext): JwtVendorPayload => {
    const request = ctx.switchToHttp().getRequest<{ user: JwtVendorPayload }>();
    return request.user;
});
