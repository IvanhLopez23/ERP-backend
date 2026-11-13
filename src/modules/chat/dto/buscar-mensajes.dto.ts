import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaginacionDto } from 'src/common/dtos/paginacion.dto';
import { IsPublicId } from 'src/common/validation/public-id';

export class BuscarMensajesDto extends PaginacionDto {
  @ApiProperty({ description: 'publicId de la conversación' })
  @IsPublicId()
  @IsString()
  conversacionId: string;
}
