import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Room } from '../../room/entities/room.entity';
import { Amenity } from './amenities.entity';

@Entity('room_amenities')
export class RoomAmenity {
  @PrimaryColumn({ name: 'room_id', type: 'uuid' })
  roomId: string;

  @ManyToOne(() => Room, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @PrimaryColumn({ name: 'amenity_id', type: 'uuid' })
  amenityId: string;

  @ManyToOne(() => Amenity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'amenity_id' })
  amenity: Amenity;
}
