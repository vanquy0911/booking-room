import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  In,
  IsNull,
  MoreThan,
  MoreThanOrEqual,
  Not,
  Repository,
} from 'typeorm';
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
  ) {}

  private async getMembership(orgId: string, userId: string) {
    const membership = await this.organizationMemberRepository.findOne({
      where: { organizationId: orgId, userId },
    });

    if (!membership) {
      throw new ForbiddenException('Bạn không thuộc về tổ chức này');
    }

    return membership;
  }

  private checkAdmin(
    membership: OrganizationMember,
    errorMessage = 'Bạn không có quyền thực hiện thao tác này',
  ) {
    if (membership.role !== 'admin') {
      throw new ForbiddenException(errorMessage);
    }
  }

  async create(orgId: string, userId: string, dto: CreateRoomDto) {
    const membership = await this.getMembership(orgId, userId);
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
        'Floor không tồn tại hoặc không thuộc organization này',
      );
    }

    // Kiểm tra trùng tên phòng trong cùng floor
    const existingRoom = await this.roomRepository.findOne({
      where: {
        organizationId: orgId,
        floorId: dto.floorId,
        name: dto.name,
      },
    });

    if (existingRoom) {
      throw new ConflictException(
        `Phòng với tên "${dto.name}" đã tồn tại trong tầng này`,
      );
    }

    // 3. Tạo room
    const room = this.roomRepository.create({
      ...roomData,
      organizationId: orgId,
    });

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const savedRoom = await queryRunner.manager.save(room);

      // 4. Gắn tiện ích
      if (amenityIds && amenityIds.length > 0) {
        const roomAmenities = amenityIds.map((amenityId) => {
          return queryRunner.manager.create(RoomAmenity, {
            roomId: savedRoom.id,
            amenityId,
          });
        });
        await queryRunner.manager.save(roomAmenities);
      }

      await queryRunner.commitTransaction();
      return savedRoom;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(orgId: string, amenities?: string) {
    const queryBuilder = this.roomRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.floor', 'floor')
      .leftJoinAndSelect('floor.location', 'location')
      .leftJoinAndSelect('room.roomAmenities', 'roomAmenities')
      .leftJoinAndSelect('roomAmenities.amenity', 'amenity')
      .leftJoinAndSelect('room.photos', 'photos')
      .where('room.organizationId = :orgId', { orgId });

    if (amenities) {
      const amenityNames = amenities.split(',').map((a) => a.trim());
      queryBuilder.andWhere('amenity.name IN (:...amenityNames)', {
        amenityNames,
      });
    }

    return queryBuilder.getMany();
  }

  async findAvailableRooms(orgId: string, dto: FindAvailableRoomsDto) {
    const { startTime, endTime, capacity = 0 } = dto;

    // 1. Lấy tất cả phòng trong org thỏa mãn capacity
    const rooms = await this.roomRepository.find({
      where: {
        organizationId: orgId,
        isActive: true,
        capacity: MoreThanOrEqual(capacity),
      },
      relations: [
        'floor',
        'floor.location',
        'roomAmenities',
        'roomAmenities.amenity',
        'photos',
      ],
    });

    // 2. Lấy danh sách booking overlap
    const overlappingBookings = await this.bookingRepository
      .createQueryBuilder('booking')
      .where('booking.organizationId = :orgId', { orgId })
      .andWhere('booking.status NOT IN (:...statuses)', {
        statuses: [BookingStatus.CANCELLED, BookingStatus.REJECTED],
      })
      .andWhere("booking.timeRange && tstzrange(:startTime, :endTime, '[]')", {
        startTime,
        endTime,
      })
      .getMany();

    const bookedRoomIds = overlappingBookings.map((b) => b.roomId);

    // 3. Lấy danh sách maintenance blocks overlap
    const overlappingMaintenance = await this.maintenanceBlockRepository
      .createQueryBuilder('block')
      .where("block.timeRange && tstzrange(:startTime, :endTime, '[]')", {
        startTime,
        endTime,
      })
      .getMany();

    const maintenanceRoomIds = overlappingMaintenance.map((m) => m.roomId);

    // 4. Filter
    return rooms.filter(
      (room) =>
        !bookedRoomIds.includes(room.id) &&
        !maintenanceRoomIds.includes(room.id),
    );
  }

  async uploadPhotos(
    orgId: string,
    roomId: string,
    userId: string,
    files: Express.Multer.File[],
  ) {
    const membership = await this.getMembership(orgId, userId);
    this.checkAdmin(membership, 'Bạn không có quyền upload ảnh');

    const room = await this.roomRepository.findOne({
      where: { id: roomId, organizationId: orgId },
      relations: ['photos'],
    });

    if (!room) throw new BadRequestException('Phòng không tồn tại');
    if (room.photos.length + files.length > 5) {
      throw new BadRequestException('Tối đa 5 ảnh cho mỗi phòng');
    }

    const uploadPromises = files.map((file) =>
      this.cloudinaryService.uploadFile(file, 'rooms'),
    );
    const uploadResults = await Promise.all(uploadPromises);

    const roomPhotos = uploadResults.map((res) =>
      this.roomPhotoRepository.create({
        roomId: room.id,
        storageKey: res.secure_url || res.url,
        sizeBytes: res.bytes,
        mimeType: res.resource_type + '/' + res.format,
        uploadedBy: userId,
      }),
    );

    return this.roomPhotoRepository.save(roomPhotos);
  }

  async update(
    orgId: string,
    roomId: string,
    userId: string,
    dto: UpdateRoomDto,
  ) {
    const membership = await this.getMembership(orgId, userId);
    this.checkAdmin(membership, 'Bạn không có quyền cập nhật phòng');

    const room = await this.roomRepository.findOne({
      where: { id: roomId, organizationId: orgId },
    });

    if (!room) throw new BadRequestException('Phòng không tồn tại');

    const { amenityIds, ...roomData } = dto;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Update room info
      await queryRunner.manager.update(Room, roomId, roomData);

      // Update amenities if provided
      if (amenityIds) {
        await queryRunner.manager.delete(RoomAmenity, { roomId });
        const roomAmenities = amenityIds.map((amenityId) =>
          queryRunner.manager.create(RoomAmenity, {
            roomId,
            amenityId,
          }),
        );
        await queryRunner.manager.save(roomAmenities);
      }

      await queryRunner.commitTransaction();
      return this.roomRepository.findOne({
        where: { id: roomId },
        relations: ['roomAmenities', 'roomAmenities.amenity'],
      });
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async remove(orgId: string, roomId: string, userId: string) {
    const membership = await this.getMembership(orgId, userId);
    this.checkAdmin(membership, 'Bạn không có quyền xóa phòng');

    const room = await this.roomRepository.findOne({
      where: { id: roomId, organizationId: orgId },
    });

    if (!room) throw new BadRequestException('Phòng không tồn tại');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Soft cancel all future bookings
      await queryRunner.manager.update(
        Booking,
        {
          roomId,
          status: In([BookingStatus.PENDING, BookingStatus.CONFIRMED]),
        },
        {
          status: BookingStatus.CANCELLED,
          cancelReason: 'Phòng đã bị xóa khỏi hệ thống',
          cancelledAt: new Date(),
          cancelledBy: userId,
        },
      );

      // Soft delete room
      await queryRunner.manager.softDelete(Room, roomId);

      await queryRunner.commitTransaction();
      return { message: 'Xóa phòng thành công' };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async createMaintenanceBlock(
    orgId: string,
    roomId: string,
    userId: string,
    dto: CreateMaintenanceBlockDto,
  ) {
    const membership = await this.getMembership(orgId, userId);
    this.checkAdmin(membership, 'Bạn không có quyền tạo lịch bảo trì');

    const room = await this.roomRepository.findOne({
      where: { id: roomId, organizationId: orgId },
    });

    if (!room) throw new BadRequestException('Phòng không tồn tại');

    const { startTime, endTime, reason } = dto;

    const block = this.maintenanceBlockRepository.create({
      roomId,
      timeRange: `[${startTime}, ${endTime}]`,
      reason,
    });

    return this.maintenanceBlockRepository.save(block);
  }

  async findAllMaintenanceBlocks(
    orgId: string,
    roomId: string,
    userId: string,
  ) {
    const membership = await this.getMembership(orgId, userId);
    this.checkAdmin(membership, 'Bạn không có quyền xem lịch bảo trì');

    return this.maintenanceBlockRepository.find({
      where: { roomId },
      order: { createdAt: 'DESC' },
    });
  }

  async removeMaintenanceBlock(orgId: string, blockId: string, userId: string) {
    const membership = await this.getMembership(orgId, userId);
    this.checkAdmin(membership, 'Bạn không có quyền xóa lịch bảo trì');

    const block = await this.maintenanceBlockRepository.findOne({
      where: { id: blockId },
    });

    if (!block) throw new BadRequestException('Block bảo trì không tồn tại');

    await this.maintenanceBlockRepository.delete(blockId);
    return { message: 'Xóa lịch bảo trì thành công' };
  }
}
