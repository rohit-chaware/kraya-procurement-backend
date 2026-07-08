import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const entityPermissionsSchema = z
    .object({
        create: z.boolean(),
        read: z.boolean(),
        update: z.boolean(),
        delete: z.boolean(),
    })
    .strict();

const rolePermissionsSchema = z
    .object({
        item: entityPermissionsSchema.optional(),
        indent: entityPermissionsSchema.optional(),
        mi: entityPermissionsSchema.optional(),
        rfq: entityPermissionsSchema.optional(),
        vendor: entityPermissionsSchema.optional(),
    })
    .strict();

export const createRoleSchema = z
    .object({
        name: z.string().min(1),
        description: z.string().optional(),
        permissions: rolePermissionsSchema,
    })
    .strict();

export const updateRoleSchema = z
    .object({
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        permissions: rolePermissionsSchema.optional(),
    })
    .strict();

export class EntityPermissionsDto extends createZodDto(entityPermissionsSchema) {}
export class RolePermissionsDto extends createZodDto(rolePermissionsSchema) {}
export class CreateRoleDto extends createZodDto(createRoleSchema) {}
export class UpdateRoleDto extends createZodDto(updateRoleSchema) {}
