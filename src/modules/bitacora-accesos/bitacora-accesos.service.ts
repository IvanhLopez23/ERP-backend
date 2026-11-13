import { Injectable } from '@nestjs/common';
import { CreateBitacoraAccesoDto } from './dto/create-bitacora-acceso.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { BitacoraAcceso } from './entities/bitacora-acceso.entity';
import { Repository, ILike } from 'typeorm';
import { PaginacionDto } from '../../common/dtos/paginacion.dto';
@Injectable()
export class BitacoraAccesosService {
  constructor(
    @InjectRepository(BitacoraAcceso)
    private readonly bitacoraAccesoRepository: Repository<BitacoraAcceso>,
  ) {}

  async crear(createBitacoraAccesoDto: CreateBitacoraAccesoDto) {
    try {
      return await this.bitacoraAccesoRepository.save(createBitacoraAccesoDto);
    } catch (error) {
      throw error;
    }
  }

  async buscar() {
    try {
      const bitacoraAccesos = await this.bitacoraAccesoRepository.find({
        order: {
          id: 'DESC',
        },
        relations: { usuario: true },
      });
      return bitacoraAccesos;
    } catch (error) {
      throw error;
    }
  }

  async paginado(paginacionDto: PaginacionDto) {
    try {
      const pagina = Number(paginacionDto.pagina) || 1;
      const registros = Number(paginacionDto.registros) || 10;
      const { buscar } = paginacionDto;
      let where: any = {};

      if (buscar) {
        where = [{ descripcion: ILike(`%${buscar}%`) }];
      }

      const data = await this.bitacoraAccesoRepository.find({
        take: registros,
        skip: (pagina - 1) * registros,
        where,
        order: {
          id: 'DESC',
        },
        relations: { usuario: true },
      });

      const total = await this.bitacoraAccesoRepository.count({ where });
      return { total, data };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async buscarPorUsuario(usuarioPublicId: string) {
    try {
      return await this.bitacoraAccesoRepository.find({
        where: {
          usuario: {
            publicId: usuarioPublicId,
          },
        },
        order: {
          id: 'DESC',
        },
        relations: { usuario: true },
      });
    } catch (error) {
      throw error;
    }
  }
}
