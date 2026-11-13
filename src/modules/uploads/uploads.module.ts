import { forwardRef, Module } from '@nestjs/common';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';

@Module({
  imports: [forwardRef(() => UsuariosModule)],
  controllers: [UploadsController],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}
