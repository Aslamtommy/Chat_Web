"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUserId = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const validateUserId = (req, res, next) => {
    const userId = req.params.userId;
    if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ success: false, error: 'Invalid user ID' });
    }
    next();
};
exports.validateUserId = validateUserId;
