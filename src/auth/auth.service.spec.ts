import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as passwordUtil from '../common/utils/password.util';

describe('AuthService', () => {
    let service: AuthService;

    const prismaMock = {
        user: {
            findFirst: jest.fn(),
            create: jest.fn(),
        },
        role: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
        },
    };

    const jwtMock = {
        signAsync: jest.fn().mockResolvedValue('token'),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [AuthService, { provide: PrismaService, useValue: prismaMock }, { provide: JwtService, useValue: jwtMock }],
        }).compile();

        service = module.get<AuthService>(AuthService);
        jest.clearAllMocks();
    });

    it('logs in active user with valid credentials', async () => {
        prismaMock.user.findFirst.mockResolvedValue({
            id: 'user-1',
            email: 'user@kraya.com',
            password: 'hashed',
            isAdmin: false,
            isActive: true,
            userRoles: [],
        });
        jest.spyOn(passwordUtil, 'comparePassword').mockResolvedValue(true);
        jest.spyOn(passwordUtil, 'sanitizeUser').mockImplementation((user) => user);

        const result = await service.login({
            email: 'user@kraya.com',
            password: 'User@123',
        });

        expect(result.accessToken).toBe('token');
        expect(prismaMock.user.findFirst).toHaveBeenCalled();
    });

    it('rejects deactivated users', async () => {
        prismaMock.user.findFirst.mockResolvedValue({
            id: 'user-1',
            email: 'user@kraya.com',
            password: 'hashed',
            isAdmin: false,
            isActive: false,
            userRoles: [],
        });
        jest.spyOn(passwordUtil, 'comparePassword').mockResolvedValue(true);

        await expect(service.login({ email: 'user@kraya.com', password: 'User@123' })).rejects.toBeInstanceOf(UnauthorizedException);
    });
});
