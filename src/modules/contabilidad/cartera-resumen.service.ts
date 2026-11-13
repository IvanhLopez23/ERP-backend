import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CuentaPorCobrar } from './entities/cuenta-por-cobrar.entity';
import { CuentaPorPagar } from './entities/cuenta-por-pagar.entity';

@Injectable()
export class CarteraResumenService {
  constructor(
    @InjectRepository(CuentaPorCobrar)
    private readonly cxcRepository: Repository<CuentaPorCobrar>,
    @InjectRepository(CuentaPorPagar)
    private readonly cxpRepository: Repository<CuentaPorPagar>,
  ) {}

  async resumen() {
    const [cxc, cxp] = await Promise.all([
      this.cxcRepository.find({
        where: { estatus: In(['pendiente', 'parcial']) },
      }),
      this.cxpRepository.find({
        where: { estatus: In(['pendiente', 'parcial']) },
      }),
    ]);

    const hoy = this.hoy();
    return {
      cxc: this.calcular(cxc, hoy),
      cxp: this.calcular(cxp, hoy),
    };
  }

  async aging(fechaCorte?: string) {
    const corte = fechaCorte ?? this.hoy();
    const [cxc, cxp] = await Promise.all([
      this.cxcRepository.find({
        where: { estatus: In(['pendiente', 'parcial']) },
      }),
      this.cxpRepository.find({
        where: { estatus: In(['pendiente', 'parcial']) },
      }),
    ]);

    return {
      fechaCorte: corte,
      cxc: this.calcularAging(cxc, corte),
      cxp: this.calcularAging(cxp, corte),
    };
  }

  private calcularAging(
    cuentas: Array<{ saldo: number | string; fechaVencimiento: string }>,
    corte: string,
  ) {
    const rangos = ['corriente', '1-30', '31-60', '61-90', '>90'];
    const buckets = new Map(
      rangos.map((rango) => [rango, { rango, monto: 0, registros: 0 }]),
    );
    let total = 0;

    for (const cuenta of cuentas) {
      const saldo = Number(cuenta.saldo) || 0;
      if (saldo <= 0) continue;
      total += saldo;

      const dias = this.diferenciaDias(
        this.fechaString(cuenta.fechaVencimiento),
        corte,
      );
      const rango =
        dias <= 0
          ? 'corriente'
          : dias <= 30
            ? '1-30'
            : dias <= 60
              ? '31-60'
              : dias <= 90
                ? '61-90'
                : '>90';
      const bucket = buckets.get(rango);
      if (!bucket) continue;
      bucket.monto += saldo;
      bucket.registros += 1;
    }

    return {
      total: this.redondear2(total),
      buckets: rangos.map((rango) => {
        const bucket = buckets.get(rango);
        return {
          rango,
          monto: this.redondear2(bucket?.monto ?? 0),
          registros: bucket?.registros ?? 0,
        };
      }),
    };
  }

  private diferenciaDias(desde: string, hasta: string) {
    const inicio = new Date(`${desde}T00:00:00.000Z`).getTime();
    const fin = new Date(`${hasta}T00:00:00.000Z`).getTime();
    return Math.floor((fin - inicio) / 86400000);
  }

  private fechaString(fecha: Date | string) {
    if (typeof fecha === 'string') return fecha.slice(0, 10);
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  private calcular(
    cuentas: Array<{ saldo: number | string; fechaVencimiento: string }>,
    hoy: string,
  ) {
    let total = 0;
    let vencido = 0;
    for (const cuenta of cuentas) {
      const saldo = Number(cuenta.saldo) || 0;
      total += saldo;
      if (cuenta.fechaVencimiento < hoy) vencido += saldo;
    }
    return {
      total: this.redondear2(total),
      vencido: this.redondear2(vencido),
      registros: cuentas.length,
    };
  }

  private hoy() {
    const ahora = new Date();
    const anio = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const dia = String(ahora.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  private redondear2(valor: number) {
    return Math.round(valor * 100) / 100;
  }
}
