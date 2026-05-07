import {
    IsNotEmpty,
    IsString,
    IsOptional,
    Length,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLocationDto {
    @ApiProperty()
    @IsNotEmpty()
    @Length(3, 100)
    name: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    address?: string;
}