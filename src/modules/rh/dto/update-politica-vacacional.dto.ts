import { PartialType } from '@nestjs/swagger';
import { CreatePoliticaVacacionalDto } from './create-politica-vacacional.dto';

export class UpdatePoliticaVacacionalDto extends PartialType(
  CreatePoliticaVacacionalDto,
) {}
