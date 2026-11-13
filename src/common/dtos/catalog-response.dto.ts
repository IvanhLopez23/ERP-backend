import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CatalogDto {
  @ApiProperty({
    example: '0199a000-0000-7000-8000-000000000001',
    format: 'uuid',
  })
  @Expose()
  publicId: string;

  @ApiProperty({ example: 'Name of the Catalog Item' })
  @Expose()
  name: string;
}
