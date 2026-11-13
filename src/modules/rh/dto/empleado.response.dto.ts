import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DepartamentoResponseDto } from './departamento.response.dto';
import { PuestoResponseDto } from './puesto.response.dto';
import { TurnoResponseDto } from './turno.response.dto';
import { ContratoResponseDto } from './contrato.response.dto';
import { UsuarioResponseDto } from '../../usuarios/dto/usuario.response.dto';

export class EmpleadoResponseDto {
  @ApiProperty({ format: 'uuid' })
  publicId: string;

  @ApiProperty({ example: 'EMP-001' })
  codigo: string;

  @ApiProperty({ example: 'Juan' })
  nombre: string;

  @ApiProperty({ example: 'Pérez' })
  apellidoPaterno: string;

  @ApiPropertyOptional({ example: 'López' })
  apellidoMaterno?: string;

  @ApiPropertyOptional({ example: 'M' })
  genero?: string;

  @ApiPropertyOptional({ example: '1990-01-01T00:00:00.000Z' })
  fechaNacimiento?: Date;

  @ApiPropertyOptional({ example: 'PEMJ900101HDF' })
  rfc?: string;

  @ApiPropertyOptional({ example: 'PEMJ900101HDFLPN09' })
  curp?: string;

  @ApiPropertyOptional({ example: '12345678901' })
  nss?: string;

  @ApiPropertyOptional({ example: '5512345678' })
  telefono?: string;

  @ApiPropertyOptional({ example: 'juan.perez@empresa.com' })
  correo?: string;

  @ApiPropertyOptional({ example: 'Calle Falsa 123' })
  direccion?: string;

  @ApiPropertyOptional({ example: 'foto.png' })
  foto?: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  fechaIngreso: Date;

  @ApiPropertyOptional({ example: '2024-12-31T00:00:00.000Z' })
  fechaSalida?: Date;

  @ApiProperty({ example: 25000 })
  salario: number;

  @ApiProperty({ example: true })
  activo: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  fechaCreacion: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  fechaActualizacion: Date;

  @ApiPropertyOptional({ type: () => DepartamentoResponseDto })
  departamento?: DepartamentoResponseDto;

  @ApiPropertyOptional({ type: () => PuestoResponseDto })
  puesto?: PuestoResponseDto;

  @ApiPropertyOptional({ type: () => TurnoResponseDto })
  turno?: TurnoResponseDto;

  @ApiPropertyOptional({ type: () => UsuarioResponseDto })
  usuario?: UsuarioResponseDto;

  @ApiPropertyOptional({ type: () => ContratoResponseDto, isArray: true })
  contratos?: ContratoResponseDto[];
}
