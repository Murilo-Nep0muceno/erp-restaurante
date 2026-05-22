import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ProductModule } from './product/product.module';
import { SupplierModule } from './supplier/supplier.module';
import { PurchaseModule } from './purchase/purchase.module';
import { RecipeDishModule } from './recipe-dish/recipe-dish.module';
import { SettingsModule } from './settings/settings.module';
import { LogModule } from './log/log.module';
import { BackupModule } from './backup/backup.module';
import { OrderModule } from './order/order.module';

@Module({
  imports: [
    UserModule,
    AuthModule,
    ProductModule,
    SupplierModule,
    PurchaseModule,
    RecipeDishModule,
    SettingsModule,
    LogModule,
    BackupModule,
    OrderModule,
  ],
})
export class AppModule {}
