import { forwardRef, Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuariosService } from './usuarios.service';
import { UsuariosController } from './usuarios.controller';
import { RolesModule } from 'src/modules/roles/roles.module';
import { UploadsModule } from 'src/modules/uploads/uploads.module';
import { Usuarios, Perfil } from './entities';
import { Permiso } from '../permisos/entities/permiso.entity';
import { Pantalla } from '../pantallas/entities/pantalla.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Usuarios, Perfil, Permiso, Pantalla]),
    RolesModule,
    forwardRef(() => UploadsModule),
  ],
  controllers: [UsuariosController],
  providers: [UsuariosService],
  exports: [UsuariosService],
})
export class UsuariosModule {}
