import { MigrationInterface, QueryRunner } from 'typeorm';

export class BrandingFuente1770000000007 implements MigrationInterface {
  name = 'BrandingFuente1770000000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasColumn('branding', 'fuente'))) {
      await queryRunner.query(
        `ALTER TABLE "branding" ADD COLUMN "fuente" varchar(100) NOT NULL DEFAULT 'Public Sans'`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasColumn('branding', 'fuente')) {
      await queryRunner.query(`ALTER TABLE "branding" DROP COLUMN "fuente"`);
    }
  }
}
