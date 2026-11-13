import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuariosModule } from 'src/modules/usuarios/usuarios.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from './guards/auth.guard';
import { BitacoraAccesosModule } from 'src/modules/bitacora-accesos/bitacora-accesos.module';
import { RefreshToken } from './entities/refresh-token.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { PermissionsGuard } from './guards/permissions.guard';
import { Usuarios } from 'src/modules/usuarios/entities/usuario.entity';
import { Pantalla } from 'src/modules/pantallas/entities/pantalla.entity';
import { Permiso } from 'src/modules/permisos/entities/permiso.entity';

@Global()
@Module({
  imports: [
    UsuariosModule,
    ConfigModule,
    BitacoraAccesosModule,
    TypeOrmModule.forFeature([RefreshToken, PasswordResetToken]),
    TypeOrmModule.forFeature([Usuarios, Pantalla, Permiso]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: (configService.get<string>('JWT_EXPIRES_IN') ||
            '12h') as any,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, PermissionsGuard],
  exports: [AuthService, AuthGuard, PermissionsGuard, JwtModule, TypeOrmModule],
})
export class AuthModule {}
