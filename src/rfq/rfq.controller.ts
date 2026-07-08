import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RfqService } from './rfq.service';
import { AttachVendorsDto, CreateRfqDto, RfqListQueryDto } from './dto/rfq.dto';
import { RequirePermission } from '../common/decorators/auth.decorators';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtUserPayload } from '../common/decorators/current-user.decorator';

@ApiTags('RFQ')
@ApiBearerAuth()
@Controller('rfq')
export class RfqController {
    constructor(private readonly rfqService: RfqService) {}

    @RequirePermission('rfq', 'create')
    @Post()
    @ApiOperation({ summary: 'Create RFQ with items' })
    create(@Body() dto: CreateRfqDto, @CurrentUser() user: JwtUserPayload) {
        return this.rfqService.create(dto, user.sub);
    }

    @RequirePermission('rfq', 'read')
    @Get()
    @ApiOperation({ summary: 'List RFQs' })
    findAll(@Query() query: RfqListQueryDto) {
        const { page, limit, ...filters } = query;
        return this.rfqService.findAll({ page, limit }, filters);
    }

    @RequirePermission('rfq', 'read')
    @Get(':id')
    @ApiOperation({ summary: 'Get RFQ by ID' })
    findOne(@Param('id') id: string) {
        return this.rfqService.findOne(id);
    }

    @RequirePermission('rfq', 'update')
    @Post(':id/vendors')
    @ApiOperation({ summary: 'Attach vendors to RFQ' })
    attachVendors(@Param('id') id: string, @Body() dto: AttachVendorsDto) {
        return this.rfqService.attachVendors(id, dto);
    }

    @RequirePermission('rfq', 'update')
    @Post(':id/send')
    @ApiOperation({ summary: 'Send RFQ to vendors' })
    send(@Param('id') id: string) {
        return this.rfqService.send(id);
    }

    @RequirePermission('rfq', 'update')
    @Post(':id/close')
    @ApiOperation({ summary: 'Close RFQ' })
    close(@Param('id') id: string) {
        return this.rfqService.close(id);
    }
}
