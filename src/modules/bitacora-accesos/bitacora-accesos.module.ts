import { Module } from '@nestjs/common';
import { BitacoraAccesosService } from './bitacora-accesos.service';
import { BitacoraAccesosController } from './bitacora-accesos.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BitacoraAcceso } from './entities/bitacora-acceso.entity';
import { Usuarios } from 'src/modules/usuarios/entities/usuario.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BitacoraAcceso, Usuarios])],
  controllers: [BitacoraAccesosController],
  providers: [BitacoraAccesosService],
  exports: [BitacoraAccesosService],
})
export class BitacoraAccesosModule {}
