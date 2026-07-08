import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

export function sanitizeUser<T extends { password?: string }>(user: T): Omit<T, 'password'> {
    const rest = { ...user };
    delete rest.password;
    return rest;
}

export function sanitizeVendor<T extends { password?: string }>(vendor: T): Omit<T, 'password'> {
    const rest = { ...vendor };
    delete rest.password;
    return rest;
}
