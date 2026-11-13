import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsPublicId } from '../../../common/validation/public-id';

export class ConciliarMovimientoDto {
  @ApiProperty({
    description: 'publicId del detalle de póliza contra el que se concilia',
  })
  @IsPublicId()
  @IsNotEmpty()
  polizaDetalleId: string;
}
