import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ItemsService } from './items.service';
import { CreateItemDto, ItemListQueryDto, UpdateItemDto } from './dto/item.dto';
import { RequirePermission } from '../common/decorators/auth.decorators';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtUserPayload } from '../common/decorators/current-user.decorator';

@ApiTags('Items')
@ApiBearerAuth()
@Controller('items')
export class ItemsController {
    constructor(private readonly itemsService: ItemsService) {}

    @RequirePermission('item', 'create')
    @Post()
    @ApiOperation({ summary: 'Create item' })
    create(@Body() dto: CreateItemDto, @CurrentUser() user: JwtUserPayload) {
        return this.itemsService.create(dto, user.sub);
    }

    @RequirePermission('item', 'read')
    @Get()
    @ApiOperation({ summary: 'List items with filters and pagination' })
    findAll(@Query() query: ItemListQueryDto) {
        const { page, limit, ...filters } = query;
        return this.itemsService.findAll({ page, limit }, filters);
    }

    @RequirePermission('item', 'read')
    @Get(':id')
    @ApiOperation({ summary: 'Get item by ID' })
    findOne(@Param('id') id: string) {
        return this.itemsService.findOne(id);
    }

    @RequirePermission('item', 'update')
    @Patch(':id')
    @ApiOperation({ summary: 'Update item (only if not locked)' })
    update(@Param('id') id: string, @Body() dto: UpdateItemDto, @CurrentUser() user: JwtUserPayload) {
        return this.itemsService.update(id, dto, user.sub);
    }

    @RequirePermission('item', 'delete')
    @Delete(':id')
    @ApiOperation({ summary: 'Soft delete item' })
    remove(@Param('id') id: string, @CurrentUser() user: JwtUserPayload) {
        return this.itemsService.softDelete(id, user.sub);
    }
}
