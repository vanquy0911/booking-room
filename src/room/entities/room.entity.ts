import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  DeleteDateColumn,
  Check,
} from 'typeorm';
import { Organization } from '../../organization/entities/organization.entity';
import { Floor } from '../../location/entities/floor.entity';

@Entity('rooms')
@Check(`"capacity" > 0`)
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // FK -> organizations
  @Column({ type: 'uuid' })
  organization_id: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  // FK -> floors
  @Column({ type: 'uuid' })
  floor_id: string;

  @ManyToOne(() => Floor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'floor_id' })
  floor: Floor;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int' })
  capacity: number;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: true,
    comment: 'Giá thuê theo giờ (VND)',
  })
  hourly_rate: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'int', default: 15 })
  min_duration_minutes: number;

  @Column({ type: 'int', default: 480 })
  max_duration_minutes: number;

  @Column({ type: 'int', default: 30 })
  advance_booking_days: number;

  @Column({ type: 'int', default: 0 })
  buffer_minutes: number;

  @Column({ type: 'boolean', default: false })
  requires_approval: boolean;

  @Column({
    type: 'smallint',
    array: true,
    nullable: true,
    comment: 'Các ngày cho phép đặt (NULL = thừa hưởng từ Org)',
  })
  allowed_days: number[];

  @CreateDateColumn({
    type: 'timestamptz',
    default: () => 'now()',
  })
  created_at: Date;

  @DeleteDateColumn({
    type: 'timestamptz',
    nullable: true,
  })
  deleted_at: Date;
}
