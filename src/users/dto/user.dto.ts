import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { paginationQuerySchema, uuidSchema } from '../../common/schemas/shared.schema';

export const createUserSchema = z
    .object({
        name: z.string().min(1),
        email: z.email(),
        phone: z.string().min(1),
        password: z.string().min(6),
        roleIds: z.array(uuidSchema).min(1),
        isAdmin: z.boolean().optional().default(false),
    })
    .strict();

export const assignRolesSchema = z
    .object({
        roleIds: z.array(uuidSchema).min(1),
    })
    .strict();

export const listUsersQuerySchema = paginationQuerySchema.extend({
    search: z.string().optional(),
});

export const updateUserStatusSchema = z
    .object({
        isActive: z.boolean(),
    })
    .strict();

export class CreateUserDto extends createZodDto(createUserSchema) {}
export class AssignRolesDto extends createZodDto(assignRolesSchema) {}
export class ListUsersQueryDto extends createZodDto(listUsersQuerySchema) {}
export class UpdateUserStatusDto extends createZodDto(updateUserStatusSchema) {}
