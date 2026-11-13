import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Departamento } from './entities/departamento.entity';
import { Puesto } from './entities/puesto.entity';
import { Empleado } from './entities/empleado.entity';
import { Turno } from './entities/turno.entity';
import { OrganigramaQueryDto } from './dto/organigrama.query.dto';
import { AsignarJefeDto } from './dto/asignar-jefe.dto';
import { OrganigramaNodoDto } from './dto/organigrama.response.dto';

@Injectable()
export class OrganigramaService {
  constructor(
    @InjectRepository(Departamento)
    private readonly deptoRepository: Repository<Departamento>,
    @InjectRepository(Puesto)
    private readonly puestoRepository: Repository<Puesto>,
    @InjectRepository(Empleado)
    private readonly empleadoRepository: Repository<Empleado>,
    @InjectRepository(Turno)
    private readonly turnoRepository: Repository<Turno>,
  ) {}

  async obtenerOrganigrama(
    query: OrganigramaQueryDto,
  ): Promise<OrganigramaNodoDto[]> {
    let departamentoIds: number[] | undefined;
    if (query.departamentoId?.length) {
      const departamentos = await this.deptoRepository.find({
        where: { publicId: In(query.departamentoId) },
      });
      const encontrados = new Set(departamentos.map((d) => d.publicId));
      const faltante = query.departamentoId.find((p) => !encontrados.has(p));
      if (faltante)
        throw new BadRequestException(`El departamento ${faltante} no existe`);
      departamentoIds = departamentos.map((d) => d.id);
    }

    let puestoId: number | undefined;
    if (query.puestoId) {
      const puesto = await this.puestoRepository.findOne({
        where: { publicId: query.puestoId },
      });
      if (!puesto)
        throw new BadRequestException(`El puesto ${query.puestoId} no existe`);
      puestoId = puesto.id;
    }

    let turnoId: number | undefined;
    if (query.turnoId) {
      const turno = await this.turnoRepository.findOne({
        where: { publicId: query.turnoId },
      });
      if (!turno)
        throw new BadRequestException(`El turno ${query.turnoId} no existe`);
      turnoId = turno.id;
    }

    const qb = this.empleadoRepository
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.departamento', 'departamento')
      .leftJoinAndSelect('e.puesto', 'puesto')
      .leftJoinAndSelect('e.turno', 'turno');
    if (!query.incluirInactivos) {
      qb.andWhere('e.activo = :activo', { activo: true });
    }
    if (departamentoIds) {
      qb.andWhere('e.departamentoId IN (:...departamentoIds)', {
        departamentoIds,
      });
    }
    if (puestoId !== undefined) {
      qb.andWhere('e.puestoId = :puestoId', { puestoId });
    }
    if (turnoId !== undefined) {
      qb.andWhere('e.turnoId = :turnoId', { turnoId });
    }
    if (query.buscar) {
      const texto = `%${query.buscar}%`;
      qb.andWhere(
        '(e.nombre ILIKE :texto OR e.apellidoPaterno ILIKE :texto OR e.apellidoMaterno ILIKE :texto OR e.codigo ILIKE :texto)',
        { texto },
      );
    }
    qb.orderBy('e.nombre', 'ASC').addOrderBy('e.apellidoPaterno', 'ASC');
    const empleados = await qb.getMany();

    const nodos = new Map<number, OrganigramaNodoDto>();
    for (const emp of empleados) {
      nodos.set(emp.id, {
        publicId: emp.publicId,
        codigo: emp.codigo,
        nombre: emp.nombre,
        apellidoPaterno: emp.apellidoPaterno,
        apellidoMaterno: emp.apellidoMaterno ?? undefined,
        foto: emp.foto ?? undefined,
        activo: emp.activo,
        puesto: emp.puesto
          ? { publicId: emp.puesto.publicId, nombre: emp.puesto.nombre }
          : undefined,
        departamento: emp.departamento
          ? {
              publicId: emp.departamento.publicId,
              nombre: emp.departamento.nombre,
            }
          : undefined,
        turno: emp.turno
          ? { publicId: emp.turno.publicId, nombre: emp.turno.nombre }
          : undefined,
        numSubordinados: 0,
        subordinados: [],
      });
    }

    const raices: OrganigramaNodoDto[] = [];
    for (const emp of empleados) {
      const nodo = nodos.get(emp.id);
      if (!nodo) continue;
      const jefeNodo =
        emp.jefeId != null && emp.jefeId !== emp.id
          ? nodos.get(emp.jefeId)
          : undefined;
      if (jefeNodo) {
        jefeNodo.subordinados.push(nodo);
        nodo.jefePublicId = jefeNodo.publicId;
        nodo.jefeNombre = `${jefeNodo.nombre} ${jefeNodo.apellidoPaterno}`;
      } else {
        if (emp.jefeId != null) nodo.jefeFueraDelFiltro = true;
        raices.push(nodo);
      }
    }

    // Salvaguarda: nodos no alcanzables (ciclos heredados) se exponen como raíces
    const visitados = new Set<OrganigramaNodoDto>();
    const recorrer = (lista: OrganigramaNodoDto[]) => {
      for (const nodo of lista) {
        if (visitados.has(nodo)) continue;
        visitados.add(nodo);
        recorrer(nodo.subordinados);
      }
    };
    recorrer(raices);
    for (const nodo of nodos.values()) {
      if (!visitados.has(nodo)) {
        nodo.jefeFueraDelFiltro = true;
        raices.push(nodo);
      }
    }

    const ordenar = (lista: OrganigramaNodoDto[]) => {
      lista.sort(
        (a, b) =>
          a.nombre.localeCompare(b.nombre, 'es') ||
          a.apellidoPaterno.localeCompare(b.apellidoPaterno, 'es'),
      );
      for (const nodo of lista) {
        nodo.numSubordinados = nodo.subordinados.length;
        ordenar(nodo.subordinados);
      }
    };
    ordenar(raices);
    return raices;
  }

  async asignarJefe(publicId: string, dto: AsignarJefeDto) {
    const empleado = await this.empleadoRepository.findOne({
      where: { publicId },
    });
    if (!empleado)
      throw new BadRequestException(`El empleado ${publicId} no existe`);

    if (dto.jefeId === undefined || dto.jefeId === null) {
      await this.empleadoRepository.update(empleado.id, {
        jefeId: null as unknown as number,
      });
      return { msg: 'Jefe eliminado correctamente' };
    }

    const jefe = await this.empleadoRepository.findOne({
      where: { publicId: dto.jefeId },
    });
    if (!jefe)
      throw new BadRequestException(`El empleado jefe ${dto.jefeId} no existe`);
    if (jefe.id === empleado.id)
      throw new BadRequestException('Un empleado no puede ser su propio jefe');

    let superiorId: number | null = jefe.jefeId ?? null;
    const visitados = new Set<number>([empleado.id, jefe.id]);
    while (superiorId !== null) {
      if (superiorId === empleado.id)
        throw new BadRequestException(
          'La asignación genera un ciclo en el organigrama',
        );
      if (visitados.has(superiorId)) break;
      visitados.add(superiorId);
      const superior = await this.empleadoRepository.findOne({
        where: { id: superiorId },
        select: { id: true, jefeId: true },
      });
      superiorId = superior?.jefeId ?? null;
    }

    await this.empleadoRepository.update(empleado.id, { jefeId: jefe.id });
    return {
      msg: `Jefe asignado correctamente a ${empleado.nombre} ${empleado.apellidoPaterno}`,
    };
  }
}
