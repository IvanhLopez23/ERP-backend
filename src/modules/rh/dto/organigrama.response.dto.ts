import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OrganigramaReferenciaDto {
  @ApiProperty({ format: 'uuid' })
  publicId: string;

  @ApiProperty({ example: 'Ventas' })
  nombre: string;
}

export class OrganigramaNodoDto {
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

  @ApiPropertyOptional({ example: 'foto.png' })
  foto?: string;

  @ApiProperty({ example: true })
  activo: boolean;

  @ApiPropertyOptional({ type: () => OrganigramaReferenciaDto })
  puesto?: OrganigramaReferenciaDto;

  @ApiPropertyOptional({ type: () => OrganigramaReferenciaDto })
  departamento?: OrganigramaReferenciaDto;

  @ApiPropertyOptional({ type: () => OrganigramaReferenciaDto })
  turno?: OrganigramaReferenciaDto;

  @ApiPropertyOptional({
    description: 'publicId del jefe directo (si está dentro del resultado)',
    format: 'uuid',
  })
  jefePublicId?: string;

  @ApiPropertyOptional({
    description: 'Nombre del jefe directo (si está dentro del resultado)',
    example: 'María García',
  })
  jefeNombre?: string;

  @ApiPropertyOptional({
    description:
      'El jefe directo existe pero quedó fuera de los filtros aplicados',
    example: false,
  })
  jefeFueraDelFiltro?: boolean;

  @ApiProperty({
    description: 'Número de subordinados directos en el resultado',
    example: 3,
  })
  numSubordinados: number;

  @ApiProperty({
    description: 'Subordinados directos (árbol anidado)',
    type: () => [OrganigramaNodoDto],
  })
  subordinados: OrganigramaNodoDto[];
}
