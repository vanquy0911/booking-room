import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUser1776760505418 implements MigrationInterface {
  name = 'CreateUser1776760505418';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "locations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organization_id" uuid NOT NULL, "name" character varying(100) NOT NULL, "slug" character varying(100) NOT NULL, "address" text, "timezone" character varying(50) NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_7cc1c9e3853b94816c094825e74" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3540a4df2635b9aab5c8538088" ON "locations" ("slug") `,
    );
    await queryRunner.query(
      `CREATE TABLE "floors" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "location_id" uuid NOT NULL, "name" character varying(50) NOT NULL, "floor_number" smallint NOT NULL, CONSTRAINT "PK_dae78234002afa84842d3a08ee0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "rooms" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organization_id" uuid NOT NULL, "floor_id" uuid NOT NULL, "name" character varying(100) NOT NULL, "description" text, "capacity" integer NOT NULL, "hourly_rate" numeric(10,2), "is_active" boolean NOT NULL DEFAULT true, "min_duration_minutes" integer NOT NULL DEFAULT '15', "max_duration_minutes" integer NOT NULL DEFAULT '480', "advance_booking_days" integer NOT NULL DEFAULT '30', "buffer_minutes" integer NOT NULL DEFAULT '0', "requires_approval" boolean NOT NULL DEFAULT false, "allowed_days" smallint array, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "CHK_75e2c7edb7cfeafd414ec4c1ad" CHECK ("capacity" > 0), CONSTRAINT "PK_0368a2d7c215f2d0458a54933f2" PRIMARY KEY ("id")); COMMENT ON COLUMN "rooms"."hourly_rate" IS 'Giá thuê theo giờ (VND)'; COMMENT ON COLUMN "rooms"."allowed_days" IS 'Các ngày cho phép đặt (NULL = thừa hưởng từ Org)'`,
    );
    await queryRunner.query(
      `CREATE TABLE "room_photos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "room_id" uuid NOT NULL, "storage_key" character varying(500) NOT NULL, "thumbnail_key" character varying(500), "position" smallint NOT NULL DEFAULT '0', "uploaded_by" uuid, "size_bytes" integer NOT NULL, "mime_type" character varying(50) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_317734ebf069d5d687b83ad7bec" PRIMARY KEY ("id")); COMMENT ON COLUMN "room_photos"."thumbnail_key" IS '256x256 generated'`,
    );
    await queryRunner.query(
      `CREATE TABLE "amenities" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organization_id" uuid NOT NULL, "name" character varying(50) NOT NULL, "icon" character varying(50), CONSTRAINT "PK_c0777308847b3556086f2fb233e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" ALTER COLUMN "working_hours_start" SET DEFAULT '08:00'`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" ALTER COLUMN "working_hours_end" SET DEFAULT '18:00'`,
    );
    await queryRunner.query(
      `ALTER TABLE "locations" ADD CONSTRAINT "FK_e80aa366acb3dbc300e668c3ee2" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "floors" ADD CONSTRAINT "FK_34790c1dc5d8c9e33adee3ec09d" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "rooms" ADD CONSTRAINT "FK_85249253c3c41f4d60ef8a3ded0" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "rooms" ADD CONSTRAINT "FK_be204081b6be27f2801cea37bc0" FOREIGN KEY ("floor_id") REFERENCES "floors"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "room_photos" ADD CONSTRAINT "FK_f0a15e1296d9e814715dbb73c99" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "room_photos" ADD CONSTRAINT "FK_2fb5a6197e808298762c016c01f" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "amenities" ADD CONSTRAINT "FK_14c29e15ee007c7a0143269f6ef" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "amenities" DROP CONSTRAINT "FK_14c29e15ee007c7a0143269f6ef"`,
    );
    await queryRunner.query(
      `ALTER TABLE "room_photos" DROP CONSTRAINT "FK_2fb5a6197e808298762c016c01f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "room_photos" DROP CONSTRAINT "FK_f0a15e1296d9e814715dbb73c99"`,
    );
    await queryRunner.query(
      `ALTER TABLE "rooms" DROP CONSTRAINT "FK_be204081b6be27f2801cea37bc0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "rooms" DROP CONSTRAINT "FK_85249253c3c41f4d60ef8a3ded0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "floors" DROP CONSTRAINT "FK_34790c1dc5d8c9e33adee3ec09d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "locations" DROP CONSTRAINT "FK_e80aa366acb3dbc300e668c3ee2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" ALTER COLUMN "working_hours_end" SET DEFAULT '18:00:00'`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" ALTER COLUMN "working_hours_start" SET DEFAULT '08:00:00'`,
    );
    await queryRunner.query(`DROP TABLE "amenities"`);
    await queryRunner.query(`DROP TABLE "room_photos"`);
    await queryRunner.query(`DROP TABLE "rooms"`);
    await queryRunner.query(`DROP TABLE "floors"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3540a4df2635b9aab5c8538088"`,
    );
    await queryRunner.query(`DROP TABLE "locations"`);
  }
}
