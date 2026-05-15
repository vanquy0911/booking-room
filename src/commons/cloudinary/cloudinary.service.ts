import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import * as streamifier from 'streamifier';

@Injectable()
export class CloudinaryService {
  async uploadFile(file: Express.Multer.File, folder = 'booking_room'): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
        },
        (error, result) => {
          if (error) return reject(error);
          if (!result) {
            return reject(new Error('Cloudinary upload failed: No result received'));
          }
          resolve(result);
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }
  generatePresignedUrl(publicId: string): string {
    return cloudinary.url(publicId, {
      sign_url: true,
      secure: true,
      expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    });
  }
}
