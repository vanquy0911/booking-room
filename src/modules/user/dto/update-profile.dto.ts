import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { RegisterDto } from 'src/modules/auth/dto/register.dto';

export class UpdateProfileDto extends PartialType(
  OmitType(RegisterDto, ['email', 'password'] as const),
) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  oldPassword?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  newPassword?: string;
}
