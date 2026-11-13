import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DashboardResponseDto, RangoDashboardDto } from './dto';
import {
  DashboardBaseService,
  redondear1,
  redondear2,
} from './helpers/dashboard-base.service';

@Injectable()
export class DashboardRhService extends DashboardBaseService {
  constructor(private readonly dataSource: DataSource) {
    super();
  }

  async obtenerDashboardRh(
    query: RangoDashboardDto,
  ): Promise<DashboardResponseDto> {
    const r = this.resolverRango(query);
    const bAsis = this.bucketExpr('a.fecha', r.agrupacion);
    const bIng = this.bucketExpr('e.fecha_ingreso', r.agrupacion);
    const bSal = this.bucketExpr('e.fecha_salida', r.agrupacion);
    const mes = this.mesActual();

    const plantilla = await this.dataSource.query(
      `SELECT d.nombre AS nombre, COUNT(e.id) AS valor
       FROM empleados e
       JOIN departamentos d ON d.id = e.departamento_id
       WHERE e.activo = true
       GROUP BY 1 ORDER BY 2 DESC`,
    );

    const asistencia = await this.dataSource.query(
      `SELECT ${bAsis} AS bucket, a.estatus AS estatus, COUNT(*) AS valor
       FROM asistencias a
       WHERE a.fecha BETWEEN $1 AND $2
       GROUP BY 1, 2`,
      [r.desde, r.hasta],
    );

    const altas = await this.dataSource.query(
      `SELECT ${bIng} AS bucket, COUNT(*) AS valor
       FROM empleados e
       WHERE e.fecha_ingreso BETWEEN $1 AND $2
       GROUP BY 1 ORDER BY 1`,
      [r.desde, r.hasta],
    );
    const bajas = await this.dataSource.query(
      `SELECT ${bSal} AS bucket, COUNT(*) AS valor
       FROM empleados e
       WHERE e.fecha_salida IS NOT NULL AND e.fecha_salida BETWEEN $1 AND $2
       GROUP BY 1 ORDER BY 1`,
      [r.desde, r.hasta],
    );

    const nomina = await this.dataSource.query(
      `SELECT d.nombre AS nombre, COALESCE(SUM(e.salario), 0) AS valor
       FROM empleados e
       JOIN departamentos d ON d.id = e.departamento_id
       WHERE e.activo = true
       GROUP BY 1 ORDER BY 2 DESC`,
    );

    const solicitudes = await this.dataSource.query(
      `SELECT s.tipo AS tipo, s.estatus AS estatus, COUNT(*) AS valor
       FROM solicitudes_permiso s
       WHERE s.fecha_inicio BETWEEN $1 AND $2
       GROUP BY 1, 2 ORDER BY 1`,
      [r.desde, r.hasta],
    );

    const [vac] = await this.dataSource.query(
      `SELECT COALESCE(SUM(dias_otorgados), 0) AS otorgados,
              COALESCE(SUM(dias_usados), 0) AS usados
       FROM periodos_vacacionales WHERE activo = true`,
    );
    const disponibles = Number(vac.otorgados) - Number(vac.usados);

    const [kpiTotal] = await this.dataSource.query(
      `SELECT COUNT(*) AS n FROM empleados WHERE activo = true`,
    );
    const [kpiAus] = await this.dataSource.query(
      `SELECT COUNT(*) FILTER (WHERE estatus = 'ausente') AS ausentes,
              COUNT(*) AS total
       FROM asistencias WHERE fecha BETWEEN $1 AND $2`,
      [mes.desde, mes.hasta],
    );
    const [kpiBajas] = await this.dataSource.query(
      `SELECT COUNT(*) AS n FROM empleados
       WHERE fecha_salida IS NOT NULL AND fecha_salida BETWEEN $1 AND $2`,
      [r.desde, r.hasta],
    );
    const [kpiAnt] = await this.dataSource.query(
      `SELECT COALESCE(AVG(EXTRACT(YEAR FROM AGE(CURRENT_DATE, fecha_ingreso))), 0) AS promedio
       FROM empleados WHERE activo = true`,
    );
    const [kpiNomina] = await this.dataSource.query(
      `SELECT COALESCE(SUM(salario), 0) AS suma
       FROM empleados WHERE activo = true`,
    );

    const ausentismo =
      Number(kpiAus.total) > 0
        ? redondear1((Number(kpiAus.ausentes) / Number(kpiAus.total)) * 100)
        : 0;
    const rotacion =
      Number(kpiTotal.n) + Number(kpiBajas.n) > 0
        ? redondear1(
            (Number(kpiBajas.n) / (Number(kpiTotal.n) + Number(kpiBajas.n))) *
              100,
          )
        : 0;

    const estadosAsis = ['presente', 'ausente', 'permiso', 'vacaciones'];
    const tiposSol: string[] = [
      ...new Set(solicitudes.map((x: { tipo: string }) => x.tipo) as string[]),
    ];
    const seriesSol = ['pendiente', 'aprobada', 'rechazada'].map((estatus) => ({
      nombre: estatus,
      datos: tiposSol.map((tipo) => {
        const fila = solicitudes.find(
          (x: { tipo: string; estatus: string }) =>
            x.tipo === tipo && x.estatus === estatus,
        );
        return fila ? Number(fila.valor) : 0;
      }),
    }));

    return {
      kpis: [
        this.kpi('totalEmpleados', 'Empleados activos', Number(kpiTotal.n)),
        this.kpi('ausentismoMes', 'Ausentismo del mes', ausentismo, '%'),
        this.kpi('rotacion', 'Rotación del período', rotacion, '%'),
        this.kpi(
          'antiguedadPromedio',
          'Antigüedad promedio',
          redondear1(kpiAnt.promedio),
          'años',
        ),
        this.kpi(
          'nominaTotal',
          'Nómina total (activos)',
          redondear2(kpiNomina.suma),
          'MXN',
        ),
      ],
      graficas: {
        plantillaPorDepartamento: this.grafica(
          'barras',
          plantilla.map((x: { nombre: string }) => x.nombre),
          [
            {
              nombre: 'Empleados',
              datos: plantilla.map((x: { valor: unknown }) => Number(x.valor)),
            },
          ],
        ),
        asistencia: this.grafica(
          'barras-apiladas',
          r.buckets.map((x) => x.label),
          this.pivot(r.buckets, asistencia, estadosAsis),
        ),
        altasVsBajas: this.grafica(
          'linea',
          r.buckets.map((x) => x.label),
          [
            { nombre: 'Altas', datos: this.serieEnBuckets(r.buckets, altas) },
            { nombre: 'Bajas', datos: this.serieEnBuckets(r.buckets, bajas) },
          ],
        ),
        nominaPorDepartamento: this.grafica(
          'barras',
          nomina.map((x: { nombre: string }) => x.nombre),
          [
            {
              nombre: 'Nómina',
              datos: nomina.map((x: { valor: unknown }) => redondear2(x.valor)),
            },
          ],
        ),
        solicitudesPorTipo: this.grafica(
          'barras-apiladas',
          tiposSol,
          seriesSol,
        ),
        vacaciones: this.grafica(
          'dona',
          ['Usados', 'Disponibles'],
          [
            {
              nombre: 'Días',
              datos: [Number(vac.usados), disponibles],
            },
          ],
        ),
      },
    };
  }
}
