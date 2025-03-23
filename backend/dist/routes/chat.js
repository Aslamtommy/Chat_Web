"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const UserChatController_1 = __importDefault(require("../controllers/UserChatController"));
const AdminChatController_1 = __importDefault(require("../controllers/AdminChatController"));
const auth_1 = __importDefault(require("../middleware/auth"));
const role_1 = require("../middleware/role");
const router = express_1.default.Router();
// User-specific chat routes
router.get('/history', auth_1.default, UserChatController_1.default.getMyChatHistory);
router.post('/message', auth_1.default, UserChatController_1.default.sendMessageToMyChat);
// Admin-specific chat routes
router.get('/all', auth_1.default, role_1.adminRoleMiddleware, AdminChatController_1.default.getAllChats);
router.get('/user/:userId/history', auth_1.default, role_1.adminRoleMiddleware, AdminChatController_1.default.getUserChatHistory);
router.post('/user/:userId/message', auth_1.default, role_1.adminRoleMiddleware, AdminChatController_1.default.sendMessageToUserChat);
exports.default = router;
