import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRefreshSessionFamily1791051146022
  implements MigrationInterface {
  name = 'AddRefreshSessionFamily1791051146022';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "refresh_sessions"
      ADD "familyId" uuid
    `);

    await queryRunner.query(`
      UPDATE "refresh_sessions"
      SET "familyId" = "id"
    `);

    await queryRunner.query(`
      ALTER TABLE "refresh_sessions"
      ALTER COLUMN "familyId" SET NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_7456184993049cee6e5b3df722"
      ON "refresh_sessions" ("familyId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX "public"."IDX_7456184993049cee6e5b3df722"
    `);

    await queryRunner.query(`
      ALTER TABLE "refresh_sessions"
      DROP COLUMN "familyId"
    `);
  }
}