import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsPublicId } from '../../../common/validation/public-id';

export class AgregarParticipanteDto {
  @ApiProperty({
    description: 'publicId del usuario a agregar',
    example: '01a0da84-b398-7398-92f2-c0921f026ef2',
  })
  @IsPublicId()
  @IsNotEmpty()
  usuarioId: string;
}
