import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixTable1776844325181 implements MigrationInterface {
  name = 'FixTable1776844325181';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "avatar_url" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" ALTER COLUMN "working_hours_start" SET DEFAULT '08:00'`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" ALTER COLUMN "working_hours_end" SET DEFAULT '18:00'`,
    );
    await queryRunner.query(`COMMENT ON COLUMN "bookings"."status" IS NULL`);
    await queryRunner.query(
      `ALTER TABLE "bookings" ALTER COLUMN "status" SET DEFAULT 'pending'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "bookings" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "bookings"."status" IS '''pending''|''confirmed''|''cancelled''|''rejected''|''in_progress''|''completed''|''no_show''|''ended_early'''`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" ALTER COLUMN "working_hours_end" SET DEFAULT '18:00:00'`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" ALTER COLUMN "working_hours_start" SET DEFAULT '08:00:00'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "avatar_url" SET NOT NULL`,
    );
  }
}
