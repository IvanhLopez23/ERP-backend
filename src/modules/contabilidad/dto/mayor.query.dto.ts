import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ReporteContableQueryDto } from './reporte-contable.query.dto';
import { IsPublicId } from '../../../common/validation/public-id';

export class MayorQueryDto extends ReporteContableQueryDto {
  @ApiProperty({ description: 'publicId de la cuenta contable' })
  @IsPublicId()
  @IsNotEmpty()
  cuentaId: string;
}
