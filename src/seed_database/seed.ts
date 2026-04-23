// src/seed_database/seed.ts
import { DataSource } from 'typeorm';
import { User, Role } from '../modules/user/entities/user.entity';
import { UserIdentity } from '../modules/user/entities/user_identity.entity'; // Import thêm
import { RefreshToken } from '../modules/auth/entities/auth.entity'; // Import thêm
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // CẦN THÊM TẤT CẢ ENTITY LIÊN QUAN VÀO ĐÂY
  entities: [User, UserIdentity, RefreshToken],
  synchronize: false,
});

// ... phần code runSeed bên dưới giữ nguyên
async function runSeed() {
  try {
    await AppDataSource.initialize();
    console.log('🚀 Đang kết nối database để seed...');

    const userRepository = AppDataSource.getRepository(User);

    const adminEmail = 'admin@example.com';
    const existingAdmin = await userRepository.findOne({
      where: { email: adminEmail },
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('AdminPassword123!', 10);
      const admin = userRepository.create({
        email: adminEmail,
        password: hashedPassword,
        fullName: 'Super Administrator',
        role: Role.ADMIN,
        avatarUrl: '',
      });

      await userRepository.save(admin);
      console.log(
        '✅ Đã tạo tài khoản Admin: admin@example.com / AdminPassword123!',
      );
    } else {
      console.log('ℹ️ Tài khoản Admin đã tồn tại, bỏ qua.');
    }

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Lỗi khi seed data:', error);
    process.exit(1);
  }
}

runSeed();
