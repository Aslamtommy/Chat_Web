import { Request, Response } from 'express';
import StorageService from '../services/StorageService';

class UploadController {
  async uploadFile(req: Request, res: Response): Promise<void> {
    try {
      const file = req.file as Express.Multer.File | undefined;
      if (!file) {
        throw new Error('No file uploaded');
      }

      // Determine the upload type based on the route
      const uploadType = req.path.includes('image') ? 'image' : 'audio';
      const url = await StorageService.uploadFile(file, uploadType);

      res.status(200).json({ success: true, data: { url } });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(400).json({ success: false, error: (error as Error).message });
    }
  }
}

export default new UploadController();