import { Request, Response } from 'express';
import StorageService from '../services/StorageService';

class UploadController {
  async uploadImage(req: Request, res: Response): Promise<void> {
    try {
      const file = req.file as Express.Multer.File;
      if (!file) throw new Error('No file uploaded');
      const url = await StorageService.uploadImage(file);
      res.json({ url });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
}

export default new UploadController();