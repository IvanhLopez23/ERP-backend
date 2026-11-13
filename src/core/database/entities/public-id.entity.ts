import { Column } from 'typeorm';

/** Shared public identifier. Internal numeric primary keys remain on each entity. */
export abstract class PublicIdEntity {
  @Column({
    name: 'public_id',
    type: 'uuid',
    unique: true,
    nullable: false,
    default: () => 'uuidv7()',
  })
  publicId: string;
}
