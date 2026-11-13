import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Conversacion } from './entities/conversacion.entity';
import { ConversacionParticipante } from './entities/conversacion-participante.entity';
import { Mensaje } from './entities/mensaje.entity';
import { Usuarios } from '../usuarios/entities/usuario.entity';
import { CrearConversacionDto } from './dto/crear-conversacion.dto';
import { PaginacionDto } from 'src/common/dtos/paginacion.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversacion)
    private readonly conversacionRepository: Repository<Conversacion>,
    @InjectRepository(ConversacionParticipante)
    private readonly participanteRepository: Repository<ConversacionParticipante>,
    @InjectRepository(Mensaje)
    private readonly mensajeRepository: Repository<Mensaje>,
    private readonly dataSource: DataSource,
  ) {}

  async obtenerConversaciones(usuarioId: number) {
    const participaciones = await this.participanteRepository.find({
      where: { usuarioId },
      relations: {
        conversacion: {
          participantes: {
            usuario: {
              perfil: true,
            },
          },
          mensajes: {
            usuario: {
              perfil: true,
            },
          },
        },
      },
      order: {
        conversacion: {
          mensajes: { fechaCreacion: 'DESC' },
        },
      },
    });

    return participaciones.map((p) => {
      const conv = p.conversacion;
      const mensajes = conv.mensajes || [];
      const ultimoMensaje = mensajes.length > 0 ? mensajes[0] : null;
      const noLeidos = mensajes.filter(
        (m) =>
          !p.ultimaLectura ||
          new Date(m.fechaCreacion) > new Date(p.ultimaLectura),
      ).length;

      return {
        publicId: conv.publicId,
        esGrupo: conv.esGrupo,
        nombre: conv.nombre,
        ultimoMensaje,
        noLeidos,
        participantes: conv.participantes,
        fechaCreacion: conv.fechaCreacion,
      };
    });
  }

  async crearConversacion(usuarioId: number, dto: CrearConversacionDto) {
    const { participanteIds, esGrupo, nombre } = dto;

    if (esGrupo && !nombre) {
      throw new BadRequestException('El nombre es requerido para grupos');
    }

    const usuarios = await this.dataSource
      .getRepository(Usuarios)
      .find({ where: { publicId: In(participanteIds) } });
    if (usuarios.length !== new Set(participanteIds).size) {
      throw new BadRequestException('Uno o más participantes no existen');
    }
    const participanteInternalIds = usuarios.map((u) => u.id);

    const todosIds = [usuarioId, ...participanteInternalIds];
    const unicos = [...new Set(todosIds)];

    const conversacion = this.conversacionRepository.create({
      esGrupo: esGrupo || false,
      ...(esGrupo && nombre ? { nombre } : {}),
    });

    const saved = await this.conversacionRepository.save(conversacion);

    const participantes = unicos.map((id) =>
      this.participanteRepository.create({
        conversacionId: saved.id,
        usuarioId: id,
      }),
    );

    await this.participanteRepository.save(participantes);
    saved.participantes = participantes;

    return saved;
  }

  async obtenerMensajes(
    conversacionPublicId: string,
    usuarioId: number,
    paginacion: PaginacionDto,
  ) {
    const conversacionId =
      await this.resolverConversacion(conversacionPublicId);
    await this.validarParticipante(conversacionId, usuarioId);

    const { registros = 50, pagina = 1 } = paginacion;

    const [data, total] = await this.mensajeRepository.findAndCount({
      where: { conversacionId },
      relations: {
        usuario: {
          perfil: true,
        },
      },
      order: { fechaCreacion: 'DESC' },
      take: registros,
      skip: (pagina - 1) * registros,
    });

    return { total, data };
  }

  async resolverConversacion(publicId: string) {
    const conversacion = await this.conversacionRepository.findOne({
      where: { publicId },
    });
    if (!conversacion)
      throw new BadRequestException('La conversación no existe');
    return conversacion.id;
  }

  async resolverMensaje(publicId: string) {
    const mensaje = await this.mensajeRepository.findOne({
      where: { publicId },
    });
    if (!mensaje) throw new BadRequestException('El mensaje no existe');
    return mensaje.id;
  }

  async enviarMensaje(
    usuarioId: number,
    conversacionId: number,
    contenido: string,
  ) {
    await this.validarParticipante(conversacionId, usuarioId);

    const mensaje = this.mensajeRepository.create({
      conversacionId,
      usuarioId,
      contenido,
    });

    const saved = await this.mensajeRepository.save(mensaje);

    return this.mensajeRepository.findOne({
      where: { id: saved.id },
      relations: {
        usuario: {
          perfil: true,
        },
      },
    });
  }

  async marcarComoLeido(
    usuarioId: number,
    conversacionId: number,
    mensajeId: number,
  ) {
    const participacion = await this.participanteRepository.findOne({
      where: { conversacionId, usuarioId },
    });

    if (!participacion) {
      throw new ForbiddenException('No eres participante de esta conversación');
    }

    const mensaje = await this.mensajeRepository.findOne({
      where: { id: mensajeId, conversacionId },
    });

    if (!mensaje) {
      throw new BadRequestException('El mensaje no existe');
    }

    participacion.ultimaLectura = new Date();
    await this.participanteRepository.save(participacion);
  }

  async agregarParticipante(
    conversacionPublicId: string,
    usuarioPublicId: string,
  ) {
    const conversacionId =
      await this.resolverConversacion(conversacionPublicId);
    const usuario = await this.dataSource
      .getRepository(Usuarios)
      .findOne({ where: { publicId: usuarioPublicId } });
    if (!usuario)
      throw new BadRequestException(`El usuario ${usuarioPublicId} no existe`);

    const usuarioId = usuario.id;

    const existe = await this.participanteRepository.findOne({
      where: { conversacionId, usuarioId },
    });

    if (existe) {
      throw new BadRequestException('El usuario ya es participante');
    }

    const participante = this.participanteRepository.create({
      conversacionId,
      usuarioId,
    });

    return this.participanteRepository.save(participante);
  }

  async eliminarParticipante(
    conversacionPublicId: string,
    usuarioPublicId: string,
  ) {
    const conversacionId =
      await this.resolverConversacion(conversacionPublicId);
    const usuario = await this.dataSource
      .getRepository(Usuarios)
      .findOne({ where: { publicId: usuarioPublicId } });
    if (!usuario)
      throw new BadRequestException(`El usuario ${usuarioPublicId} no existe`);
    const usuarioId = usuario.id;

    const participante = await this.participanteRepository.findOne({
      where: { conversacionId, usuarioId },
    });

    if (!participante) {
      throw new BadRequestException('El usuario no es participante');
    }

    await this.participanteRepository.remove(participante);
  }

  async validarParticipante(conversacionId: number, usuarioId: number) {
    const participante = await this.participanteRepository.findOne({
      where: { conversacionId, usuarioId },
    });

    if (!participante) {
      throw new ForbiddenException('No eres participante de esta conversación');
    }

    return participante;
  }
}
