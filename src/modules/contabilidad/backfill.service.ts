import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Not, Repository } from 'typeorm';
import { Venta } from '../ventas/entities/venta.entity';
import { Compra } from '../compras/entities/compra.entity';
import { CuentaPorCobrar } from './entities/cuenta-por-cobrar.entity';
import { CuentaPorPagar } from './entities/cuenta-por-pagar.entity';
import { PeriodoContable } from './entities/periodo-contable.entity';
import { CxcService } from './cxc.service';
import { CxpService } from './cxp.service';
import { PeriodosService } from './periodos.service';
import { BackfillDto } from './dto/backfill.dto';

@Injectable()
export class BackfillService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(CuentaPorCobrar)
    private readonly cxcRepository: Repository<CuentaPorCobrar>,
    @InjectRepository(CuentaPorPagar)
    private readonly cxpRepository: Repository<CuentaPorPagar>,
    @InjectRepository(PeriodoContable)
    private readonly periodoRepository: Repository<PeriodoContable>,
    private readonly cxcService: CxcService,
    private readonly cxpService: CxpService,
    private readonly periodosService: PeriodosService,
  ) {}

  async ejecutar(dto: BackfillDto) {
    const crearPeriodos = dto.crearPeriodos ?? true;
    const ventas = await this.dataSource
      .getRepository(Venta)
      .find({ order: { id: 'ASC' } });
    const compras = await this.dataSource
      .getRepository(Compra)
      .find({ order: { id: 'ASC' } });

    const cxcExistentes = await this.cxcRepository.find({
      where: { ventaId: Not(IsNull()) },
      select: { ventaId: true },
    });
    const cxpExistentes = await this.cxpRepository.find({
      where: { compraId: Not(IsNull()) },
      select: { compraId: true },
    });

    const ventasConCxc = new Set(cxcExistentes.map((cuenta) => cuenta.ventaId));
    const comprasConCxp = new Set(
      cxpExistentes.map((cuenta) => cuenta.compraId),
    );

    const resumen = {
      ventas: { procesadas: 0, omitidas: 0, errores: 0 },
      compras: { procesadas: 0, omitidas: 0, errores: 0 },
      periodosCreados: 0,
    };
    const periodosProcesados = new Set<string>();

    for (const venta of ventas) {
      if (ventasConCxc.has(venta.id)) {
        resumen.ventas.omitidas += 1;
        continue;
      }
      try {
        if (crearPeriodos) {
          await this.asegurarPeriodo(
            venta.fechaVenta,
            periodosProcesados,
            resumen,
          );
        }
        await this.cxcService.crearDesdeVenta(venta, venta.usuarioId);
        resumen.ventas.procesadas += 1;
      } catch (error) {
        resumen.ventas.errores += 1;
        console.error(`No se pudo backfillear la venta ${venta.id}`, error);
      }
    }

    for (const compra of compras) {
      if (comprasConCxp.has(compra.id)) {
        resumen.compras.omitidas += 1;
        continue;
      }
      try {
        if (crearPeriodos) {
          await this.asegurarPeriodo(
            compra.fechaCompra,
            periodosProcesados,
            resumen,
          );
        }
        await this.cxpService.crearDesdeCompra(compra, compra.usuarioId);
        resumen.compras.procesadas += 1;
      } catch (error) {
        resumen.compras.errores += 1;
        console.error(`No se pudo backfillear la compra ${compra.id}`, error);
      }
    }

    return resumen;
  }

  private async asegurarPeriodo(
    fecha: Date | string,
    procesados: Set<string>,
    resumen: { periodosCreados: number },
  ) {
    const fechaTexto = this.fechaString(fecha);
    const anio = Number(fechaTexto.slice(0, 4));
    const mes = Number(fechaTexto.slice(5, 7));
    const llave = `${anio}-${mes}`;

    if (procesados.has(llave)) return;
    procesados.add(llave);

    const existe = await this.periodoRepository.findOne({
      where: { anio, mes },
    });
    if (existe) return;

    const ultimoDia = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
    await this.periodosService.crear({
      anio,
      mes,
      fechaInicio: `${anio}-${String(mes).padStart(2, '0')}-01`,
      fechaFin: `${anio}-${String(mes).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`,
    });
    resumen.periodosCreados += 1;
  }

  private fechaString(fecha: Date | string) {
    if (typeof fecha === 'string') return fecha.slice(0, 10);
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }
}
