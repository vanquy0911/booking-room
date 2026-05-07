import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
} from 'class-validator';

export class InviteMemberDto {
  @ApiProperty({ example: 'dong_nghiep@gmail.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Chào mừng bạn đến với công ty chúng tôi!' })
  @IsString()
  @IsOptional()
  message?: string;
}
