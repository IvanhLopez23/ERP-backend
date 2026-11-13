import { MigrationInterface, QueryRunner } from 'typeorm';

export class CarteraManual1770000000014 implements MigrationInterface {
  name = 'CarteraManual1770000000014';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "cuentas_por_cobrar"
      ADD COLUMN IF NOT EXISTS "subtotal" decimal(14, 2) NOT NULL DEFAULT 0
    `);
    await queryRunner.query(`
      ALTER TABLE "cuentas_por_cobrar"
      ADD COLUMN IF NOT EXISTS "iva" decimal(14, 2) NOT NULL DEFAULT 0
    `);
    await queryRunner.query(`
      ALTER TABLE "cuentas_por_cobrar"
      ADD COLUMN IF NOT EXISTS "cuenta_contable_id" integer
    `);
    await queryRunner.query(`
      ALTER TABLE "cuentas_por_cobrar"
      ADD CONSTRAINT "cuentas_por_cobrar_cuenta_contable_fk"
      FOREIGN KEY ("cuenta_contable_id") REFERENCES "cuentas_contables"("id")
      ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "cuentas_por_pagar"
      ADD COLUMN IF NOT EXISTS "subtotal" decimal(14, 2) NOT NULL DEFAULT 0
    `);
    await queryRunner.query(`
      ALTER TABLE "cuentas_por_pagar"
      ADD COLUMN IF NOT EXISTS "iva" decimal(14, 2) NOT NULL DEFAULT 0
    `);
    await queryRunner.query(`
      ALTER TABLE "cuentas_por_pagar"
      ADD COLUMN IF NOT EXISTS "cuenta_contable_id" integer
    `);
    await queryRunner.query(`
      ALTER TABLE "cuentas_por_pagar"
      ADD CONSTRAINT "cuentas_por_pagar_cuenta_contable_fk"
      FOREIGN KEY ("cuenta_contable_id") REFERENCES "cuentas_contables"("id")
      ON DELETE SET NULL
    `);

    // Completar documentos existentes desde su venta/compra de origen.
    await queryRunner.query(`
      UPDATE "cuentas_por_cobrar" c
         SET "subtotal" = v."subtotal",
             "iva" = v."iva",
             "cuenta_contable_id" = (
               SELECT id FROM "cuentas_contables" WHERE "codigo" = '4101'
             )
        FROM "ventas" v
       WHERE c."venta_id" = v."id"
    `);
    await queryRunner.query(`
      UPDATE "cuentas_por_pagar" c
         SET "subtotal" = co."subtotal",
             "iva" = co."iva",
             "cuenta_contable_id" = (
               SELECT id FROM "cuentas_contables" WHERE "codigo" = '1105'
             )
        FROM "compras" co
       WHERE c."compra_id" = co."id"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "cuentas_por_cobrar"
      DROP CONSTRAINT IF EXISTS "cuentas_por_cobrar_cuenta_contable_fk"
    `);
    await queryRunner.query(`
      ALTER TABLE "cuentas_por_cobrar"
      DROP COLUMN IF EXISTS "cuenta_contable_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "cuentas_por_cobrar"
      DROP COLUMN IF EXISTS "iva"
    `);
    await queryRunner.query(`
      ALTER TABLE "cuentas_por_cobrar"
      DROP COLUMN IF EXISTS "subtotal"
    `);

    await queryRunner.query(`
      ALTER TABLE "cuentas_por_pagar"
      DROP CONSTRAINT IF EXISTS "cuentas_por_pagar_cuenta_contable_fk"
    `);
    await queryRunner.query(`
      ALTER TABLE "cuentas_por_pagar"
      DROP COLUMN IF EXISTS "cuenta_contable_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "cuentas_por_pagar"
      DROP COLUMN IF EXISTS "iva"
    `);
    await queryRunner.query(`
      ALTER TABLE "cuentas_por_pagar"
      DROP COLUMN IF EXISTS "subtotal"
    `);
  }
}
