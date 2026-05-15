import {
  IsString,
  IsInt,
  Min,
  Max,
  IsBoolean,
  IsOptional,
  IsArray,
  IsNumber,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoomDto {
  @ApiProperty()
  @IsUUID()
  floorId: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(1)
  @Max(1000)
  capacity: number;

  @ApiProperty()
  @IsNumber({ allowNaN: false, maxDecimalPlaces: 2 })
  @IsOptional()
  hourlyRate?: number;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;

  @ApiProperty()
  @IsInt()
  @Min(1)
  @IsOptional()
  minDurationMinutes?: number = 15;

  @ApiProperty()
  @IsInt()
  @Min(1)
  @IsOptional()
  maxDurationMinutes?: number = 480;

  @ApiProperty()
  @IsInt()
  @Min(0)
  @IsOptional()
  advanceBookingDays?: number = 30;

  @ApiProperty()
  @IsInt()
  @Min(0)
  @IsOptional()
  bufferMinutes?: number = 15;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  requiresApproval?: boolean = false;

  @ApiPropertyOptional({ type: [Number], example: [1, 2, 3] })
  @IsArray()
  @IsOptional()
  @IsInt({ each: true })
  allowedDays?: number[];

  @ApiPropertyOptional({ type: [String], example: ['uuid-1', 'uuid-2'] })
  @IsArray()
  @IsOptional()
  @IsUUID('4', { each: true })
  amenityIds?: string[];
}
