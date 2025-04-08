"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const UserChatController_1 = __importDefault(require("../controllers/UserChatController"));
const auth_1 = __importDefault(require("../middleware/auth"));
const upload_1 = __importDefault(require("../middleware/upload"));
const isMessageSender_1 = __importDefault(require("../middleware/isMessageSender")); // Import the new middleware
const ChatService_1 = __importDefault(require("../services/ChatService"));
const router = express_1.default.Router();
router.get('/history', auth_1.default, UserChatController_1.default.getMyChatHistory);
router.post('/message', auth_1.default, upload_1.default, UserChatController_1.default.sendMessageToMyChat);
// Add edit and delete routes
router.put('/message/:messageId', auth_1.default, isMessageSender_1.default, async (req, res) => {
    try {
        const { messageId } = req.params;
        const { content } = req.body;
        if (!content)
            throw new Error('Content is required');
        const updatedMessage = await ChatService_1.default.editMessage(messageId, content);
        res.json({ success: true, data: updatedMessage });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
router.delete('/message/:messageId', auth_1.default, isMessageSender_1.default, async (req, res) => {
    try {
        const { messageId } = req.params;
        await ChatService_1.default.deleteMessage(messageId);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
exports.default = router;
