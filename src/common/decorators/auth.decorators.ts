import { SetMetadata } from '@nestjs/common';
import { ActionType, EntityType, IS_ADMIN_ONLY_KEY, IS_PUBLIC_KEY, IS_VENDOR_ONLY_KEY, PERMISSION_KEY } from '../constants/permissions';

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const AdminOnly = () => SetMetadata(IS_ADMIN_ONLY_KEY, true);

export const VendorOnly = () => SetMetadata(IS_VENDOR_ONLY_KEY, true);

export const RequirePermission = (entity: EntityType, action: ActionType) => SetMetadata(PERMISSION_KEY, { entity, action });
