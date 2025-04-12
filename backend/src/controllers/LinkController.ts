// controllers/LinkController.ts
import { Request, Response } from 'express';
import Link from '../models/Link';
import { io } from '../server';

class LinkController {
  async getLinks(req: Request, res: Response): Promise<void> {
    try {
      const links = await Link.find().sort({ createdAt: -1 });
      res.json({ success: true, data: links });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  async createLink(req: Request, res: Response): Promise<void> {
    try {
      const { title, url } = req.body;
      if (!title || !url) {
        res.status(400).json({ success: false, error: 'Title and URL are required' });
        return;
      }
      const link = await Link.create({ title, url });
      io.emit('linkUpdated', { action: 'create', link }); // Broadcast to all clients
      res.status(201).json({ success: true, data: link });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  async updateLink(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { title, url } = req.body;
      if (!title || !url) {
        res.status(400).json({ success: false, error: 'Title and URL are required' });
        return;
      }
      const link = await Link.findByIdAndUpdate(id, { title, url }, { new: true });
      if (!link) {
        res.status(404).json({ success: false, error: 'Link not found' });
        return;
      }
      io.emit('linkUpdated', { action: 'update', link }); // Broadcast update
      res.json({ success: true, data: link });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }

  async deleteLink(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const link = await Link.findByIdAndDelete(id);
      if (!link) {
        res.status(404).json({ success: false, error: 'Link not found' });
        return;
      }
      io.emit('linkUpdated', { action: 'delete', linkId: id }); // Broadcast deletion
      res.json({ success: true, message: 'Link deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  }
}

export default new LinkController();