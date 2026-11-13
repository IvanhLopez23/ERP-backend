import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { DesarrolloSeedService } from './desarrollo.seed.service';
import { SeedController } from './seed.controller';
import { PantallasModule } from '../pantallas/pantallas.module';
import { PermisosModule } from '../permisos/permisos.module';
import { RolesModule } from '../roles/roles.module';
import { UsuariosModule } from '../usuarios/usuarios.module';

@Module({
  controllers: [SeedController],
  providers: [SeedService, DesarrolloSeedService],
  imports: [PantallasModule, PermisosModule, RolesModule, UsuariosModule],
})
export class SeedModule {}
