"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cloudinary_1 = require("cloudinary");
const crypto_1 = require("crypto");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
console.log('Cloudinary Config:', {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET ? 'Loaded' : 'Missing',
});
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
class StorageService {
    // For HTTP/Multer uploads (existing method)
    async uploadFile(file, type) {
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
                .map((key) => `${key}=${paramsToSign[key]}`)
                .join('&');
            const stringToSign = `${sortedParams}${process.env.CLOUDINARY_API_SECRET}`;
            const signature = (0, crypto_1.createHash)('sha1').update(stringToSign).digest('hex');
            const uploadParams = {
                folder,
                public_id: publicId,
                timestamp,
                signature,
                api_key: process.env.CLOUDINARY_API_KEY,
                resource_type: type === 'image' ? 'image' : 'video', // Audio as 'video' in Cloudinary
            };
            console.log('Upload Parameters (HTTP):', uploadParams);
            const result = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary_1.v2.uploader.upload_stream(uploadParams, (error, result) => {
                    if (error) {
                        console.error('Cloudinary Upload Error:', error);
                        return reject(error);
                    }
                    if (!result?.secure_url) {
                        return reject(new Error('No secure URL returned from Cloudinary'));
                    }
                    resolve(result.secure_url);
                });
                uploadStream.end(file.buffer);
            });
            return result;
        }
        catch (error) {
            console.error('Upload failed (HTTP):', error);
            throw new Error(`Failed to upload ${type} to Cloudinary: ${error.message}`);
        }
    }
    // New method for Socket.IO uploads (Buffer input)
    async uploadFileFromSocket(file, type) {
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
                .map((key) => `${key}=${paramsToSign[key]}`)
                .join('&');
            const stringToSign = `${sortedParams}${process.env.CLOUDINARY_API_SECRET}`;
            const signature = (0, crypto_1.createHash)('sha1').update(stringToSign).digest('hex');
            const uploadParams = {
                folder,
                public_id: publicId,
                timestamp,
                signature,
                api_key: process.env.CLOUDINARY_API_KEY,
                resource_type: type === 'image' ? 'image' : 'video',
            };
            console.log('Upload Parameters (Socket.IO):', uploadParams);
            const result = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary_1.v2.uploader.upload_stream(uploadParams, (error, result) => {
                    if (error) {
                        console.error('Cloudinary Upload Error (Socket.IO):', error);
                        return reject(error);
                    }
                    if (!result?.secure_url) {
                        return reject(new Error('No secure URL returned from Cloudinary'));
                    }
                    resolve(result.secure_url);
                });
                uploadStream.end(file);
            });
            return result;
        }
        catch (error) {
            console.error('Upload failed (Socket.IO):', error);
            throw new Error(`Failed to upload ${type} to Cloudinary via Socket.IO: ${error.message}`);
        }
    }
}
exports.default = new StorageService();
