import { PartialType } from '@nestjs/swagger';
import { CreateCuentaContableDto } from './create-cuenta-contable.dto';

export class UpdateCuentaContableDto extends PartialType(
  CreateCuentaContableDto,
) {}
