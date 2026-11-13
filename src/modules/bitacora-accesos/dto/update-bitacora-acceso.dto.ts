import { PartialType } from '@nestjs/mapped-types';
import { CreateBitacoraAccesoDto } from './create-bitacora-acceso.dto';

export class UpdateBitacoraAccesoDto extends PartialType(
  CreateBitacoraAccesoDto,
) {}
