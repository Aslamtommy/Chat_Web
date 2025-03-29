"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const UserChatController_1 = __importDefault(require("../controllers/UserChatController"));
const auth_1 = __importDefault(require("../middleware/auth"));
const upload_1 = __importDefault(require("../middleware/upload")); // Import the multer middleware
const router = express_1.default.Router();
router.get('/history', auth_1.default, UserChatController_1.default.getMyChatHistory);
router.post('/message', auth_1.default, upload_1.default, UserChatController_1.default.sendMessageToMyChat);
exports.default = router;
