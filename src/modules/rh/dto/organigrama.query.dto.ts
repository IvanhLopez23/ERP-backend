import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsPublicId } from '../../../common/validation/public-id';

const aArreglo = ({ value }: { value: unknown }): string[] | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  const lista = Array.isArray(value) ? value : [value];
  return lista.flatMap((item) =>
    typeof item === 'string' && item.includes(',')
      ? item
          .split(',')
          .map((parte) => parte.trim())
          .filter((parte) => parte.length > 0)
      : [item],
  );
};

const aBooleano = ({ value }: { value: unknown }): boolean | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const texto = value.trim().toLowerCase();
    if (['true', '1', 'si', 'sí'].includes(texto)) return true;
    if (['false', '0', 'no'].includes(texto)) return false;
  }
  return undefined;
};

export class OrganigramaQueryDto {
  @ApiPropertyOptional({
    description:
      'publicId del departamento (repetible o separado por coma para varios)',
    example: '01a0b13f-fe3f-7797-bb8e-1265f4409c78',
    type: [String],
  })
  @Transform(aArreglo)
  @IsOptional()
  @IsPublicId({ each: true })
  departamentoId?: string[];

  @ApiPropertyOptional({
    description: 'publicId del puesto',
    example: '01a0b13f-fe44-7df7-bc75-39b1185a7061',
  })
  @IsOptional()
  @IsPublicId()
  puestoId?: string;

  @ApiPropertyOptional({
    description: 'publicId del turno',
    example: '01a0caf8-9ca9-7ae1-9b29-9ab88730a738',
  })
  @IsOptional()
  @IsPublicId()
  turnoId?: string;

  @ApiPropertyOptional({
    description: 'Incluir empleados inactivos (por defecto solo activos)',
    default: false,
  })
  @Transform(aBooleano)
  @IsOptional()
  @IsBoolean()
  incluirInactivos?: boolean;

  @ApiPropertyOptional({
    description: 'Texto para buscar por nombre, apellidos o código',
    example: 'Pérez',
  })
  @IsOptional()
  @IsString()
  buscar?: string;
}
