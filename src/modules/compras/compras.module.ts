import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlmacenModule } from '../almacen/almacen.module';
import { ContabilidadModule } from '../contabilidad/contabilidad.module';
import { ComprasService } from './compras.service';
import { ProveedoresController } from './proveedores.controller';
import { ComprasController } from './compras.controller';
import { Proveedor } from './entities/proveedor.entity';
import { Compra } from './entities/compra.entity';
import { DetalleCompra } from './entities/detalle-compra.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Proveedor, Compra, DetalleCompra]),
    AlmacenModule,
    ContabilidadModule,
  ],
  controllers: [ProveedoresController, ComprasController],
  providers: [ComprasService],
})
export class ComprasModule {}
