import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
import { Organization } from '../../organization/entities/organization.entity';
import { Room } from '../../room/entities/room.entity';
import { User } from '../../user/entities/user.entity';

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // FK -> organizations
  @Column({ type: 'uuid' })
  organization_id: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  // FK -> rooms
  @Column({ type: 'uuid' })
  room_id: string;

  @ManyToOne(() => Room)
  @JoinColumn({ name: 'room_id' })
  room: Room;

  // FK -> users (Created By)
  @Column({ type: 'uuid' })
  created_by: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'tstzrange' })
  time_range: string;

  @Column({
    type: 'varchar',
    length: 20,
    comment:
      "'pending'|'confirmed'|'cancelled'|'rejected'|'in_progress'|'completed'|'no_show'|'ended_early'",
  })
  status: string;

  @Column({ type: 'uuid', nullable: true })
  series_id: string;

  @Column({ type: 'date', nullable: true })
  series_instance_date: string;

  @Column({ type: 'uuid', nullable: true })
  approved_by: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'approved_by' })
  approver: User;

  @Column({ type: 'timestamptz', nullable: true })
  approved_at: Date;

  @Column({ type: 'text', nullable: true })
  rejection_reason: string;

  @Column({ type: 'timestamptz', nullable: true })
  checked_in_at: Date;

  @Column({ type: 'uuid', nullable: true })
  cancelled_by: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'cancelled_by' })
  canceller: User;

  @Column({ type: 'timestamptz', nullable: true })
  cancelled_at: Date;

  @Column({ type: 'text', nullable: true })
  cancel_reason: string;

  @Column({ type: 'timestamptz', nullable: true })
  reminded_at: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  google_event_id: string;

  @VersionColumn()
  version: number;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'now()' })
  updated_at: Date;
}
