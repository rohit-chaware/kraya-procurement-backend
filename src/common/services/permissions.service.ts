import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RolePermissions } from '../constants/permissions';
import { mergeRolePermissions } from '../utils/permissions.util';

@Injectable()
export class PermissionsService {
    private readonly logger = new Logger(PermissionsService.name);

    constructor(private readonly prisma: PrismaService) {}

    async getUserPermissions(userId: string): Promise<RolePermissions> {
        this.logger.log('[getUserPermissions] : fetching user permissions');
        const userRoles = await this.prisma.userRole.findMany({
            where: { userId },
            include: { role: true },
        });

        const permissionsList = userRoles.map((ur) => ur.role.permissions as RolePermissions);

        const merged = mergeRolePermissions(permissionsList);
        this.logger.log('[getUserPermissions] : execution finished');
        return merged;
    }
}
