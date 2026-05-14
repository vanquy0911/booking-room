import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixRoleInviatation1778059915599 implements MigrationInterface {
  name = 'FixRoleInviatation1778059915599';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "organizations" ALTER COLUMN "working_hours_start" SET DEFAULT '08:00'`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" ALTER COLUMN "working_hours_end" SET DEFAULT '18:00'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "organizations" ALTER COLUMN "working_hours_end" SET DEFAULT '18:00:00'`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" ALTER COLUMN "working_hours_start" SET DEFAULT '08:00:00'`,
    );
  }
}
