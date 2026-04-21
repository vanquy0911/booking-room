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

  @Column({ type: 'uuid' })
  organization_id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({
    type: 'varchar',
    length: 20,
    comment: "'admin'|'manager'|'member'",
  })
  role: string;

  @Column({
    type: 'uuid',
    array: true,
    nullable: true,
    comment: 'Manager: scope location',
  })
  managed_location_ids: string[];

  @CreateDateColumn({
    type: 'timestamptz',
    default: () => 'now()',
  })
  joined_at: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;
}
