"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// routes/authRoutes.ts
const express_1 = __importDefault(require("express"));
const AuthController_1 = __importDefault(require("../controllers/AuthController"));
const auth_1 = __importDefault(require("../middleware/auth"));
const PaymentController_1 = __importDefault(require("../controllers/PaymentController"));
const multer_1 = __importDefault(require("multer"));
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
const router = express_1.default.Router();
router.post('/register', AuthController_1.default.register);
router.post('/login', (req, res) => {
    AuthController_1.default.login(req, res);
});
router.get('/me', auth_1.default, AuthController_1.default.getCurrentUser);
router.put('/profile', auth_1.default, AuthController_1.default.updateProfile);
router.post('/finalize-registration', AuthController_1.default.finalizeRegistration);
// Cashfree payment route
router.post('/create-order', PaymentController_1.default.createOrder);
router.get('/payment-requests', auth_1.default, PaymentController_1.default.getUserPaymentRequests);
router.post('/payment-request/:id/upload', auth_1.default, upload.single('file'), PaymentController_1.default.uploadScreenshot);
exports.default = router;
