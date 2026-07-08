import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { uuidSchema, paginationQuerySchema } from '../../common/schemas/shared.schema';

export const createVendorSchema = z
    .object({
        name: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
        address: z.string().optional(),
        companyName: z.string().optional(),
        password: z.string().min(6),
    })
    .strict();

export const updateVendorSchema = z
    .object({
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        companyName: z.string().optional(),
        password: z.string().min(6).optional(),
    })
    .strict();

export const vendorLoginSchema = z
    .object({
        email: z.string().email(),
        password: z.string().min(6),
    })
    .strict();

export const vendorQuoteItemSchema = z
    .object({
        rfqItemId: uuidSchema,
        quantity: z.coerce.number().min(0.01),
        perUnitRate: z.coerce.number().min(0),
    })
    .strict();

export const submitVendorQuoteSchema = z
    .object({
        items: z.array(vendorQuoteItemSchema).min(1),
    })
    .strict();

export const vendorFilterSchema = z
    .object({
        search: z.string().optional(),
    })
    .strict();

export const vendorListQuerySchema = paginationQuerySchema.extend({
    search: z.string().optional(),
});

export class CreateVendorDto extends createZodDto(createVendorSchema) {}
export class UpdateVendorDto extends createZodDto(updateVendorSchema) {}
export class VendorLoginDto extends createZodDto(vendorLoginSchema) {}
export class VendorQuoteItemDto extends createZodDto(vendorQuoteItemSchema) {}
export class SubmitVendorQuoteDto extends createZodDto(submitVendorQuoteSchema) {}
export class VendorFilterDto extends createZodDto(vendorFilterSchema) {}
export class VendorListQueryDto extends createZodDto(vendorListQuerySchema) {}
