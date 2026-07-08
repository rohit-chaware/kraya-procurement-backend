import { Module } from '@nestjs/common';
import { IndentsService } from './indents.service';
import { IndentsController } from './indents.controller';
import { CommonModule } from '../common/common.module';

@Module({
    imports: [CommonModule],
    controllers: [IndentsController],
    providers: [IndentsService],
})
export class IndentsModule {}
