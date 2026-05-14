import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class CreateAmenityDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @Length(2, 50)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  icon?: string;
}
