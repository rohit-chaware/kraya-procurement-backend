import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MiService } from './mi.service';
import { CreateMiDto, MiListQueryDto } from './dto/mi.dto';
import { RequirePermission } from '../common/decorators/auth.decorators';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtUserPayload } from '../common/decorators/current-user.decorator';

@ApiTags('Material Issues')
@ApiBearerAuth()
@Controller('mi')
export class MiController {
    constructor(private readonly miService: MiService) {}

    @RequirePermission('mi', 'create')
    @Post()
    @ApiOperation({ summary: 'Create material issue' })
    create(@Body() dto: CreateMiDto, @CurrentUser() user: JwtUserPayload) {
        return this.miService.create(dto, user.sub);
    }

    @RequirePermission('mi', 'read')
    @Get()
    @ApiOperation({ summary: 'List material issues' })
    findAll(@Query() query: MiListQueryDto) {
        const { page, limit, ...filters } = query;
        return this.miService.findAll({ page, limit }, filters);
    }

    @RequirePermission('mi', 'read')
    @Get(':id')
    @ApiOperation({ summary: 'Get material issue by ID' })
    findOne(@Param('id') id: string) {
        return this.miService.findOne(id);
    }

    @RequirePermission('mi', 'update')
    @Post(':id/issue')
    @ApiOperation({ summary: 'Issue material (DRAFT -> ISSUED)' })
    issue(@Param('id') id: string) {
        return this.miService.issue(id);
    }
}
