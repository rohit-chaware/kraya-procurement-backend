import { BadRequestException, ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtUserPayload } from '../common/decorators/current-user.decorator';
import { comparePassword, hashPassword, sanitizeUser } from '../common/utils/password.util';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
    ) {}

    async register(dto: RegisterDto) {
        this.logger.log('[register] : registering new user');
        const existing = await this.prisma.user.findFirst({
            where: { OR: [{ email: dto.email }, { phone: dto.phone }] },
        });

        if (existing) {
            throw new ConflictException('Email or phone already registered');
        }

        const defaultRole = await this.prisma.role.findUnique({
            where: { name: 'Viewer' },
        });
        if (!defaultRole) {
            throw new BadRequestException('Default Viewer role not found. Run seed first.');
        }

        const roleIds = [defaultRole.id];

        const hashedPassword = await hashPassword(dto.password);
        const user = await this.prisma.user.create({
            data: {
                name: dto.name,
                email: dto.email,
                phone: dto.phone,
                password: hashedPassword,
                userRoles: {
                    create: roleIds.map((roleId) => ({ roleId })),
                },
            },
            include: {
                userRoles: { include: { role: true } },
            },
        });

        const token = await this.signToken(user.id, user.email, user.isAdmin);
        this.logger.log('[register] : execution finished');
        return {
            accessToken: token,
            user: sanitizeUser(user),
        };
    }

    async login(dto: LoginDto) {
        this.logger.log('[login] : authenticating user');
        if (!dto.email && !dto.phone) {
            throw new BadRequestException('Email or phone is required');
        }

        const user = await this.prisma.user.findFirst({
            where: dto.email ? { email: dto.email } : { phone: dto.phone },
            include: {
                userRoles: { include: { role: true } },
            },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (!user.isActive) {
            throw new UnauthorizedException('Account is deactivated');
        }

        const valid = await comparePassword(dto.password, user.password);
        if (!valid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const token = await this.signToken(user.id, user.email, user.isAdmin);
        this.logger.log('[login] : execution finished');
        return {
            accessToken: token,
            user: sanitizeUser(user),
        };
    }

    private signToken(userId: string, email: string, isAdmin: boolean) {
        const payload: JwtUserPayload = {
            sub: userId,
            email,
            isAdmin,
            type: 'user',
        };
        return this.jwtService.signAsync(payload);
    }
}
