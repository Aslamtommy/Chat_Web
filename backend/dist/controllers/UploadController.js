"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const StorageService_1 = __importDefault(require("../services/StorageService"));
class UploadController {
    async uploadFile(req, res) {
        try {
            const file = req.file;
            if (!file) {
                throw new Error('No file uploaded');
            }
            // Determine the upload type based on the route
            const uploadType = req.path.includes('image') ? 'image' : 'audio';
            const url = await StorageService_1.default.uploadFile(file, uploadType);
            res.status(200).json({ success: true, data: { url } });
        }
        catch (error) {
            console.error('Upload error:', error);
            res.status(400).json({ success: false, error: error.message });
        }
    }
}
exports.default = new UploadController();
