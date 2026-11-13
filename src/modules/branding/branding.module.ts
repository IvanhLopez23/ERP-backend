import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadsModule } from '../uploads/uploads.module';
import { BrandingController } from './branding.controller';
import { BrandingService } from './branding.service';
import { Branding } from './entities/branding.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Branding]), UploadsModule],
  controllers: [BrandingController],
  providers: [BrandingService],
  exports: [BrandingService],
})
export class BrandingModule {}
