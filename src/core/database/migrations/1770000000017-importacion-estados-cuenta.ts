import { MigrationInterface, QueryRunner } from 'typeorm';

export class ImportacionEstadosCuenta1770000000017 implements MigrationInterface {
  name = 'ImportacionEstadosCuenta1770000000017';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "movimientos_bancarios"
      ADD COLUMN IF NOT EXISTS "hash_importacion" varchar(64)
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_movimientos_bancarios_cuenta_hash"
      ON "movimientos_bancarios" ("cuenta_bancaria_id", "hash_importacion")
      WHERE "hash_importacion" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_movimientos_bancarios_cuenta_hash"`,
    );
    await queryRunner.query(`
      ALTER TABLE "movimientos_bancarios"
      DROP COLUMN IF EXISTS "hash_importacion"
    `);
  }
}
