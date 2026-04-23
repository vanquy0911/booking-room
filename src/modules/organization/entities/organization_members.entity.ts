import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Organization } from './organization.entity';
import { User } from '../../user/entities/user.entity';

@Entity('organization_members')
export class OrganizationMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({
    type: 'varchar',
    length: 20,
    comment: "'admin'|'manager'|'member'",
  })
  role: string;

  @Column({
    name: 'managed_location_ids',
    type: 'uuid',
    array: true,
    nullable: true,
    comment: 'Manager: scope location',
  })
  managedLocationIds: string[];

  @CreateDateColumn({
    name: 'joined_at',
    type: 'timestamptz',
    default: () => 'now()',
  })
  joinedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;
}
