import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { AssignRolesDto, CreateUserDto, ListUsersQueryDto, UpdateUserStatusDto } from './dto/user.dto';
import { AdminOnly } from '../common/decorators/auth.decorators';

@ApiTags('Users')
@ApiBearerAuth()
@AdminOnly()
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Post()
    @ApiOperation({ summary: 'Create user with roles (admin only)' })
    create(@Body() dto: CreateUserDto) {
        return this.usersService.create(dto);
    }

    @Get()
    @ApiOperation({ summary: 'List users (admin only)' })
    @ApiQuery({ name: 'search', required: false })
    findAll(@Query() query: ListUsersQueryDto) {
        return this.usersService.findAll(query);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get user by ID (admin only)' })
    findOne(@Param('id') id: string) {
        return this.usersService.findOne(id);
    }

    @Post(':id/roles')
    @ApiOperation({ summary: 'Assign roles to user (admin only)' })
    assignRoles(@Param('id') id: string, @Body() dto: AssignRolesDto) {
        return this.usersService.assignRoles(id, dto);
    }

    @Patch(':id/status')
    @ApiOperation({ summary: 'Update user active status (admin only)' })
    updateStatus(@Param('id') id: string, @Body() dto: UpdateUserStatusDto) {
        return this.usersService.setActiveStatus(id, dto.isActive);
    }
}
