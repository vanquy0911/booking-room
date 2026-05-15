import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CancelBookingDto {
  @ApiProperty({ example: 'Tôi bận việc đột xuất' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  reason: string;
}
