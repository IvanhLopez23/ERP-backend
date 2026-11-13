import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsPublicId } from '../../../common/validation/public-id';

export class DeclararIvaDto {
  @ApiProperty({ example: 2026 })
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  anio: number;

  @ApiProperty({ example: 11, minimum: 1, maximum: 12 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  mes: number;

  @ApiPropertyOptional({
    example: '2026-12-17',
    description:
      'Fecha de declaración/pago. Default: fecha actual. La póliza se registra en el periodo de esta fecha.',
  })
  @IsDateString()
  @IsOptional()
  fecha?: string;

  @ApiPropertyOptional({
    description: 'publicId de la cuenta de pago (activo). Default: 1102 Bancos',
  })
  @IsPublicId()
  @IsOptional()
  cuentaPagoId?: string;
}
