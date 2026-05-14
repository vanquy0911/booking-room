import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  DeleteDateColumn,
  Check,
  OneToMany,
} from 'typeorm';
import { Organization } from '../../organization/entities/organization.entity';
import { Floor } from '../../location/entities/floor.entity';
import { RoomPhoto } from './room_photo.entity';

@Entity('rooms')
@Check(`"capacity" > 0`)
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // FK -> organizations
  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  // FK -> floors
  @Column({ name: 'floor_id', type: 'uuid' })
  floorId: string;

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
    name: 'hourly_rate',
    type: 'numeric',
    precision: 10,
    scale: 2,
    nullable: true,
    comment: 'Giá thuê theo giờ (VND)',
  })
  hourlyRate: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'min_duration_minutes', type: 'int', default: 15 })
  minDurationMinutes: number;

  @Column({ name: 'max_duration_minutes', type: 'int', default: 480 })
  maxDurationMinutes: number;

  @Column({ name: 'advance_booking_days', type: 'int', default: 30 })
  advanceBookingDays: number;

  @Column({ name: 'buffer_minutes', type: 'int', default: 0 })
  bufferMinutes: number;

  @Column({ name: 'requires_approval', type: 'boolean', default: false })
  requiresApproval: boolean;

  @Column({
    name: 'allowed_days',
    type: 'smallint',
    array: true,
    nullable: true,
    comment: 'Các ngày cho phép đặt (NULL = thừa hưởng từ Org)',
  })
  allowedDays: number[];

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'now()',
  })
  createdAt: Date;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamptz',
    nullable: true,
  })
  deletedAt: Date;

  @OneToMany(() => RoomPhoto, (photo) => photo.room)
  photos: RoomPhoto[];
}
