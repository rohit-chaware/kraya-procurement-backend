import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { VendorsService } from './vendors.service';
import { CreateVendorDto, SubmitVendorQuoteDto, UpdateVendorDto, VendorListQueryDto, VendorLoginDto } from './dto/vendor.dto';
import { Public, RequirePermission, VendorOnly } from '../common/decorators/auth.decorators';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { CurrentVendor } from '../common/decorators/current-user.decorator';
import type { JwtVendorPayload } from '../common/decorators/current-user.decorator';

@ApiTags('Vendors')
@Controller('vendors')
export class VendorsController {
    constructor(private readonly vendorsService: VendorsService) {}

    @Public()
    @Post('auth/login')
    @ApiOperation({ summary: 'Vendor login' })
    login(@Body() dto: VendorLoginDto) {
        return this.vendorsService.login(dto);
    }

    @VendorOnly()
    @ApiBearerAuth()
    @Get('portal/rfqs')
    @ApiOperation({ summary: 'List RFQs assigned to logged-in vendor' })
    getMyRfqs(@CurrentVendor() vendor: JwtVendorPayload, @Query() query: PaginationQueryDto) {
        return this.vendorsService.getVendorRfqs(vendor.sub, query);
    }

    @VendorOnly()
    @ApiBearerAuth()
    @Post('portal/rfqs/:rfqId/quote')
    @ApiOperation({ summary: 'Submit quote for an RFQ' })
    submitQuote(@Param('rfqId') rfqId: string, @CurrentVendor() vendor: JwtVendorPayload, @Body() dto: SubmitVendorQuoteDto) {
        return this.vendorsService.submitQuote(rfqId, vendor.sub, dto);
    }

    @RequirePermission('vendor', 'create')
    @ApiBearerAuth()
    @Post()
    @ApiOperation({ summary: 'Create vendor' })
    create(@Body() dto: CreateVendorDto) {
        return this.vendorsService.create(dto);
    }

    @RequirePermission('vendor', 'read')
    @ApiBearerAuth()
    @Get()
    @ApiOperation({ summary: 'List vendors' })
    findAll(@Query() query: VendorListQueryDto) {
        const { page, limit, ...filters } = query;
        return this.vendorsService.findAll({ page, limit }, filters);
    }

    @RequirePermission('vendor', 'read')
    @ApiBearerAuth()
    @Get(':id')
    @ApiOperation({ summary: 'Get vendor by ID' })
    findOne(@Param('id') id: string) {
        return this.vendorsService.findOne(id);
    }

    @RequirePermission('vendor', 'update')
    @ApiBearerAuth()
    @Patch(':id')
    @ApiOperation({ summary: 'Update vendor' })
    update(@Param('id') id: string, @Body() dto: UpdateVendorDto) {
        return this.vendorsService.update(id, dto);
    }
}
