import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IndentsService } from './indents.service';
import { CreateIndentDto, IndentListQueryDto, TransitionIndentDto, UpdateIndentDto } from './dto/indent.dto';
import { RequirePermission } from '../common/decorators/auth.decorators';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtUserPayload } from '../common/decorators/current-user.decorator';

@ApiTags('Indents')
@ApiBearerAuth()
@Controller('indents')
export class IndentsController {
    constructor(private readonly indentsService: IndentsService) {}

    @RequirePermission('indent', 'create')
    @Post()
    @ApiOperation({ summary: 'Create indent with items' })
    create(@Body() dto: CreateIndentDto, @CurrentUser() user: JwtUserPayload) {
        return this.indentsService.create(dto, user.sub);
    }

    @RequirePermission('indent', 'read')
    @Get()
    @ApiOperation({ summary: 'List indents' })
    findAll(@Query() query: IndentListQueryDto) {
        const { page, limit, ...filters } = query;
        return this.indentsService.findAll({ page, limit }, filters);
    }

    @RequirePermission('indent', 'read')
    @Get(':id')
    @ApiOperation({ summary: 'Get indent by ID' })
    findOne(@Param('id') id: string) {
        return this.indentsService.findOne(id);
    }

    @RequirePermission('indent', 'update')
    @Patch(':id')
    @ApiOperation({ summary: 'Update indent (DRAFT only)' })
    update(@Param('id') id: string, @Body() dto: UpdateIndentDto) {
        return this.indentsService.update(id, dto);
    }

    @RequirePermission('indent', 'update')
    @Post(':id/status')
    @ApiOperation({
        summary: 'Transition indent status (submit, approve, reject)',
    })
    transitionStatus(@Param('id') id: string, @Body() dto: TransitionIndentDto) {
        return this.indentsService.transitionStatus(id, dto);
    }
}
