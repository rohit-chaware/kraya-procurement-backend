import { Module } from '@nestjs/common';
import { MiService } from './mi.service';
import { MiController } from './mi.controller';
import { CommonModule } from '../common/common.module';

@Module({
    imports: [CommonModule],
    controllers: [MiController],
    providers: [MiService],
})
export class MiModule {}
