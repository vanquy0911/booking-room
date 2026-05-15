import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AttendeeDto {
  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiProperty({ required: false })
  @IsEmail()
  @IsOptional()
  email?: string;
}

export class CreateBookingDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  roomId: string;

  @ApiProperty({ example: 'Họp Team hàng tuần' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Thảo luận về kế hoạch tháng tới', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: '2026-05-14T10:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  endTime: string;

  @ApiProperty({ type: [AttendeeDto], required: false })
  @IsArray()
  @IsOptional()
  @ArrayMaxSize(50, { message: 'Chỉ được mời tối đa 50 người cùng lúc' })
  @ValidateNested({ each: true })
  @Type(() => AttendeeDto)
  attendees?: AttendeeDto[];
}
