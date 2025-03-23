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
  async uploadFile(file: Express.Multer.File, type: 'image' | 'audio'): Promise<string> {
    try {
      if (!file || !file.buffer) {
        throw new Error('No file or file buffer provided');
      }
      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        throw new Error('Cloudinary configuration is missing');
      }

      const timestamp = Math.floor(Date.now() / 1000); // Current timestamp in seconds
      const publicId = `${timestamp}-${file.originalname}`;
      const folder = type === 'image' ? 'arabic-jyothisham' : 'arabic-jyothisham/audio';

      // Corrected string to sign: key=value pairs separated by &, followed by API secret
      const stringToSign = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${process.env.CLOUDINARY_API_SECRET}`;
      const signature = createHash('sha1').update(stringToSign).digest('hex');

      const uploadParams: UploadApiOptions = {
        folder,
        public_id: publicId,
        timestamp,
        api_key: process.env.CLOUDINARY_API_KEY,
        signature,
        resource_type: type === 'image' ? 'image' : 'video', // Audio files are treated as 'video' in Cloudinary
      };

      console.log('Upload Parameters:', uploadParams);

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
      console.error('Upload failed:', error);
      throw new Error(`Failed to upload ${type} to Cloudinary: ${(error as Error).message}`);
    }
  }
}

export default new StorageService();