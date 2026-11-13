import { MigrationInterface, QueryRunner } from 'typeorm';

export class PeriodoVacacionalDescripcion1770000000022
  implements MigrationInterface
{
  name = 'PeriodoVacacionalDescripcion1770000000022';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "periodos_vacacionales"
      ADD COLUMN IF NOT EXISTS "descripcion" varchar(150)
    `);
    await queryRunner.query(`
      UPDATE "periodos_vacacionales"
         SET "descripcion" =
             'Periodo vacacional ' ||
             EXTRACT(YEAR FROM "fecha_inicio")::int || '-' ||
             EXTRACT(YEAR FROM "fecha_fin")::int
       WHERE "descripcion" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "periodos_vacacionales"
      DROP COLUMN IF EXISTS "descripcion"
    `);
  }
}
