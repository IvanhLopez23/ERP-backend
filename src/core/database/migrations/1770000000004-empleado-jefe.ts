import { MigrationInterface, QueryRunner } from 'typeorm';

export class EmpleadoJefeLink1770000000004 implements MigrationInterface {
  name = 'EmpleadoJefeLink1770000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasColumn('empleados', 'jefe_id'))) {
      await queryRunner.query(
        `ALTER TABLE "empleados" ADD COLUMN "jefe_id" integer`,
      );
    }

    const table = await queryRunner.getTable('empleados');
    const hasFk = table?.foreignKeys.some(
      (fk) => fk.name === 'empleados_jefe_id_fk',
    );
    if (!hasFk) {
      await queryRunner.query(
        `ALTER TABLE "empleados" ADD CONSTRAINT "empleados_jefe_id_fk" FOREIGN KEY ("jefe_id") REFERENCES "empleados"("id") ON DELETE SET NULL`,
      );
    }

    const hasIndex = table?.indices.some(
      (index) => index.name === 'idx_empleados_jefe_id',
    );
    if (!hasIndex) {
      await queryRunner.query(
        `CREATE INDEX "idx_empleados_jefe_id" ON "empleados" ("jefe_id")`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('empleados');
    if (
      table?.indices.some((index) => index.name === 'idx_empleados_jefe_id')
    ) {
      await queryRunner.query(`DROP INDEX "idx_empleados_jefe_id"`);
    }
    if (table?.foreignKeys.some((fk) => fk.name === 'empleados_jefe_id_fk')) {
      await queryRunner.query(
        `ALTER TABLE "empleados" DROP CONSTRAINT "empleados_jefe_id_fk"`,
      );
    }
    if (await queryRunner.hasColumn('empleados', 'jefe_id')) {
      await queryRunner.query(`ALTER TABLE "empleados" DROP COLUMN "jefe_id"`);
    }
  }
}
