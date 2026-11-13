import { MigrationInterface, QueryRunner } from 'typeorm';

export class BrandingRadioDecimales1770000000008 implements MigrationInterface {
  name = 'BrandingRadioDecimales1770000000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const columnas: Array<{ numeric_scale: number | null }> =
      await queryRunner.query(
        `SELECT numeric_scale FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'branding' AND column_name = 'radio'`,
      );
    if (columnas.length > 0 && Number(columnas[0].numeric_scale) !== 4) {
      await queryRunner.query(
        `ALTER TABLE "branding" ALTER COLUMN "radio" TYPE numeric(8,4)`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const columnas: Array<{ numeric_scale: number | null }> =
      await queryRunner.query(
        `SELECT numeric_scale FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'branding' AND column_name = 'radio'`,
      );
    if (columnas.length > 0 && Number(columnas[0].numeric_scale) !== 2) {
      await queryRunner.query(
        `ALTER TABLE "branding" ALTER COLUMN "radio" TYPE numeric(6,2)`,
      );
    }
  }
}
