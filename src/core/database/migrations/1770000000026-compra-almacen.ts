import { MigrationInterface, QueryRunner } from 'typeorm';

export class CompraAlmacen1770000000026 implements MigrationInterface {
  name = 'CompraAlmacen1770000000026';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "compras"
      ADD COLUMN IF NOT EXISTS "almacen_id" integer
    `);

    await queryRunner.query(`
      UPDATE "compras"
         SET "almacen_id" = (
           SELECT "id" FROM "almacenes" ORDER BY "id" LIMIT 1
         )
       WHERE "almacen_id" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "compras"
      ADD CONSTRAINT "FK_compras_almacen"
      FOREIGN KEY ("almacen_id") REFERENCES "almacenes"("id")
      ON DELETE SET NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_compras_almacen"
        ON "compras" ("almacen_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "compras" DROP CONSTRAINT IF EXISTS "FK_compras_almacen"',
    );
    await queryRunner.query(
      'ALTER TABLE "compras" DROP COLUMN IF EXISTS "almacen_id"',
    );
  }
}
