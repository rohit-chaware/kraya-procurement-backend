import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from './common/decorators/auth.decorators';

@ApiTags('Health')
@Controller('health')
export class HealthController {
    @Public()
    @Get()
    @ApiOperation({ summary: 'Health check' })
    check() {
        return {
            status: 'ok',
            service: 'kraya-procurement-backend',
            timestamp: new Date().toISOString(),
        };
    }
}
