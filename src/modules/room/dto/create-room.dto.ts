import {
  IsString,
  IsInt,
  Min,
  Max,
  IsBoolean,
  IsOptional,
  IsArray,
  IsUUID,
  IsNumber,
} from 'class-validator';

export class CreateRoomDto {
  @IsUUID()
  organizationId: string;

  @IsUUID()
  floorId: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @Min(1)
  capacity: number;

  @IsNumber({ allowNaN: false, maxDecimalPlaces: 2 })
  @IsOptional()
  hourlyRate?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;

  @IsInt()
  @Min(1)
  @IsOptional()
  minDurationMinutes?: number = 15;

  @IsInt()
  @Min(1)
  @IsOptional()
  maxDurationMinutes?: number = 480;

  @IsInt()
  @Min(0)
  @IsOptional()
  advanceBookingDays?: number = 30;

  @IsInt()
  @Min(0)
  @IsOptional()
  bufferMinutes?: number = 15;

  @IsBoolean()
  @IsOptional()
  requiresApproval?: boolean = false;

  @IsArray()
  @IsOptional()
  @IsInt({ each: true })
  allowedDays?: number[];
}
