"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const AuthController_1 = __importDefault(require("../controllers/AuthController"));
const AdminAuthController_1 = __importDefault(require("../controllers/AdminAuthController"));
const UploadController_1 = __importDefault(require("../controllers/UploadController"));
const auth_1 = __importDefault(require("../middleware/auth"));
const role_1 = require("../middleware/role");
const router = express_1.default.Router();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
router.post('/register', AuthController_1.default.register);
router.post('/login', (req, res) => {
    console.log('POST /auth/login accessed');
    AuthController_1.default.login(req, res); // Call with 2 args
});
router.post('/admin/login', AdminAuthController_1.default.adminLogin);
router.get('/me', auth_1.default, AuthController_1.default.getCurrentUser);
router.put('/profile', auth_1.default, AuthController_1.default.updateProfile);
router.post('/upload/image', auth_1.default, upload.single('image'), UploadController_1.default.uploadFile);
router.post('/upload/audio', auth_1.default, upload.single('audio'), UploadController_1.default.uploadFile);
router.get('/users', auth_1.default, role_1.adminRoleMiddleware, AdminAuthController_1.default.getUsers);
router.get('/users/:id', auth_1.default, role_1.adminRoleMiddleware, AdminAuthController_1.default.getUserById);
exports.default = router;
