import { IsString, IsInt, Min, Max, IsBoolean, IsOptional, IsArray, IsUUID, IsNumber } from 'class-validator';

export class CreateRoomDto {
    @IsUUID()
    organization_id: string;

    @IsUUID()
    floor_id: string;

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
    hourly_rate?: number;

    @IsBoolean()
    @IsOptional()
    is_active?: boolean = true;

    @IsInt()
    @Min(1)
    @IsOptional()
    min_duration_minutes?: number = 15;

    @IsInt()
    @Min(1)
    @IsOptional()
    max_duration_minutes?: number = 480;

    @IsInt()
    @Min(0)
    @IsOptional()
    advance_booking_days?: number = 30;

    @IsInt()
    @Min(0)
    @IsOptional()
    buffer_minutes?: number = 15;

    @IsBoolean()
    @IsOptional()
    requires_approval?: boolean = false;

    @IsArray()
    @IsOptional()
    @IsInt({ each: true })
    allowed_days?: number[];
}
