import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const registerSchema = z
    .object({
        name: z.string().min(1),
        email: z.email(),
        phone: z.string().min(1),
        password: z.string().min(6),
    })
    .strict();

export const loginSchema = z
    .object({
        email: z.email().optional(),
        phone: z.string().min(1).optional(),
        password: z.string().min(6),
    })
    .strict()
    .refine((data) => Boolean(data.email || data.phone), {
        message: 'Either email or phone is required',
    });

export const updateUserStatusSchema = z
    .object({
        isActive: z.boolean(),
    })
    .strict();

export class RegisterDto extends createZodDto(registerSchema) {}
export class LoginDto extends createZodDto(loginSchema) {}
export class UpdateUserStatusDto extends createZodDto(updateUserStatusSchema) {}
