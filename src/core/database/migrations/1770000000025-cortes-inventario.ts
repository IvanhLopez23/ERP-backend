import { MigrationInterface, QueryRunner } from 'typeorm';

export class CortesInventario1770000000025 implements MigrationInterface {
  name = 'CortesInventario1770000000025';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "cortes_inventario" (
        "public_id" uuid NOT NULL DEFAULT uuidv7(),
        "id" serial PRIMARY KEY,
        "almacen_id" integer NOT NULL REFERENCES "almacenes"("id"),
        "anio" integer NOT NULL,
        "mes" integer NOT NULL,
        "fecha_corte" timestamptz NOT NULL DEFAULT NOW(),
        "usuario_id" integer,
        "total_productos" integer NOT NULL DEFAULT 0,
        "total_unidades" numeric(14,2) NOT NULL DEFAULT 0,
        "total_valor_costo" numeric(14,2) NOT NULL DEFAULT 0,
        "total_valor_venta" numeric(14,2) NOT NULL DEFAULT 0,
        "fecha_creacion" timestamp NOT NULL DEFAULT NOW(),
        CONSTRAINT "uq_corte_inventario_periodo"
          UNIQUE ("almacen_id", "anio", "mes")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "cortes_inventario_detalle" (
        "public_id" uuid NOT NULL DEFAULT uuidv7(),
        "id" serial PRIMARY KEY,
        "corte_id" integer NOT NULL
          REFERENCES "cortes_inventario"("id") ON DELETE CASCADE,
        "codigo" varchar(50) NOT NULL,
        "nombre" varchar(200) NOT NULL,
        "categoria" varchar(150),
        "unidad_medida" varchar(50),
        "existencia" numeric(14,2) NOT NULL DEFAULT 0,
        "precio_costo" numeric(14,2) NOT NULL DEFAULT 0,
        "precio_venta" numeric(14,2) NOT NULL DEFAULT 0,
        "valor_costo" numeric(14,2) NOT NULL DEFAULT 0,
        "valor_venta" numeric(14,2) NOT NULL DEFAULT 0
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_corte_detalle_corte"
        ON "cortes_inventario_detalle" ("corte_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP TABLE IF EXISTS "cortes_inventario_detalle"',
    );
    await queryRunner.query('DROP TABLE IF EXISTS "cortes_inventario"');
  }
}
