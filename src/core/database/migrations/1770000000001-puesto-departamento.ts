import { MigrationInterface, QueryRunner } from 'typeorm';

export class PuestoDepartamentoLink1770000000001 implements MigrationInterface {
  name = 'PuestoDepartamentoLink1770000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasColumn('puestos', 'departamento_id'))) {
      await queryRunner.query(
        `ALTER TABLE "puestos" ADD COLUMN "departamento_id" integer`,
      );
    }

    const table = await queryRunner.getTable('puestos');
    const hasFk = table?.foreignKeys.some(
      (fk) => fk.name === 'puestos_departamento_id_fk',
    );
    if (!hasFk) {
      await queryRunner.query(
        `ALTER TABLE "puestos" ADD CONSTRAINT "puestos_departamento_id_fk" FOREIGN KEY ("departamento_id") REFERENCES "departamentos"("id") ON DELETE SET NULL`,
      );
    }

    const hasIndex = table?.indices.some(
      (index) => index.name === 'idx_puestos_departamento_id',
    );
    if (!hasIndex) {
      await queryRunner.query(
        `CREATE INDEX "idx_puestos_departamento_id" ON "puestos" ("departamento_id")`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('puestos');
    if (
      table?.indices.some(
        (index) => index.name === 'idx_puestos_departamento_id',
      )
    ) {
      await queryRunner.query(`DROP INDEX "idx_puestos_departamento_id"`);
    }
    if (
      table?.foreignKeys.some((fk) => fk.name === 'puestos_departamento_id_fk')
    ) {
      await queryRunner.query(
        `ALTER TABLE "puestos" DROP CONSTRAINT "puestos_departamento_id_fk"`,
      );
    }
    if (await queryRunner.hasColumn('puestos', 'departamento_id')) {
      await queryRunner.query(
        `ALTER TABLE "puestos" DROP COLUMN "departamento_id"`,
      );
    }
  }
}
