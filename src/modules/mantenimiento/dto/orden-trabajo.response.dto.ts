import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EquipoResponseDto } from './equipo.response.dto';
import { PlanMantenimientoResponseDto } from './plan-mantenimiento.response.dto';
import { DetalleOrdenTrabajoResponseDto } from './detalle-orden-trabajo.response.dto';
import { UsuarioResponseDto } from '../../usuarios/dto/usuario.response.dto';
import { EmpleadoResponseDto } from '../../rh/dto/empleado.response.dto';

export class OrdenTrabajoResponseDto {
  @ApiProperty({ format: 'uuid' })
  publicId: string;

  @ApiProperty({ example: 'OT-20240101-0001' })
  folio: string;

  @ApiProperty({ example: 'Mantenimiento preventivo de equipo' })
  descripcion: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  fechaProgramada: Date;

  @ApiPropertyOptional({ example: '2024-01-02T00:00:00.000Z' })
  fechaEjecucion?: Date;

  @ApiProperty({ example: 'pendiente' })
  estatus: string;

  @ApiPropertyOptional({ example: 150.75 })
  costo?: number;

  @ApiPropertyOptional({ example: 'Trabajo programado' })
  observaciones?: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  fechaCreacion: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  fechaActualizacion: Date;

  @ApiPropertyOptional({ type: () => EquipoResponseDto })
  equipo?: EquipoResponseDto;

  @ApiPropertyOptional({ type: () => PlanMantenimientoResponseDto })
  planMantenimiento?: PlanMantenimientoResponseDto;

  @ApiPropertyOptional({ type: () => UsuarioResponseDto })
  solicitante?: UsuarioResponseDto;

  @ApiPropertyOptional({ type: () => EmpleadoResponseDto })
  atendido?: EmpleadoResponseDto;

  @ApiPropertyOptional({
    type: () => DetalleOrdenTrabajoResponseDto,
    isArray: true,
  })
  detalles?: DetalleOrdenTrabajoResponseDto[];
}
