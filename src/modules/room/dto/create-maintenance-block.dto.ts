import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMaintenanceBlockDto {
  @ApiProperty({
    example: '2024-05-20 08:00:00',
    description: 'Thời gian bắt đầu bảo trì',
  })
  @IsString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({
    example: '2024-05-20 10:00:00',
    description: 'Thời gian kết thúc bảo trì',
  })
  @IsString()
  @IsNotEmpty()
  endTime: string;

  @ApiProperty({
    example: 'Vệ sinh định kỳ hàng tuần',
    description: 'Lý do khóa phòng',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiPropertyOptional({
    example: 'FREQ=WEEKLY;BYDAY=MO;BYHOUR=8;BYMINUTE=0',
    description: 'Quy tắc lặp lại cho việc bảo trì định kỳ',
  })
  @IsString()
  @IsOptional()
  rule?: string;
}
