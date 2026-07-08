import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '../prisma/prisma-types';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';

@Injectable()
export class RolesService {
    private readonly logger = new Logger(RolesService.name);

    constructor(private readonly prisma: PrismaService) {}

    async create(dto: CreateRoleDto) {
        this.logger.log('[create] : creating role');
        const existing = await this.prisma.role.findUnique({
            where: { name: dto.name },
        });
        if (existing) {
            throw new ConflictException('Role name already exists');
        }

        const role = await this.prisma.role.create({
            data: {
                name: dto.name,
                description: dto.description,
                permissions: dto.permissions,
            },
        });
        this.logger.log('[create] : execution finished');
        return role;
    }

    async findAll() {
        this.logger.log('[findAll] : listing roles');
        const roles = await this.prisma.role.findMany({ orderBy: { name: 'asc' } });
        this.logger.log('[findAll] : execution finished');
        return roles;
    }

    async findOne(id: string) {
        this.logger.log('[findOne] : fetching role');
        const role = await this.prisma.role.findUnique({ where: { id } });
        if (!role) {
            throw new NotFoundException('Role not found');
        }
        this.logger.log('[findOne] : execution finished');
        return role;
    }

    async update(id: string, dto: UpdateRoleDto) {
        this.logger.log('[update] : updating role');
        await this.findOne(id);

        if (dto.name) {
            const existing = await this.prisma.role.findFirst({
                where: { name: dto.name, NOT: { id } },
            });
            if (existing) {
                throw new ConflictException('Role name already exists');
            }
        }

        const role = await this.prisma.role.update({
            where: { id },
            data: {
                name: dto.name,
                description: dto.description,
                permissions: dto.permissions,
            },
        });
        this.logger.log('[update] : execution finished');
        return role;
    }
}
