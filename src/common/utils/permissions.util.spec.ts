import { mergeRolePermissions, hasPermission } from './permissions.util';
import { RolePermissions } from '../constants/permissions';

describe('permissions.util', () => {
    it('merges permissions with OR semantics', () => {
        const merged = mergeRolePermissions([
            {
                item: { create: true, read: true, update: false, delete: false },
            },
            {
                item: { create: false, read: true, update: true, delete: false },
            },
        ]);

        expect(merged.item).toEqual({
            create: true,
            read: true,
            update: true,
            delete: false,
        });
    });

    it('checks entity action permission', () => {
        const permissions: RolePermissions = {
            indent: { create: true, read: true, update: false, delete: false },
        };

        expect(hasPermission(permissions, 'indent', 'create')).toBe(true);
        expect(hasPermission(permissions, 'indent', 'delete')).toBe(false);
        expect(hasPermission(permissions, 'item', 'read')).toBe(false);
    });
});
