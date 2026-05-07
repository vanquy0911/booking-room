import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as dotenv from 'dotenv';
// import * as cookieParser from 'cookie-parser';
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // app.use(cookieParser()); // Kích hoạt đọc Cookie từ Request

  const config = new DocumentBuilder()
    .setTitle('Booking Room API')
    .setDescription('Booking Room API')
    .setVersion('1.0')
    .addTag('booking-room')
    .addBearerAuth() // Kích hoạt nút Authorize trên Swagger
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
