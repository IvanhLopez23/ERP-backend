import { PartialType } from '@nestjs/swagger';
import { CreatePeriodoContableDto } from './create-periodo-contable.dto';

export class UpdatePeriodoContableDto extends PartialType(
  CreatePeriodoContableDto,
) {}
