import { MigrationInterface, QueryRunner } from 'typeorm';

export class OrdenesSalida1770000000027 implements MigrationInterface {
  name = 'OrdenesSalida1770000000027';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ordenes_salida" (
        "public_id" uuid NOT NULL DEFAULT uuidv7(),
        "id" serial PRIMARY KEY,
        "folio" varchar(50) NOT NULL UNIQUE,
        "almacen_id" integer NOT NULL REFERENCES "almacenes"("id"),
        "fecha_salida" date NOT NULL,
        "motivo" text NOT NULL,
        "observaciones" text,
        "usuario_id" integer,
        "total_productos" integer NOT NULL DEFAULT 0,
        "total_unidades" numeric(14,2) NOT NULL DEFAULT 0,
        "estatus" varchar(20) NOT NULL DEFAULT 'aplicada',
        "fecha_creacion" timestamp NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ordenes_salida_detalle" (
        "public_id" uuid NOT NULL DEFAULT uuidv7(),
        "id" serial PRIMARY KEY,
        "orden_id" integer NOT NULL
          REFERENCES "ordenes_salida"("id") ON DELETE CASCADE,
        "producto_id" integer NOT NULL REFERENCES "productos"("id"),
        "codigo" varchar(50) NOT NULL,
        "nombre" varchar(200) NOT NULL,
        "unidad_medida" varchar(50),
        "cantidad" numeric(14,2) NOT NULL,
        "existencia_anterior" numeric(14,2) NOT NULL,
        "existencia_nueva" numeric(14,2) NOT NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_orden_salida_detalle_orden"
        ON "ordenes_salida_detalle" ("orden_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP TABLE IF EXISTS "ordenes_salida_detalle"',
    );
    await queryRunner.query('DROP TABLE IF EXISTS "ordenes_salida"');
  }
}
