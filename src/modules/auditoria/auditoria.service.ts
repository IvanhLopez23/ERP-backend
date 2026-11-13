import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Auditoria } from './entities/auditoria.entity';
import { Repository, ILike } from 'typeorm';
import { PaginacionDto } from '../../common/dtos/paginacion.dto';
@Injectable()
export class AuditoriaService {
  constructor(
    @InjectRepository(Auditoria)
    private readonly auditoriaRepository: Repository<Auditoria>,
  ) {}
  async paginadoAcciones(paginacionDto: PaginacionDto) {
    const pagina = Number(paginacionDto.pagina) || 1;
    const registros = Number(paginacionDto.registros) || 10;
    const where: any = {};
    if (paginacionDto.buscar) {
      where.endpoint = ILike(`%${paginacionDto.buscar}%`);
    }

    const [data, total] = await this.auditoriaRepository.findAndCount({
      take: registros,
      skip: (pagina - 1) * registros,
      where,
      relations: { usuario: true },
      order: { id: 'DESC' },
    });
    return { total, data };
  }
}
