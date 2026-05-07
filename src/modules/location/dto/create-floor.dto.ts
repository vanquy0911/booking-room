import { IsNotEmpty, IsNumber, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFloorDto {
  @ApiProperty({ example: 'Tầng 1' })
  @IsNotEmpty()
  @Length(1, 50)
  name: string;

  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsNumber()
  floorNumber: number;
}
