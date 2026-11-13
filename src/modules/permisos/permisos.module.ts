import { Module } from '@nestjs/common';
import { PermisosService } from './permisos.service';
import { PermisosController } from './permisos.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permiso } from './entities/permiso.entity';
import { Pantalla } from '../pantallas/entities/pantalla.entity';
import { Roles } from '../roles/entities/role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Permiso, Pantalla, Roles])],
  controllers: [PermisosController],
  providers: [PermisosService],
  exports: [PermisosService, TypeOrmModule.forFeature([Permiso])],
})
export class PermisosModule {}
