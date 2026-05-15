import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';
import { AttendeeDto } from './create-booking.dto';

export class InviteAttendeesDto {
  @ApiProperty({
    type: [AttendeeDto],
    description: 'Danh sách người tham dự (Max 50)',
  })
  @IsArray()
  @ArrayMaxSize(50, { message: 'Chỉ được mời tối đa 50 người cùng lúc' })
  @ValidateNested({ each: true })
  @Type(() => AttendeeDto)
  attendees: AttendeeDto[];
}
