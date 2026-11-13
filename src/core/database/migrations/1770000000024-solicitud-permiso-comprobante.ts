import { MigrationInterface, QueryRunner } from 'typeorm';

export class SolicitudPermisoComprobante1770000000024
  implements MigrationInterface
{
  name = 'SolicitudPermisoComprobante1770000000024';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "solicitudes_permiso"
      ADD COLUMN IF NOT EXISTS "comprobante" varchar(255)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "solicitudes_permiso"
      DROP COLUMN IF EXISTS "comprobante"
    `);
  }
}
