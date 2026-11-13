import { MigrationInterface, QueryRunner } from 'typeorm';

export class BrandingRadio1770000000006 implements MigrationInterface {
  name = 'BrandingRadio1770000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasColumn('branding', 'radio'))) {
      await queryRunner.query(
        `ALTER TABLE "branding" ADD COLUMN "radio" numeric(6,2) NOT NULL DEFAULT 1.5`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasColumn('branding', 'radio')) {
      await queryRunner.query(`ALTER TABLE "branding" DROP COLUMN "radio"`);
    }
  }
}
