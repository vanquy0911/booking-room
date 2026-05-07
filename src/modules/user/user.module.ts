import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from './entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserIdentity } from './entities/user_identity.entity';
import { RefreshToken } from '../auth/entities/auth.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserIdentity, RefreshToken])],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
