import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUser1776762995268 implements MigrationInterface {
  name = 'CreateUser1776762995268';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "type" character varying(30) NOT NULL, "title" character varying(255) NOT NULL, "body" text, "entity_type" character varying(30), "entity_id" uuid, "metadata" jsonb, "read_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "waitlists" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "room_id" uuid NOT NULL, "user_id" uuid NOT NULL, "desired_start_at" TIMESTAMP WITH TIME ZONE NOT NULL, "desired_end_at" TIMESTAMP WITH TIME ZONE NOT NULL, "position" integer NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'waiting', "offered_at" TIMESTAMP WITH TIME ZONE, "offer_expires_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_d825b8fcdb753fda136c4039b3a" PRIMARY KEY ("id")); COMMENT ON COLUMN "waitlists"."position" IS 'Thứ tự ưu tiên trong hàng đợi (FIFO)'; COMMENT ON COLUMN "waitlists"."status" IS '''waiting''|''offered''|''claimed''|''expired'''; COMMENT ON COLUMN "waitlists"."offered_at" IS 'Thời điểm bắt đầu mời người dùng đặt phòng'; COMMENT ON COLUMN "waitlists"."offer_expires_at" IS 'Hết hạn lời mời (thường là +10 phút sau khi offered)'`,
    );
    await queryRunner.query(
      `CREATE TABLE "maintenance_blocks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "room_id" uuid NOT NULL, "time_range" tstzrange NOT NULL, "reason" character varying(255) NOT NULL, "rrule" text, "created_by" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_66ec439d874f384b2aab7336715" PRIMARY KEY ("id")); COMMENT ON COLUMN "maintenance_blocks"."rrule" IS 'Recurring maintenance rule (RFC 5545)'`,
    );
    await queryRunner.query(
      `CREATE TABLE "booking_series" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organization_id" uuid NOT NULL, "room_id" uuid NOT NULL, "created_by" uuid NOT NULL, "rrule" text NOT NULL, "dtstart" TIMESTAMP WITH TIME ZONE NOT NULL, "duration_minutes" integer NOT NULL, "until_at" TIMESTAMP WITH TIME ZONE, "materialized_through" TIMESTAMP WITH TIME ZONE NOT NULL, "title" character varying(255) NOT NULL, "description" text, "cancelled_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_d9121388a3326c119114075fb61" PRIMARY KEY ("id")); COMMENT ON COLUMN "booking_series"."rrule" IS 'RFC 5545 RRULE string (e.g., FREQ=WEEKLY;BYDAY=MO,WE)'; COMMENT ON COLUMN "booking_series"."dtstart" IS 'Thời điểm bắt đầu của instance đầu tiên'; COMMENT ON COLUMN "booking_series"."until_at" IS 'Thời điểm kết thúc của toàn bộ chuỗi lặp'; COMMENT ON COLUMN "booking_series"."materialized_through" IS 'Đã sinh các bản ghi Booking instance tới thời điểm này'`,
    );
    await queryRunner.query(
      `CREATE TABLE "bookings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organization_id" uuid NOT NULL, "room_id" uuid NOT NULL, "created_by" uuid NOT NULL, "title" character varying(255) NOT NULL, "description" text, "time_range" tstzrange NOT NULL, "status" character varying(20) NOT NULL, "series_id" uuid, "series_instance_date" date, "approved_by" uuid, "approved_at" TIMESTAMP WITH TIME ZONE, "rejection_reason" text, "checked_in_at" TIMESTAMP WITH TIME ZONE, "cancelled_by" uuid, "cancelled_at" TIMESTAMP WITH TIME ZONE, "cancel_reason" text, "reminded_at" TIMESTAMP WITH TIME ZONE, "google_event_id" character varying(255), "version" integer NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_bee6805982cc1e248e94ce94957" PRIMARY KEY ("id")); COMMENT ON COLUMN "bookings"."status" IS '''pending''|''confirmed''|''cancelled''|''rejected''|''in_progress''|''completed''|''no_show''|''ended_early'''`,
    );
    await queryRunner.query(
      `CREATE TABLE "booking_attendees" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "booking_id" uuid NOT NULL, "user_id" uuid, "external_email" citext, "response_status" character varying(20) NOT NULL DEFAULT 'invited', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_6610f24535e9468b15585efbf4d" PRIMARY KEY ("id")); COMMENT ON COLUMN "booking_attendees"."response_status" IS '''invited''|''accepted''|''declined''|''tentative'''`,
    );
    await queryRunner.query(
      `CREATE TABLE "audit_logs" ("id" BIGSERIAL NOT NULL, "organization_id" uuid, "actor_id" uuid, "action" character varying(50) NOT NULL, "entity_type" character varying(30) NOT NULL, "entity_id" uuid, "ip_address" inet, "user_agent" text, "metadata" jsonb, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id")); COMMENT ON COLUMN "audit_logs"."metadata" IS 'Before/after diff'`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" ALTER COLUMN "working_hours_start" SET DEFAULT '08:00'`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" ALTER COLUMN "working_hours_end" SET DEFAULT '18:00'`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "waitlists" ADD CONSTRAINT "FK_82e485adda0dfffaaef1230d4f6" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "waitlists" ADD CONSTRAINT "FK_bb58efd04ea4eff490e0333f744" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "maintenance_blocks" ADD CONSTRAINT "FK_4133d73175ae63766caa3188c51" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "maintenance_blocks" ADD CONSTRAINT "FK_ade81faaeee97f30a1fcd819fc3" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "booking_series" ADD CONSTRAINT "FK_76456f671f94c1edf31d5de57af" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "booking_series" ADD CONSTRAINT "FK_23d5929843d8b3a3b5141c1055b" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "booking_series" ADD CONSTRAINT "FK_4f447ae45165b3c5f4b2ec739ee" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD CONSTRAINT "FK_1b3f0fcfa5c68dffbfd47cbb103" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD CONSTRAINT "FK_0b0fc32fe6bd0119e281628df7a" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD CONSTRAINT "FK_44342bfa812465df91df3d9a152" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD CONSTRAINT "FK_f029d2aa232d51e6c6742cd8e2d" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD CONSTRAINT "FK_7bc8366af1bd0c09850cef683bd" FOREIGN KEY ("cancelled_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "booking_attendees" ADD CONSTRAINT "FK_9c8042a806022ef9e11cb3c8b05" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "booking_attendees" ADD CONSTRAINT "FK_27a456e539de09d075217c99485" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_145f35b204c731ba7fc1a0be0e7" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_177183f29f438c488b5e8510cdb" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_177183f29f438c488b5e8510cdb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_145f35b204c731ba7fc1a0be0e7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "booking_attendees" DROP CONSTRAINT "FK_27a456e539de09d075217c99485"`,
    );
    await queryRunner.query(
      `ALTER TABLE "booking_attendees" DROP CONSTRAINT "FK_9c8042a806022ef9e11cb3c8b05"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP CONSTRAINT "FK_7bc8366af1bd0c09850cef683bd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP CONSTRAINT "FK_f029d2aa232d51e6c6742cd8e2d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP CONSTRAINT "FK_44342bfa812465df91df3d9a152"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP CONSTRAINT "FK_0b0fc32fe6bd0119e281628df7a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP CONSTRAINT "FK_1b3f0fcfa5c68dffbfd47cbb103"`,
    );
    await queryRunner.query(
      `ALTER TABLE "booking_series" DROP CONSTRAINT "FK_4f447ae45165b3c5f4b2ec739ee"`,
    );
    await queryRunner.query(
      `ALTER TABLE "booking_series" DROP CONSTRAINT "FK_23d5929843d8b3a3b5141c1055b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "booking_series" DROP CONSTRAINT "FK_76456f671f94c1edf31d5de57af"`,
    );
    await queryRunner.query(
      `ALTER TABLE "maintenance_blocks" DROP CONSTRAINT "FK_ade81faaeee97f30a1fcd819fc3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "maintenance_blocks" DROP CONSTRAINT "FK_4133d73175ae63766caa3188c51"`,
    );
    await queryRunner.query(
      `ALTER TABLE "waitlists" DROP CONSTRAINT "FK_bb58efd04ea4eff490e0333f744"`,
    );
    await queryRunner.query(
      `ALTER TABLE "waitlists" DROP CONSTRAINT "FK_82e485adda0dfffaaef1230d4f6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_9a8a82462cab47c73d25f49261f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" ALTER COLUMN "working_hours_end" SET DEFAULT '18:00:00'`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" ALTER COLUMN "working_hours_start" SET DEFAULT '08:00:00'`,
    );
    await queryRunner.query(`DROP TABLE "audit_logs"`);
    await queryRunner.query(`DROP TABLE "booking_attendees"`);
    await queryRunner.query(`DROP TABLE "bookings"`);
    await queryRunner.query(`DROP TABLE "booking_series"`);
    await queryRunner.query(`DROP TABLE "maintenance_blocks"`);
    await queryRunner.query(`DROP TABLE "waitlists"`);
    await queryRunner.query(`DROP TABLE "notifications"`);
  }
}
