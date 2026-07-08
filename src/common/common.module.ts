import { Module } from '@nestjs/common';
import { PermissionsService } from './services/permissions.service';
import { ItemLockService } from './services/item-lock.service';

@Module({
    providers: [PermissionsService, ItemLockService],
    exports: [PermissionsService, ItemLockService],
})
export class CommonModule {}
