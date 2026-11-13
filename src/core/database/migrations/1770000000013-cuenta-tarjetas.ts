import { MigrationInterface, QueryRunner } from 'typeorm';

export class CuentaTarjetasPorCobrar1770000000013 implements MigrationInterface {
  name = 'CuentaTarjetasPorCobrar1770000000013';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "cuentas_contables"
        ("codigo", "nombre", "descripcion", "tipo", "naturaleza", "padre_id", "nivel", "permite_movimientos", "activo")
      SELECT
        '1106',
        'Tarjetas por cobrar',
        'Liquidaciones pendientes de cobro con tarjeta',
        'activo',
        'deudora',
        padre."id",
        padre."nivel" + 1,
        true,
        true
      FROM "cuentas_contables" padre
      WHERE padre."codigo" = '1100'
        AND NOT EXISTS (
          SELECT 1 FROM "cuentas_contables" hija WHERE hija."codigo" = '1106'
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "cuentas_contables" cuenta
      WHERE cuenta."codigo" = '1106'
        AND NOT EXISTS (
          SELECT 1 FROM "polizas_detalles" detalle
          WHERE detalle."cuenta_id" = cuenta."id"
        )
    `);
  }
}
