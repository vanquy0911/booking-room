import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateBookingDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  roomId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  startTime: Date;

  @ApiProperty()
  @IsDateString()
  @IsNotEmpty()
  endTime: Date;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  attendees: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;
}
