import { MigrationInterface, QueryRunner } from 'typeorm';

export class PolizasCancelacion1770000000012 implements MigrationInterface {
  name = 'PolizasCancelacion1770000000012';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "cuentas_por_cobrar"
      ADD COLUMN IF NOT EXISTS "poliza_cancelacion_id" integer
    `);
    await queryRunner.query(`
      ALTER TABLE "cuentas_por_cobrar"
      ADD CONSTRAINT "cuentas_por_cobrar_poliza_cancelacion_fk"
      FOREIGN KEY ("poliza_cancelacion_id") REFERENCES "polizas"("id")
      ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "cuentas_por_pagar"
      ADD COLUMN IF NOT EXISTS "poliza_cancelacion_id" integer
    `);
    await queryRunner.query(`
      ALTER TABLE "cuentas_por_pagar"
      ADD CONSTRAINT "cuentas_por_pagar_poliza_cancelacion_fk"
      FOREIGN KEY ("poliza_cancelacion_id") REFERENCES "polizas"("id")
      ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "cuentas_por_cobrar"
      DROP CONSTRAINT IF EXISTS "cuentas_por_cobrar_poliza_cancelacion_fk"
    `);
    await queryRunner.query(`
      ALTER TABLE "cuentas_por_cobrar"
      DROP COLUMN IF EXISTS "poliza_cancelacion_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "cuentas_por_pagar"
      DROP CONSTRAINT IF EXISTS "cuentas_por_pagar_poliza_cancelacion_fk"
    `);
    await queryRunner.query(`
      ALTER TABLE "cuentas_por_pagar"
      DROP COLUMN IF EXISTS "poliza_cancelacion_id"
    `);
  }
}
