"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// routes/uploadRoutes.ts
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const UploadController_1 = __importDefault(require("../controllers/UploadController"));
const auth_1 = __importDefault(require("../middleware/auth"));
const router = express_1.default.Router();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
router.post('/image', auth_1.default, upload.single('file'), UploadController_1.default.uploadFile);
router.post('/audio', auth_1.default, upload.single('file'), UploadController_1.default.uploadFile);
exports.default = router;
