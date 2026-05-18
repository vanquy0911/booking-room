import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RejectBookingDto {
  @ApiProperty({ example: 'Phòng họp bận việc đột xuất' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  reason: string;
}
