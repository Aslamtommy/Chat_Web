import { v2 as cloudinary } from 'cloudinary';
import { createHash } from 'crypto';
import { UploadApiOptions } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

console.log('Cloudinary Config:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET ? 'Loaded' : 'Missing',
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

class StorageService {
  // For HTTP/Multer uploads (existing method)
  async uploadFile(file: Express.Multer.File, type: 'image' | 'audio'): Promise<string> {
    try {
      if (!file || !file.buffer) {
        throw new Error('No file or file buffer provided');
      }
      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        throw new Error('Cloudinary configuration is missing');
      }

      const timestamp = Math.floor(Date.now() / 1000);
      const publicId = `${timestamp}-${file.originalname}`;
      const folder = type === 'image' ? 'arabic-jyothisham' : 'arabic-jyothisham/audio';

      const paramsToSign = {
        folder,
        public_id: publicId,
        timestamp,
      };
      const sortedParams = Object.keys(paramsToSign)
        .sort()
        .map((key) => `${key}=${paramsToSign[key as keyof typeof paramsToSign]}`)
        .join('&');
      const stringToSign = `${sortedParams}${process.env.CLOUDINARY_API_SECRET}`;
      const signature = createHash('sha1').update(stringToSign).digest('hex');

      const uploadParams: UploadApiOptions = {
        folder,
        public_id: publicId,
        timestamp,
        signature,
        api_key: process.env.CLOUDINARY_API_KEY,
        resource_type: type === 'image' ? 'image' : 'video', // Audio as 'video' in Cloudinary
      };

      console.log('Upload Parameters (HTTP):', uploadParams);

      const result = await new Promise<string>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          uploadParams,
          (error, result) => {
            if (error) {
              console.error('Cloudinary Upload Error:', error);
              return reject(error);
            }
            if (!result?.secure_url) {
              return reject(new Error('No secure URL returned from Cloudinary'));
            }
            resolve(result.secure_url);
          }
        );
        uploadStream.end(file.buffer);
      });

      return result;
    } catch (error) {
      console.error('Upload failed (HTTP):', error);
      throw new Error(`Failed to upload ${type} to Cloudinary: ${(error as Error).message}`);
    }
  }

  // New method for Socket.IO uploads (Buffer input)
  async uploadFileFromSocket(file: Buffer, type: 'image' | 'audio'): Promise<string> {
    try {
      if (!file || !(file instanceof Buffer)) {
        throw new Error('No file buffer provided or invalid format');
      }
      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        throw new Error('Cloudinary configuration is missing');
      }

      const timestamp = Math.floor(Date.now() / 1000);
      const publicId = `${timestamp}-${Math.random().toString(36).substring(2)}`;
      const folder = type === 'image' ? 'arabic-jyothisham' : 'arabic-jyothisham/audio';

      const paramsToSign = {
        folder,
        public_id: publicId,
        timestamp,
      };
      const sortedParams = Object.keys(paramsToSign)
        .sort()
        .map((key) => `${key}=${paramsToSign[key as keyof typeof paramsToSign]}`)
        .join('&');
      const stringToSign = `${sortedParams}${process.env.CLOUDINARY_API_SECRET}`;
      const signature = createHash('sha1').update(stringToSign).digest('hex');

      const uploadParams: UploadApiOptions = {
        folder,
        public_id: publicId,
        timestamp,
        signature,
        api_key: process.env.CLOUDINARY_API_KEY,
        resource_type: type === 'image' ? 'image' : 'video',
      };

      console.log('Upload Parameters (Socket.IO):', uploadParams);

      const result = await new Promise<string>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          uploadParams,
          (error, result) => {
            if (error) {
              console.error('Cloudinary Upload Error (Socket.IO):', error);
              return reject(error);
            }
            if (!result?.secure_url) {
              return reject(new Error('No secure URL returned from Cloudinary'));
            }
            resolve(result.secure_url);
          }
        );
        uploadStream.end(file);
      });

      return result;
    } catch (error) {
      console.error('Upload failed (Socket.IO):', error);
      throw new Error(`Failed to upload ${type} to Cloudinary via Socket.IO: ${(error as Error).message}`);
    }
  }
}

export default new StorageService();