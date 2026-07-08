import { RolePermissions, EntityType, ActionType } from '../constants/permissions';

export function mergeRolePermissions(permissionsList: RolePermissions[]): RolePermissions {
    const merged: RolePermissions = {};

    for (const permissions of permissionsList) {
        for (const [entity, actions] of Object.entries(permissions)) {
            const entityKey = entity as EntityType;
            if (!merged[entityKey]) {
                merged[entityKey] = {
                    create: false,
                    read: false,
                    update: false,
                    delete: false,
                };
            }
            merged[entityKey].create = merged[entityKey].create || Boolean(actions?.create);
            merged[entityKey].read = merged[entityKey].read || Boolean(actions?.read);
            merged[entityKey].update = merged[entityKey].update || Boolean(actions?.update);
            merged[entityKey].delete = merged[entityKey].delete || Boolean(actions?.delete);
        }
    }

    return merged;
}

export function hasPermission(permissions: RolePermissions, entity: EntityType, action: ActionType): boolean {
    return Boolean(permissions[entity]?.[action]);
}
