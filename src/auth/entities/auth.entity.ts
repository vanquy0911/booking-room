import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // FK → users.id
  @Column({ type: 'uuid' })
  user_id: string;

  @ManyToOne(() => User, (user) => user.refreshTokens, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // SHA-256 (64 ký tự hex)
  @Column({ type: 'varchar', length: 64, unique: true })
  token_hash: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  device_info: string;

  @Column({ type: 'inet', nullable: true })
  ip_address: string;

  @Column({ type: 'timestamptz' })
  expires_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  revoked_at: Date;

  // rotation chain
  @Column({ type: 'uuid', nullable: true })
  replaced_by: string;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  created_at: Date;
}
