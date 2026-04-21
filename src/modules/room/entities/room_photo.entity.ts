import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Room } from './room.entity';
import { User } from '../../user/entities/user.entity';

@Entity('room_photos')
export class RoomPhoto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // FK -> rooms
  @Column({ name: 'room_id', type: 'uuid' })
  roomId: string;

  @ManyToOne(() => Room, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @Column({ name: 'storage_key', type: 'varchar', length: 500 })
  storageKey: string;

  @Column({
    name: 'thumbnail_key',
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: '256x256 generated',
  })
  thumbnailKey: string;

  @Column({ type: 'smallint', default: 0 })
  position: number;

  // FK -> users
  @Column({ name: 'uploaded_by', type: 'uuid', nullable: true })
  uploadedBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploaded_by' })
  uploader: User;

  @Column({ name: 'size_bytes', type: 'int' })
  sizeBytes: number;

  @Column({ name: 'mime_type', type: 'varchar', length: 50 })
  mimeType: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'now()',
  })
  createdAt: Date;
}
