import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AssignRolesDto } from './dto/user.dto';
import { hashPassword, sanitizeUser } from '../common/utils/password.util';
import { buildPaginatedResult, getPaginationParams } from '../common/dto/pagination.dto';
import { CreateUserDto, ListUsersQueryDto } from './dto/user.dto';

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);

    constructor(private readonly prisma: PrismaService) {}

    async create(dto: CreateUserDto) {
        this.logger.log('[create] : creating user with assigned roles');

        const existing = await this.prisma.user.findFirst({
            where: { OR: [{ email: dto.email }, { phone: dto.phone }] },
        });
        if (existing) {
            throw new ConflictException('Email or phone already registered');
        }

        const roles = await this.prisma.role.findMany({
            where: { id: { in: dto.roleIds } },
        });
        if (roles.length !== dto.roleIds.length) {
            throw new BadRequestException('One or more role IDs are invalid');
        }

        const user = await this.prisma.user.create({
            data: {
                name: dto.name,
                email: dto.email,
                phone: dto.phone,
                password: await hashPassword(dto.password),
                isAdmin: dto.isAdmin ?? false,
                userRoles: {
                    create: dto.roleIds.map((roleId) => ({ roleId })),
                },
            },
            include: {
                userRoles: { include: { role: true } },
            },
        });

        this.logger.log('[create] : execution finished');
        return sanitizeUser(user);
    }

    async findAll(query: ListUsersQueryDto) {
        this.logger.log('[findAll] : listing users');
        const { skip, take, page, limit } = getPaginationParams(query.page, query.limit);

        const where = query.search
            ? {
                  OR: [
                      { name: { contains: query.search, mode: 'insensitive' as const } },
                      { email: { contains: query.search, mode: 'insensitive' as const } },
                      { phone: { contains: query.search, mode: 'insensitive' as const } },
                  ],
              }
            : {};

        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: {
                    userRoles: { include: { role: true } },
                },
            }),
            this.prisma.user.count({ where }),
        ]);

        const data = users.map((user) => sanitizeUser(user));
        this.logger.log('[findAll] : execution finished');
        return buildPaginatedResult(data, total, page, limit);
    }

    async findOne(id: string) {
        this.logger.log('[findOne] : fetching user');
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: {
                userRoles: { include: { role: true } },
            },
        });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        this.logger.log('[findOne] : execution finished');
        return sanitizeUser(user);
    }

    async assignRoles(id: string, dto: AssignRolesDto) {
        this.logger.log('[assignRoles] : assigning roles to user');
        if (!dto.roleIds.length) {
            throw new BadRequestException('At least one role is required');
        }

        await this.findOne(id);

        const roles = await this.prisma.role.findMany({
            where: { id: { in: dto.roleIds } },
        });
        if (roles.length !== dto.roleIds.length) {
            throw new BadRequestException('One or more role IDs are invalid');
        }

        await this.prisma.$transaction([
            this.prisma.userRole.deleteMany({ where: { userId: id } }),
            this.prisma.userRole.createMany({
                data: dto.roleIds.map((roleId) => ({ userId: id, roleId })),
            }),
        ]);

        this.logger.log('[assignRoles] : execution finished');
        return this.findOne(id);
    }

    async setActiveStatus(id: string, isActive: boolean) {
        this.logger.log('[setActiveStatus] : updating user active status');
        await this.findOne(id);
        const user = await this.prisma.user.update({
            where: { id },
            data: { isActive },
            include: {
                userRoles: { include: { role: true } },
            },
        });
        this.logger.log('[setActiveStatus] : execution finished');
        return sanitizeUser(user);
    }
}
