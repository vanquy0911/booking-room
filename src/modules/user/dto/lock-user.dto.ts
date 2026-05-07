// dto/lock-user.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsDateString, IsOptional } from 'class-validator';

export class LockUserDto {
    @ApiProperty({
        example: '2026-05-10T00:00:00Z',
        description: 'Thời điểm hết hạn khóa. Nếu không truyền thì khóa vĩnh viễn'
    })
    @IsDateString()
    @IsOptional()
    lockedUntil?: string; // ISO string, nếu null thì khóa vĩnh viễn

    @ApiProperty({ example: 'Vi phạm điều khoản sử dụng' })
    @IsString()
    @IsNotEmpty()
    reason: string;
}
