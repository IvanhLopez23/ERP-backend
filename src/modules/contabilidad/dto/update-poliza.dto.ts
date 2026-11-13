import { PartialType } from '@nestjs/swagger';
import { CreatePolizaDto } from './create-poliza.dto';

export class UpdatePolizaDto extends PartialType(CreatePolizaDto) {}
