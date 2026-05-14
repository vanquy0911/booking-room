import { IsString, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FindAvailableRoomsDto {
  @ApiProperty({ example: '2024-05-20T08:00:00Z' })
  @IsString()
  startTime: string;

  @ApiProperty({ example: '2024-05-20T10:00:00Z' })
  @IsString()
  endTime: string;

  @ApiPropertyOptional({ example: 5 })
  @IsInt()
  @Min(1)
  @IsOptional()
  capacity?: number;

  @ApiPropertyOptional({ example: 'projector,zoom' })
  @IsString()
  @IsOptional()
  amenities?: string;
}
