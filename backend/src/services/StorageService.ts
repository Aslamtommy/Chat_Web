import AWS from 'aws-sdk';
import { Multer } from 'multer';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
});

class StorageService {
  async uploadImage(file: Express.Multer.File): Promise<string> {
    const params = {
      Bucket: process.env.S3_BUCKET as string,
      Key: `${Date.now()}-${file.originalname}`,
      Body: file.buffer,
      ACL: 'public-read',
    };
    const { Location } = await s3.upload(params).promise();
    return Location;
  }
}

export default new StorageService();