import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, IsNull, MoreThan, Not, Repository } from 'typeorm';
import { Room } from './entities/room.entity';
import { Floor } from '../location/entities/floor.entity';
import { OrganizationMember } from '../organization/entities/organization_members.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { CreateMaintenanceBlockDto } from './dto/create-maintenance-block.dto';
import { RoomAmenity } from '../amenity/entities/room_amenities.entity';
import { Amenity } from '../amenity/entities/amenities.entity';
import { RoomPhoto } from './entities/room_photo.entity';
import { CloudinaryService } from '../../commons/cloudinary/cloudinary.service';
import { Booking, BookingStatus } from '../booking/entities/booking.entity';
import { MaintenanceBlock } from './entities/maintenance_blocks.entity';
import { FindAvailableRoomsDto } from './dto/find-available-rooms.dto';
import { isRRuleOverlapping } from '../../commons/utils/rrule.util';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,

    @InjectRepository(Floor)
    private readonly floorRepository: Repository<Floor>,

    @InjectRepository(OrganizationMember)
    private readonly organizationMemberRepository: Repository<OrganizationMember>,

    @InjectRepository(Amenity)
    private readonly amenityRepository: Repository<Amenity>,

    @InjectRepository(RoomPhoto)
    private readonly roomPhotoRepository: Repository<RoomPhoto>,

    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,

    private readonly cloudinaryService: CloudinaryService,

    private readonly dataSource: DataSource,

    @InjectRepository(MaintenanceBlock)
    private readonly maintenanceBlockRepository: Repository<MaintenanceBlock>,
  ) { }

  private checkAdmin(
    membership: OrganizationMember,
    errorMessage = 'Bạn không có quyền thực hiện thao tác này',
  ) {
    if (membership.role !== 'admin') {
      throw new ForbiddenException(errorMessage);
    }
  }

  async create(orgId: string, membership: OrganizationMember, dto: CreateRoomDto) {
    const { amenityIds, ...roomData } = dto;

    // 1. Kiểm tra quyền admin
    this.checkAdmin(membership, 'Bạn không có quyền tạo phòng');

    // 2. Kiểm tra floor
    const floor = await this.floorRepository.findOne({
      where: { id: dto.floorId },
      relations: ['location'],
    });
    if (!floor || floor.location.organizationId !== orgId) {
      throw new BadRequestException(
        'Tầng không tồn tại hoặc không thuộc tổ chức này',
      );
    }

    // 3. Kiểm tra tên phòng trùng
    const existingRoom = await this.roomRepository.findOne({
      where: { floorId: dto.floorId, name: dto.name },
    });
    if (existingRoom)
      throw new BadRequestException('Tên phòng đã tồn tại trong tầng này');

    // 4. Nếu có amenityIds, kiểm tra xem chúng có hợp lệ (thuộc org) không
    if (amenityIds && amenityIds.length > 0) {
      const amenitiesCount = await this.amenityRepository.count({
        where: { id: In(amenityIds), organizationId: orgId },
      });
      if (amenitiesCount !== amenityIds.length) {
        throw new BadRequestException(
          'Một hoặc nhiều tiện ích không hợp lệ hoặc không thuộc tổ chức này',
        );
      }
    }

    // 5. Thực hiện lưu bằng transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const room = this.roomRepository.create({
        ...roomData,
        organizationId: orgId,
      });
      const savedRoom = await queryRunner.manager.save(room);

      if (amenityIds && amenityIds.length > 0) {
        const roomAmenities = amenityIds.map((amenityId) => {
          return queryRunner.manager.create(RoomAmenity, {
            roomId: savedRoom.id,
            amenityId: amenityId,
          });
        });
        await queryRunner.manager.save(roomAmenities);
      }

      await queryRunner.commitTransaction();
      return {
        message: 'Tạo phòng thành công',
        data: savedRoom,
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException('Lỗi khi tạo phòng: ' + err.message);
    } finally {
      await queryRunner.release();
    }
  }

  async uploadPhotos(
    orgId: string,
    roomId: string,
    membership: OrganizationMember,
    files: Express.Multer.File[],
  ) {
    // 1. Kiểm tra quyền admin
    this.checkAdmin(membership, 'Bạn không có quyền upload ảnh');

    // 2. Kiểm tra room
    const room = await this.roomRepository.findOne({
      where: { id: roomId, organizationId: orgId },
    });
    if (!room) throw new BadRequestException('Phòng không tồn tại');

    // 3. Kiểm tra số lượng ảnh hiện tại (tối đa 5)
    const currentPhotosCount = await this.roomPhotoRepository.count({
      where: { roomId },
    });
    if (currentPhotosCount + files.length > 5) {
      throw new BadRequestException('Mỗi phòng chỉ được có tối đa 5 ảnh');
    }

    // 4. Upload từng file lên Cloudinary
    const uploadPromises = files.map(async (file, index) => {
      const result = await this.cloudinaryService.uploadFile(file);

      const roomPhoto = this.roomPhotoRepository.create({
        roomId,
        storageKey: result.public_id,
        sizeBytes: result.bytes,
        mimeType: result.format,
        position: currentPhotosCount + index,
        uploadedBy: membership.userId,
      });

      const savedPhoto = await this.roomPhotoRepository.save(roomPhoto);

      // 5. Trigger thumbnail generation (giả lập queue job)
      this.generateThumbnailBackground(savedPhoto.id, result.public_id);

      return {
        id: savedPhoto.id,
        url: result.secure_url,
        presignedUrl: this.cloudinaryService.generatePresignedUrl(
          result.public_id,
        ),
      };
    });

    const results = await Promise.all(uploadPromises);

    return {
      message: 'Upload ảnh thành công',
      data: results,
    };
  }

  private async generateThumbnailBackground(photoId: string, publicId: string) {
    // Giả lập background job (trong thực tế dùng Bull/BullMQ)
    setTimeout(async () => {
      // Cloudinary tự động tạo thumbnail qua transformation, ở đây ta chỉ cần lưu key
      const thumbnailKey = `w_256,h_256,c_fill/${publicId}`;
      await this.roomPhotoRepository.update(photoId, { thumbnailKey });
    }, 2000);
  }

  async findAll(orgId: string, amenities?: string) {
    const queryBuilder = this.roomRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.floor', 'floor')
      .leftJoinAndSelect('room.organization', 'organization')
      .leftJoinAndSelect('room.photos', 'photos')
      .where('room.organizationId = :orgId', { orgId });

    if (amenities) {
      const amenityNames = amenities.split(',').map((a) => a.trim());

      // AND logic: Phòng phải có TẤT CẢ các tiện ích này
      queryBuilder
        .innerJoin('room_amenities', 'ra', 'ra.room_id = room.id')
        .innerJoin('amenities', 'am', 'am.id = ra.amenity_id')
        .andWhere('am.name IN (:...amenityNames)', { amenityNames })
        .groupBy('room.id')
        .addGroupBy('floor.id')
        .addGroupBy('organization.id')
        .having('COUNT(DISTINCT am.name) = :count', {
          count: amenityNames.length,
        });
    }

    const rooms = await queryBuilder.getMany();

    // Map lại để lấy presigned URL cho ảnh
    return rooms.map((room) => ({
      ...room,
      photos: room.photos?.map((p) => ({
        ...p,
        url: this.cloudinaryService.generatePresignedUrl(p.storageKey),
      })),
    }));
  }

  async findAvailableRooms(orgId: string, dto: FindAvailableRoomsDto) {
    const { startTime, endTime, capacity, amenities } = dto;
    const range = `[${startTime}, ${endTime}]`;

    const queryBuilder = this.roomRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.floor', 'floor')
      .leftJoinAndSelect('room.photos', 'photos')
      .where('room.organizationId = :orgId', { orgId })
      .andWhere('room.isActive = true');

    if (capacity) {
      queryBuilder.andWhere('room.capacity >= :capacity', { capacity });
    }

    // 1. Loại bỏ các phòng đã có Booking trùng lịch (Overlap)
    queryBuilder.andWhere((qb) => {
      const subQuery = qb
        .subQuery()
        .select('1')
        .from(Booking, 'booking')
        .where('booking.roomId = room.id')
        .andWhere('booking.status IN (:...statuses)', {
          statuses: [BookingStatus.PENDING, BookingStatus.CONFIRMED],
        })
        .andWhere('booking.time_range && :range', { range })
        .getQuery();
      return `NOT EXISTS ${subQuery}`;
    });

    // 2. Loại bỏ các phòng đang bảo trì trùng lịch
    queryBuilder.andWhere((qb) => {
      const subQuery = qb
        .subQuery()
        .select('1')
        .from(MaintenanceBlock, 'mb')
        .where('mb.roomId = room.id')
        .andWhere('mb.time_range && :range', { range })
        .getQuery();
      return `NOT EXISTS ${subQuery}`;
    });

    // 3. Lọc theo tiện ích (AND logic) - Sử dụng Subquery để tránh lỗi GROUP BY với các bảng Join khác
    if (amenities) {
      const amenityNames = amenities.split(',').map((a) => a.trim());
      queryBuilder.andWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .select('ra.room_id')
          .from('room_amenities', 'ra')
          .innerJoin('amenities', 'am', 'am.id = ra.amenity_id')
          .where('am.name IN (:...amenityNames)', { amenityNames })
          .groupBy('ra.room_id')
          .having('COUNT(DISTINCT am.name) = :count', {
            count: amenityNames.length,
          })
          .getQuery();
        return `room.id IN ${subQuery}`;
      });
    }

    const rooms = await queryBuilder.getMany();

    // 4. Kiểm tra các quy tắc lặp lại (RRULE) của lịch bảo trì
    const recurringBlocks = await this.maintenanceBlockRepository.find({
      where: {
        room: { organizationId: orgId },
        rule: Not(IsNull()),
      },
    });

    const availableRooms = rooms.filter((room) => {
      const roomBlocks = recurringBlocks.filter((b) => b.roomId === room.id);
      
      for (const block of roomBlocks) {
        if (isRRuleOverlapping(block.rule, new Date(startTime), new Date(endTime))) {
          return false;
        }
      }
      return true;
    });

    // 5. Lấy thêm thông tin booking gần nhất cho mỗi phòng để hiển thị bối cảnh
    return Promise.all(
      availableRooms.map(async (room) => {
        const nearestBooking = await this.bookingRepository
          .createQueryBuilder('b')
          .where('b.roomId = :roomId', { roomId: room.id })
          .andWhere('b.status IN (:...statuses)', {
            statuses: [BookingStatus.CONFIRMED],
          })
          // Tìm booking có thời gian gần nhất với mốc bắt đầu yêu cầu
          .orderBy(
            'ABS(EXTRACT(EPOCH FROM (lower(b.time_range) - :start::timestamp)))',
            'ASC',
          )
          .setParameter('start', startTime)
          .limit(1)
          .getOne();

        return {
          ...room,
          nearestBooking,
          photos: room.photos?.map((p) => ({
            ...p,
            url: this.cloudinaryService.generatePresignedUrl(p.storageKey),
          })),
        };
      }),
    );
  }

  async update(
    orgId: string,
    roomId: string,
    membership: OrganizationMember,
    dto: UpdateRoomDto,
  ) {
    const { amenityIds, ...roomData } = dto;

    // 1. Kiểm tra quyền admin
    this.checkAdmin(membership, 'Bạn không có quyền chỉnh sửa phòng');

    // 2. Kiểm tra room tồn tại
    const room = await this.roomRepository.findOne({
      where: { id: roomId, organizationId: orgId },
    });
    if (!room) throw new BadRequestException('Phòng không tồn tại');

    // 3. Nếu có đổi floorId, kiểm tra floorId mới
    if (dto.floorId && dto.floorId !== room.floorId) {
      const floor = await this.floorRepository.findOne({
        where: { id: dto.floorId },
        relations: ['location'],
      });
      if (!floor || floor.location.organizationId !== orgId) {
        throw new BadRequestException(
          'Tầng mới không hợp lệ hoặc không thuộc tổ chức này',
        );
      }
    }

    // 4. Nếu đổi tên hoặc đổi tầng, kiểm tra trùng tên
    if (dto.name || dto.floorId) {
      const targetName = dto.name || room.name;
      const targetFloorId = dto.floorId || room.floorId;

      const existingRoom = await this.roomRepository.findOne({
        where: { floorId: targetFloorId, name: targetName },
      });

      if (existingRoom && existingRoom.id !== roomId) {
        throw new BadRequestException('Tên phòng đã tồn tại trong tầng này');
      }
    }

    // 5. Nếu có amenityIds, kiểm tra tính hợp lệ
    if (amenityIds && amenityIds.length > 0) {
      const amenitiesCount = await this.amenityRepository.count({
        where: { id: In(amenityIds), organizationId: orgId },
      });
      if (amenitiesCount !== amenityIds.length) {
        throw new BadRequestException('Một hoặc nhiều tiện ích không hợp lệ');
      }
    }

    // 6. Thực hiện update bằng transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      Object.assign(room, roomData);
      const updatedRoom = await queryRunner.manager.save(room);

      if (amenityIds !== undefined) {
        await queryRunner.manager.delete(RoomAmenity, { roomId });
        if (amenityIds.length > 0) {
          const roomAmenities = amenityIds.map((amenityId) => {
            return queryRunner.manager.create(RoomAmenity, {
              roomId,
              amenityId,
            });
          });
          await queryRunner.manager.save(roomAmenities);
        }
      }

      await queryRunner.commitTransaction();
      return {
        message: 'Cập nhật phòng thành công',
        data: updatedRoom,
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException('Lỗi khi cập nhật: ' + err.message);
    } finally {
      await queryRunner.release();
    }
  }

  async remove(orgId: string, roomId: string, membership: OrganizationMember) {
    // 1. Kiểm tra quyền admin
    this.checkAdmin(membership, 'Bạn không có quyền xóa phòng');

    // 2. Kiểm tra room tồn tại
    const room = await this.roomRepository.findOne({
      where: { id: roomId, organizationId: orgId },
    });
    if (!room) throw new BadRequestException('Phòng không tồn tại');

    // 3. Kiểm tra các booking tương lai
    const futureBookings = await this.bookingRepository
      .createQueryBuilder('booking')
      .where('booking.roomId = :roomId', { roomId })
      .andWhere('upper(booking.time_range) > NOW()')
      .andWhere('booking.status IN (:...statuses)', {
        statuses: [BookingStatus.PENDING, BookingStatus.CONFIRMED],
      })
      .getMany();

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (futureBookings.length > 0) {
        // Hủy tất cả booking tương lai
        await queryRunner.manager.update(
          Booking,
          { id: In(futureBookings.map((b) => b.id)) },
          {
            status: BookingStatus.CANCELLED,
            cancelReason: 'Phòng đã bị xóa khỏi hệ thống',
            cancelledBy: membership.userId,
            cancelledAt: new Date(),
          },
        );
      }

      // Xóa mềm phòng
      await queryRunner.manager.softRemove(room);

      await queryRunner.commitTransaction();
      return {
        message: 'Xóa phòng thành công',
        cancelledBookings: futureBookings.length,
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException('Lỗi khi xóa phòng: ' + err.message);
    } finally {
      await queryRunner.release();
    }
  }

  // Hàm tạo block bảo trì
  async createMaintenanceBlock(orgId: string, roomId: string, membership: OrganizationMember, dto: CreateMaintenanceBlockDto) {
    this.checkAdmin(membership, 'Bạn không có quyền tạo lịch bảo trì');

    const room = await this.roomRepository.findOne({
      where: { id: roomId, organizationId: orgId },
    });
    if (!room) throw new BadRequestException('Phòng không tồn tại');

    const block = this.maintenanceBlockRepository.create({
      ...dto,
      roomId,
      createdBy: membership.userId,
    });
    return this.maintenanceBlockRepository.save(block);
  }

  // Hàm lấy danh sách block của 1 phòng
  async findAllMaintenanceBlocks(orgId: string, roomId: string, membership: OrganizationMember) {
    this.checkAdmin(membership, 'Bạn không có quyền xem lịch bảo trì');

    return this.maintenanceBlockRepository.find({
      where: { roomId, room: { organizationId: orgId } },
      relations: ['creator'],
    });
  }

  // Hàm xóa lịch bảo trì
  async removeMaintenanceBlock(orgId: string, blockId: string, membership: OrganizationMember) {
    this.checkAdmin(membership, 'Bạn không có quyền xóa lịch bảo trì');

    const block = await this.maintenanceBlockRepository.findOne({
      where: { id: blockId, room: { organizationId: orgId } },
    });

    if (!block) {
      throw new BadRequestException('Lịch bảo trì không tồn tại hoặc không thuộc tổ chức này');
    }

    await this.maintenanceBlockRepository.remove(block);
    return { message: 'Xóa lịch bảo trì thành công' };
  }
}
