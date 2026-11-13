import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class CatalogRequestDto {
  @ApiPropertyOptional({
    description:
      'Filtra por estado activo. Omite para traer todos (null). true = solo activos, false = solo inactivos.',
    enum: [true, false],
    nullable: true,
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return null;
  })
  @IsBoolean()
  isActive?: boolean | null;

  @ApiPropertyOptional({
    description:
      'Siempre incluye el registro con este publicId, aunque no cumpla el filtro isActive.',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('all')
  includePublicId?: string;
}
