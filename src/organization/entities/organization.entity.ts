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

  @Column({ type: 'varchar', length: 50 })
  default_timezone: string;

  @Column({ type: 'time', default: '08:00' })
  working_hours_start: string;

  @Column({ type: 'time', default: '18:00' })
  working_hours_end: string;

  @Column({
    type: 'smallint',
    array: true,
    default: () => "'{1,2,3,4,5}'",
  })
  working_days: number[];

  @Column({ type: 'int', default: 15 })
  no_show_minutes: number;

  @Column({ type: 'int', default: 24 })
  auto_reject_pending_hours: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at: Date;

  @OneToMany(() => OrganizationMember, (member) => member.organization)
  members: OrganizationMember[];

  @OneToMany(
    () => OrganizationInvitation,
    (invitation) => invitation.organization,
  )
  invitations: OrganizationInvitation[];
}
