"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multer_1 = __importDefault(require("multer"));
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // Limit file size to 5MB
    },
    fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/') && !file.mimetype.startsWith('audio/')) {
            return cb(new Error('Only image and audio files are allowed'));
        }
        cb(null, true);
    },
});
exports.default = upload.single('file'); // Use a generic field name
