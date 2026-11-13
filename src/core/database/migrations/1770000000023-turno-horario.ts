import { MigrationInterface, QueryRunner } from 'typeorm';

export class TurnoHorario1770000000023 implements MigrationInterface {
  name = 'TurnoHorario1770000000023';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "turnos"
      ADD COLUMN IF NOT EXISTS "hora_entrada" time,
      ADD COLUMN IF NOT EXISTS "hora_salida" time,
      ADD COLUMN IF NOT EXISTS "hora_comida_inicio" time,
      ADD COLUMN IF NOT EXISTS "hora_comida_fin" time,
      ADD COLUMN IF NOT EXISTS "tolerancia_minutos" integer NOT NULL DEFAULT 10,
      ADD COLUMN IF NOT EXISTS "dias_laborables" varchar(20) NOT NULL DEFAULT 'L,M,X,J,V'
    `);

    await queryRunner.query(`
      UPDATE "turnos"
         SET "hora_entrada" = COALESCE("hora_entrada", '09:00'),
             "hora_salida"  = COALESCE("hora_salida", '18:00')
    `);

    await queryRunner.query(`
      ALTER TABLE "asistencias"
      ADD COLUMN IF NOT EXISTS "retardo_minutos" integer NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "salida_anticipada_minutos" integer NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "horas_trabajadas" numeric(5,2),
      ADD COLUMN IF NOT EXISTS "turno_id" integer
    `);

    await queryRunner.query(`
      ALTER TABLE "asistencias"
      ADD CONSTRAINT "FK_asistencias_turno"
      FOREIGN KEY ("turno_id") REFERENCES "turnos"("id")
      ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "asistencias"
      DROP CONSTRAINT IF EXISTS "FK_asistencias_turno"
    `);
    await queryRunner.query(`
      ALTER TABLE "asistencias"
      DROP COLUMN IF EXISTS "retardo_minutos",
      DROP COLUMN IF EXISTS "salida_anticipada_minutos",
      DROP COLUMN IF EXISTS "horas_trabajadas",
      DROP COLUMN IF EXISTS "turno_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "turnos"
      DROP COLUMN IF EXISTS "hora_entrada",
      DROP COLUMN IF EXISTS "hora_salida",
      DROP COLUMN IF EXISTS "hora_comida_inicio",
      DROP COLUMN IF EXISTS "hora_comida_fin",
      DROP COLUMN IF EXISTS "tolerancia_minutos",
      DROP COLUMN IF EXISTS "dias_laborables"
    `);
  }
}
