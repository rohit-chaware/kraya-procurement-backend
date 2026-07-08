import { CanActivate, ExecutionContext, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ActionType, EntityType, IS_ADMIN_ONLY_KEY, IS_PUBLIC_KEY, IS_VENDOR_ONLY_KEY, PERMISSION_KEY } from '../../common/constants/permissions';
import { isUserPayload, isVendorPayload } from '../../common/decorators/current-user.decorator';
import { PermissionsService } from '../../common/services/permissions.service';
import { hasPermission } from '../../common/utils/permissions.util';

@Injectable()
export class PermissionsGuard implements CanActivate {
    private readonly logger = new Logger(PermissionsGuard.name);

    constructor(
        private readonly reflector: Reflector,
        private readonly permissionsService: PermissionsService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);

        if (isPublic) {
            return true;
        }

        const isVendorOnly = this.reflector.getAllAndOverride<boolean>(IS_VENDOR_ONLY_KEY, [context.getHandler(), context.getClass()]);

        const isAdminOnly = this.reflector.getAllAndOverride<boolean>(IS_ADMIN_ONLY_KEY, [context.getHandler(), context.getClass()]);

        const permissionMeta = this.reflector.getAllAndOverride<{
            entity: EntityType;
            action: ActionType;
        }>(PERMISSION_KEY, [context.getHandler(), context.getClass()]);

        const request = context.switchToHttp().getRequest();
        const principal = request.user;

        if (isVendorOnly) {
            if (!isVendorPayload(principal)) {
                throw new ForbiddenException('Vendor access required');
            }
            return true;
        }

        if (!isAdminOnly && !permissionMeta) {
            return true;
        }

        if (!isUserPayload(principal)) {
            throw new ForbiddenException('User authentication required');
        }

        if (principal.isAdmin) {
            return true;
        }

        if (isAdminOnly) {
            throw new ForbiddenException('Admin access required');
        }

        if (!permissionMeta) {
            return true;
        }

        const permissions = await this.permissionsService.getUserPermissions(principal.sub);

        if (!hasPermission(permissions, permissionMeta.entity, permissionMeta.action)) {
            this.logger.warn(`Permission denied for user ${principal.sub} on ${permissionMeta.entity}:${permissionMeta.action}`);
            throw new ForbiddenException(`Missing permission: ${permissionMeta.entity}.${permissionMeta.action}`);
        }

        return true;
    }
}
