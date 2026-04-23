import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTable1776794479927 implements MigrationInterface {
  name = 'CreateTable1776794479927';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "refresh_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "token_hash" character varying(64) NOT NULL, "device_info" character varying(255), "ip_address" inet, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "revoked_at" TIMESTAMP WITH TIME ZONE, "replaced_by" uuid, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_a7838d2ba25be1342091b6695f1" UNIQUE ("token_hash"), CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "full_name" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "avatar_url" character varying NOT NULL, "timezone" character varying NOT NULL DEFAULT 'Asia/Ho_Chi_Minh', "locale" character varying NOT NULL DEFAULT 'vi', "email_verified_at" TIMESTAMP, "last_login_at" TIMESTAMP, "locked_until" TIMESTAMP, "role" "public"."users_role_enum" NOT NULL DEFAULT 'user', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_identities" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "provider" character varying NOT NULL, "provider_user_id" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e23bff04e9c3e7b785e442b262c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "organization_members" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organization_id" uuid NOT NULL, "user_id" uuid NOT NULL, "role" character varying(20) NOT NULL, "managed_location_ids" uuid array, "joined_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_c2b39d5d072886a4d9c8105eb9a" PRIMARY KEY ("id")); COMMENT ON COLUMN "organization_members"."role" IS '''admin''|''manager''|''member'''; COMMENT ON COLUMN "organization_members"."managed_location_ids" IS 'Manager: scope location'`,
    );
    await queryRunner.query(
      `CREATE TABLE "organization_invitations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organization_id" uuid NOT NULL, "email" citext NOT NULL, "role" character varying(20) NOT NULL, "token_hash" character varying(64) NOT NULL, "invited_by" uuid NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "accepted_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_da2dfab0d3cb7f1bfdc886c4289" UNIQUE ("token_hash"), CONSTRAINT "PK_f172f12b8a9ee6584b661f57e24" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "organizations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "slug" character varying(100) NOT NULL, "plan" character varying(20) NOT NULL DEFAULT 'free', "default_timezone" character varying(50) NOT NULL, "working_hours_start" TIME NOT NULL DEFAULT '08:00', "working_hours_end" TIME NOT NULL DEFAULT '18:00', "working_days" smallint array NOT NULL DEFAULT '{1,2,3,4,5}', "no_show_minutes" integer NOT NULL DEFAULT '15', "auto_reject_pending_hours" integer NOT NULL DEFAULT '24', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_6b031fcd0863e3f6b44230163f9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_963693341bd612aa01ddf3a4b6" ON "organizations" ("slug") `,
    );
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
      `CREATE TABLE "amenities" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organization_id" uuid NOT NULL, "name" character varying(50) NOT NULL, "icon" character varying(50), CONSTRAINT "PK_c0777308847b3556086f2fb233e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_identities" ADD CONSTRAINT "FK_bf5fe01eb8cad7114b4c371cdc7" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization_members" ADD CONSTRAINT "FK_89bde91f78d36ca41e9515d91c6" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization_members" ADD CONSTRAINT "FK_7062a4fbd9bab22ffd918e5d3d9" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization_invitations" ADD CONSTRAINT "FK_7f88954e8d667a76ae3ced6f446" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization_invitations" ADD CONSTRAINT "FK_8ab435d962010401bc62c8d9e38" FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
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
    await queryRunner.query(
      `ALTER TABLE "amenities" ADD CONSTRAINT "FK_14c29e15ee007c7a0143269f6ef" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "amenities" DROP CONSTRAINT "FK_14c29e15ee007c7a0143269f6ef"`,
    );
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
      `ALTER TABLE "organization_invitations" DROP CONSTRAINT "FK_8ab435d962010401bc62c8d9e38"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization_invitations" DROP CONSTRAINT "FK_7f88954e8d667a76ae3ced6f446"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization_members" DROP CONSTRAINT "FK_7062a4fbd9bab22ffd918e5d3d9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization_members" DROP CONSTRAINT "FK_89bde91f78d36ca41e9515d91c6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_identities" DROP CONSTRAINT "FK_bf5fe01eb8cad7114b4c371cdc7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4"`,
    );
    await queryRunner.query(`DROP TABLE "amenities"`);
    await queryRunner.query(`DROP TABLE "audit_logs"`);
    await queryRunner.query(`DROP TABLE "booking_attendees"`);
    await queryRunner.query(`DROP TABLE "bookings"`);
    await queryRunner.query(`DROP TABLE "booking_series"`);
    await queryRunner.query(`DROP TABLE "maintenance_blocks"`);
    await queryRunner.query(`DROP TABLE "waitlists"`);
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TABLE "room_photos"`);
    await queryRunner.query(`DROP TABLE "rooms"`);
    await queryRunner.query(`DROP TABLE "floors"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3540a4df2635b9aab5c8538088"`,
    );
    await queryRunner.query(`DROP TABLE "locations"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_963693341bd612aa01ddf3a4b6"`,
    );
    await queryRunner.query(`DROP TABLE "organizations"`);
    await queryRunner.query(`DROP TABLE "organization_invitations"`);
    await queryRunner.query(`DROP TABLE "organization_members"`);
    await queryRunner.query(`DROP TABLE "user_identities"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "refresh_tokens"`);
  }
}
