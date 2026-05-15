import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { RoomService } from './room.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { CreateMaintenanceBlockDto } from './dto/create-maintenance-block.dto';
import { FindAvailableRoomsDto } from './dto/find-available-rooms.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../../commons/decorators/user.decorator';
import { FilesInterceptor } from '@nestjs/platform-express';

@ApiTags('room')
@Controller('room')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Post(':orgId')
  @ApiOperation({ summary: 'Tạo phòng mới' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  create(
    @Param('orgId') orgId: string,
    @User('id') userId: string,
    @Body() createRoomDto: CreateRoomDto,
  ) {
    return this.roomService.create(orgId, userId, createRoomDto);
  }

  @Get(':orgId')
  @ApiOperation({ summary: 'Lấy danh sách phòng của tổ chức' })
  @ApiQuery({
    name: 'amenities',
    required: false,
    description:
      'Filter by amenity names (comma separated), e.g. projector,zoom',
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  findAll(
    @Param('orgId') orgId: string,
    @Query('amenities') amenities?: string,
  ) {
    return this.roomService.findAll(orgId, amenities);
  }

  @Get(':orgId/available')
  @ApiOperation({ summary: 'Tìm phòng trống trong khoảng thời gian' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  findAvailable(
    @Param('orgId') orgId: string,
    @Query() dto: FindAvailableRoomsDto,
  ) {
    return this.roomService.findAvailableRooms(orgId, dto);
  }

  @Post(':orgId/:roomId/upload-photos')
  @ApiOperation({ summary: 'Upload ảnh cho phòng (tối đa 5 ảnh)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Chỉ chấp nhận file ảnh (jpg, png, webp). SVG và các loại khác bị từ chối.',
            ),
            false,
          );
        }
      },
    }),
  )
  uploadPhotos(
    @Param('orgId') orgId: string,
    @Param('roomId') roomId: string,
    @User('id') userId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Vui lòng chọn ít nhất 1 ảnh');
    }
    return this.roomService.uploadPhotos(orgId, roomId, userId, files);
  }

  @Patch(':orgId/:roomId')
  @ApiOperation({ summary: 'Cập nhật thông tin phòng' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  update(
    @Param('orgId') orgId: string,
    @Param('roomId') roomId: string,
    @User('id') userId: string,
    @Body() updateRoomDto: UpdateRoomDto,
  ) {
    return this.roomService.update(orgId, roomId, userId, updateRoomDto);
  }

  @Delete(':orgId/:roomId')
  @ApiOperation({ summary: 'Xóa phòng' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  remove(
    @Param('orgId') orgId: string,
    @Param('roomId') roomId: string,
    @User('id') userId: string,
  ) {
    return this.roomService.remove(orgId, roomId, userId);
  }

  @Post(':orgId/:roomId/maintenance-blocks')
  @ApiOperation({ summary: 'Tạo block lịch bảo trì' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  createMaintenanceBlock(
    @Param('orgId') orgId: string,
    @Param('roomId') roomId: string,
    @User('id') userId: string,
    @Body() dto: CreateMaintenanceBlockDto,
  ) {
    return this.roomService.createMaintenanceBlock(orgId, roomId, userId, dto);
  }

  @Get(':orgId/:roomId/maintenance-blocks')
  @ApiOperation({ summary: 'Lấy danh sách block lịch bảo trì' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  findAllMaintenanceBlocks(
    @Param('orgId') orgId: string,
    @Param('roomId') roomId: string,
    @User('id') userId: string,
  ) {
    return this.roomService.findAllMaintenanceBlocks(orgId, roomId, userId);
  }

  @Delete(':orgId/maintenance-blocks/:blockId')
  @ApiOperation({ summary: 'Xóa block lịch bảo trì' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  removeMaintenanceBlock(
    @Param('orgId') orgId: string,
    @Param('blockId') blockId: string,
    @User('id') userId: string,
  ) {
    return this.roomService.removeMaintenanceBlock(orgId, blockId, userId);
  }
}
