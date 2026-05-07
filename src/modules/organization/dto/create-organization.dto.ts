import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, MaxLength, MinLength } from 'class-validator';

export class CreateOrganizationDto {
  @ApiProperty()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  plan: string;

  @ApiProperty()
  @IsNotEmpty()
  workingHoursStart: string;

  @ApiProperty()
  @IsNotEmpty()
  workingHoursEnd: string;

  @ApiProperty()
  @IsNotEmpty()
  workingDays: number[];
}
