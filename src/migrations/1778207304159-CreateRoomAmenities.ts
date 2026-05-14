import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRoomAmenities1778207304159 implements MigrationInterface {
  name = 'CreateRoomAmenities1778207304159';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "room_amenities" ("room_id" uuid NOT NULL, "amenity_id" uuid NOT NULL, CONSTRAINT "PK_6873eccbd044cfef35305a21671" PRIMARY KEY ("room_id", "amenity_id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" ALTER COLUMN "working_hours_start" SET DEFAULT '08:00'`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" ALTER COLUMN "working_hours_end" SET DEFAULT '18:00'`,
    );
    await queryRunner.query(
      `ALTER TABLE "room_amenities" ADD CONSTRAINT "FK_1bbdd33b01f2e52f4dd50743544" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "room_amenities" ADD CONSTRAINT "FK_936612d991e2522e82cd86fa106" FOREIGN KEY ("amenity_id") REFERENCES "amenities"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "room_amenities" DROP CONSTRAINT "FK_936612d991e2522e82cd86fa106"`,
    );
    await queryRunner.query(
      `ALTER TABLE "room_amenities" DROP CONSTRAINT "FK_1bbdd33b01f2e52f4dd50743544"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" ALTER COLUMN "working_hours_end" SET DEFAULT '18:00:00'`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" ALTER COLUMN "working_hours_start" SET DEFAULT '08:00:00'`,
    );
    await queryRunner.query(`DROP TABLE "room_amenities"`);
  }
}
