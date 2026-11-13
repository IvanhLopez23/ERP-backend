import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmpleadoResponseDto } from './empleado.response.dto';
import { PeriodoVacacionalResponseDto } from './periodo-vacacional.response.dto';
import { UsuarioResponseDto } from '../../usuarios/dto/usuario.response.dto';

export class SolicitudPermisoResponseDto {
  @ApiProperty({ format: 'uuid' })
  publicId: string;

  @ApiProperty({ example: 'vacaciones' })
  tipo: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  fechaInicio: Date;

  @ApiProperty({ example: '2024-01-05T00:00:00.000Z' })
  fechaFin: Date;

  @ApiProperty({ example: 'Motivo de la solicitud' })
  motivo: string;

  @ApiPropertyOptional({
    example: '/uploads/permisos/uuid.pdf',
    description: 'Comprobante médico o carta de vacaciones firmada',
  })
  comprobante?: string | null;

  @ApiProperty({ example: 'pendiente' })
  estatus: string;

  @ApiPropertyOptional({ example: 5 })
  diasSolicitados?: number;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  fechaCreacion: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  fechaActualizacion: Date;

  @ApiPropertyOptional({ type: () => EmpleadoResponseDto })
  empleado?: EmpleadoResponseDto;

  @ApiPropertyOptional({ type: () => UsuarioResponseDto })
  aprobador?: UsuarioResponseDto;

  @ApiPropertyOptional({ type: () => PeriodoVacacionalResponseDto })
  periodoVacacional?: PeriodoVacacionalResponseDto;
}
