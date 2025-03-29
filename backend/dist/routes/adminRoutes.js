"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const AdminAuthController_1 = __importDefault(require("../controllers/AdminAuthController"));
const AdminChatController_1 = __importDefault(require("../controllers/AdminChatController"));
const auth_1 = __importDefault(require("../middleware/auth"));
const role_1 = require("../middleware/role");
const validateUserId_1 = require("../middleware/validateUserId");
const upload_1 = __importDefault(require("../middleware/upload")); // Import the multer middleware
const router = express_1.default.Router();
router.post('/auth/login', AdminAuthController_1.default.adminLogin);
router.get('/users', auth_1.default, role_1.adminRoleMiddleware, AdminAuthController_1.default.getUsers);
router.get('/users/:id', auth_1.default, role_1.adminRoleMiddleware, AdminAuthController_1.default.getUserById);
router.get('/chats', auth_1.default, role_1.adminRoleMiddleware, AdminChatController_1.default.getAllChats);
router.get('/chats/user/:userId', auth_1.default, role_1.adminRoleMiddleware, validateUserId_1.validateUserId, AdminChatController_1.default.getUserChatHistory);
router.post('/chats/user/:userId/message', auth_1.default, role_1.adminRoleMiddleware, validateUserId_1.validateUserId, upload_1.default, AdminChatController_1.default.sendMessageToUserChat);
exports.default = router;
