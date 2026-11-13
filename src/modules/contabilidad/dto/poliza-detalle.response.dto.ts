import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CuentaContableResponseDto } from './cuenta-contable.response.dto';

export class PolizaDetalleResponseDto {
  @ApiProperty({ format: 'uuid' })
  publicId: string;

  @ApiPropertyOptional({ type: () => CuentaContableResponseDto })
  cuenta?: CuentaContableResponseDto;

  @ApiPropertyOptional({ example: 'Cargo a clientes' })
  concepto?: string;

  @ApiProperty({ example: 1000 })
  debe: number;

  @ApiProperty({ example: 0 })
  haber: number;

  @ApiPropertyOptional({ example: 'FAC-001' })
  referencia?: string;

  @ApiProperty({ example: 1 })
  orden: number;
}
