import { Module } from '@nestjs/common';
import { PantallasService } from './pantallas.service';
import { PantallasController } from './pantallas.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pantalla } from './entities/pantalla.entity';
import { Roles } from '../roles/entities/role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pantalla, Roles])],
  controllers: [PantallasController],
  providers: [PantallasService],
  exports: [PantallasService, TypeOrmModule.forFeature([Pantalla, Roles])],
})
export class PantallasModule {}
