import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { RolesModule } from './modules/roles/roles.module';
import { CommonModule } from './common/common.module';
import { PantallasModule } from './modules/pantallas/pantallas.module';
import { PermisosModule } from './modules/permisos/permisos.module';
import { BitacoraAccesosModule } from './modules/bitacora-accesos/bitacora-accesos.module';
import { AuthModule } from './modules/auth/auth.module';
import { BrandingModule } from './modules/branding/branding.module';
import { SeedModule } from './modules/seed/seed.module';
import { ChatModule } from './modules/chat/chat.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { AlmacenModule } from './modules/almacen/almacen.module';
import { ComprasModule } from './modules/compras/compras.module';
import { RhModule } from './modules/rh/rh.module';
import { MantenimientoModule } from './modules/mantenimiento/mantenimiento.module';
import { VentasModule } from './modules/ventas/ventas.module';
import { ComedorModule } from './modules/comedor/comedor.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ReportesModule } from './modules/reportes/reportes.module';
import { SnakeNamingStrategy } from './core/database/snake-naming.strategy';
import { PublicIdInputMiddleware } from './common/middleware/public-id-input.middleware';
import { AuditoriaModule } from './modules/auditoria/auditoria.module';
import { ContabilidadModule } from './modules/contabilidad/contabilidad.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      namingStrategy: new SnakeNamingStrategy(),
      synchronize: false,
      migrations: ['dist/core/database/migrations/*.js'],
    }),
    DashboardModule,
    UsuariosModule,
    RolesModule,
    CommonModule,
    PantallasModule,
    PermisosModule,
    BitacoraAccesosModule,
    AuditoriaModule,
    AuthModule,
    BrandingModule,
    SeedModule,
    ChatModule,
    UploadsModule,
    AlmacenModule,
    ComprasModule,
    RhModule,
    ComedorModule,
    ReportesModule,
    MantenimientoModule,
    VentasModule,
    ContabilidadModule,
  ],
  providers: [PublicIdInputMiddleware],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(PublicIdInputMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
