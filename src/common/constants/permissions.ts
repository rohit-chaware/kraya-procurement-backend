export const ENTITIES = ['item', 'indent', 'mi', 'rfq', 'vendor'] as const;
export type EntityType = (typeof ENTITIES)[number];

export const ACTIONS = ['create', 'read', 'update', 'delete'] as const;
export type ActionType = (typeof ACTIONS)[number];

export interface EntityPermissions {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
}

export type RolePermissions = Partial<Record<EntityType, EntityPermissions>>;

export const PERMISSION_KEY = 'permissions';
export const IS_PUBLIC_KEY = 'isPublic';
export const IS_ADMIN_ONLY_KEY = 'isAdminOnly';
export const IS_VENDOR_ONLY_KEY = 'isVendorOnly';
