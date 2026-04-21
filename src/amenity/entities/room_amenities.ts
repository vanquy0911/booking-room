import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Room } from '../../room/entities/room.entity';
import { Amenity } from './amenities.entity';

@Entity('room_amenities')
export class RoomAmenity {
  @PrimaryColumn({ type: 'uuid' })
  room_id: string;

  @ManyToOne(() => Room, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @PrimaryColumn({ type: 'uuid' })
  amenity_id: string;

  @ManyToOne(() => Amenity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'amenity_id' })
  amenity: Amenity;
}
