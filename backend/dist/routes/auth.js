"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// routes/authRoutes.ts
const express_1 = __importDefault(require("express"));
const AuthController_1 = __importDefault(require("../controllers/AuthController"));
const auth_1 = __importDefault(require("../middleware/auth"));
const router = express_1.default.Router();
router.post('/register', AuthController_1.default.register);
router.post('/login', (req, res) => {
    AuthController_1.default.login(req, res);
});
router.get('/me', auth_1.default, AuthController_1.default.getCurrentUser);
router.put('/profile', auth_1.default, AuthController_1.default.updateProfile);
exports.default = router;
