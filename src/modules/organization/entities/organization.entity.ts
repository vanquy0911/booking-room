import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  DeleteDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { OrganizationMember } from './organization_members.entity';
import { OrganizationInvitation } from './organization_invitations.entity';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100 })
  slug: string;

  @Column({ type: 'varchar', length: 20, default: 'free' })
  plan: string;

  @Column({ name: 'default_timezone', type: 'varchar', length: 50 })
  defaultTimezone: string;

  @Column({
    name: 'working_hours_start',
    type: 'time',
    default: '08:00',
    nullable: true,
  })
  workingHoursStart: string;

  @Column({
    name: 'working_hours_end',
    type: 'time',
    default: '18:00',
    nullable: true,
  })
  workingHoursEnd: string;

  @Column({
    name: 'working_days',
    type: 'smallint',
    array: true,
    default: () => "'{1,2,3,4,5}'",
  })
  workingDays: number[];

  @Column({ name: 'no_show_minutes', type: 'int', default: 15, nullable: true })
  noShowMinutes: number;

  @Column({
    name: 'auto_reject_pending_hours',
    type: 'int',
    default: 24,
    nullable: true,
  })
  autoRejectPendingHours: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt: Date;

  @OneToMany(() => OrganizationMember, (member) => member.organization)
  members: OrganizationMember[];

  @OneToMany(
    () => OrganizationInvitation,
    (invitation) => invitation.organization,
  )
  invitations: OrganizationInvitation[];
}
