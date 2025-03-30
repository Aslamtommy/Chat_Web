"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_1 = __importDefault(require("./routes/auth"));
const chat_1 = __importDefault(require("./routes/chat"));
const upload_1 = __importDefault(require("./routes/upload"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const ChatService_1 = __importDefault(require("./services/ChatService"));
const dotenv_1 = __importDefault(require("dotenv"));
const ChatRepository_1 = __importDefault(require("./repositories/ChatRepository"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const FRONTEND_URL = process.env.FRONTEND_URL;
const io = new socket_io_1.Server(server, {
    cors: {
        origin: FRONTEND_URL,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    },
});
exports.io = io;
app.use((0, cors_1.default)({
    origin: FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use('/auth', auth_1.default);
app.use('/chat', chat_1.default);
app.use('/upload', upload_1.default);
app.use('/admin', adminRoutes_1.default);
app.get('/', (req, res) => {
    res.send('Backend is running');
});
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
if (!mongoUri) {
    console.error('Error: MONGODB_URI is not defined in environment variables');
    process.exit(1);
}
mongoose_1.default.connect(mongoUri)
    .then(() => console.log('MongoDB connected'))
    .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token)
        return next(new Error('Authentication error: No token provided'));
    try {
        const decoded = jsonwebtoken_1.default.verify(token, 'mysecret');
        socket.data.user = decoded;
        next();
    }
    catch (error) {
        next(new Error('Authentication error: Invalid token'));
    }
});
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.data.user.id} (${socket.data.user.role})`);
    const userId = socket.data.user.id;
    const isAdmin = socket.data.user.role === 'admin';
    socket.join(userId);
    if (isAdmin) {
        socket.join('admin-room');
        console.log(`Admin ${userId} joined admin-room`);
        console.log(`Triggering initial sync for admin ${userId}`);
        socket.emit('requestSyncUnreadCounts');
    }
    if (isAdmin) {
        socket.on('syncUnreadCounts', async () => {
            try {
                console.log(`Syncing unread counts for admin ${userId}`);
                const allUsers = await mongoose_1.default.model('User').find({ role: 'user' });
                const unreadCounts = {};
                for (const user of allUsers) {
                    const uid = user._id.toString();
                    const count = await ChatRepository_1.default.getUnreadCount(uid);
                    unreadCounts[uid] = count;
                    console.log(`Calculated unread count for ${uid}: ${count}`);
                }
                console.log('Sending initial unread counts on sync:', unreadCounts);
                socket.emit('initialUnreadCounts', unreadCounts);
            }
            catch (error) {
                console.error('Error syncing unread counts:', error);
            }
        });
    }
    socket.on('markMessagesAsRead', async ({ chatId }) => {
        try {
            if (!isAdmin) {
                console.log(`Non-admin ${userId} attempted to mark messages as read`);
                return;
            }
            console.log(`Received markMessagesAsRead event for chat ${chatId} by admin ${userId}`);
            await ChatRepository_1.default.markMessagesAsRead(chatId, userId);
            const unreadCount = await ChatRepository_1.default.getUnreadCount(chatId);
            console.log(`Updated unread count for ${chatId} after markMessagesAsRead: ${unreadCount}`);
            io.to('admin-room').emit('updateUnreadCount', {
                userId: chatId,
                unreadCount,
            });
            io.to(chatId).emit('messagesRead', {
                chatId,
                readBy: userId,
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            console.error('Error marking messages as read:', error);
        }
    });
    socket.on('sendMessage', async ({ targetUserId, messageType, content, tempId }, ack) => {
        try {
            const senderId = socket.data.user.id;
            const senderRole = socket.data.user.role;
            if (!['text', 'image', 'voice'].includes(messageType)) {
                throw new Error('Invalid message type');
            }
            let recipientId = targetUserId;
            if (!recipientId && !isAdmin) {
                const admin = await mongoose_1.default.model('User').findOne({ role: 'admin' });
                if (!admin)
                    throw new Error('No admin available');
                recipientId = admin._id.toString();
            }
            const chatThreadId = isAdmin ? targetUserId : senderId;
            console.log(`Message from ${senderId} (${isAdmin ? 'admin' : 'user'}) to ${recipientId}`);
            // Only check for duplicates for text messages
            if (messageType === 'text') {
                const existingMessage = await ChatRepository_1.default.findMessageByContent(chatThreadId, content);
                if (existingMessage) {
                    console.log(`Duplicate message detected for chat ${chatThreadId}: ${content}`);
                    socket.emit('messageError', { tempId, error: 'Duplicate message detected' });
                    return ack?.({ status: 'error', error: 'Duplicate message' });
                }
            }
            const updatedChat = await ChatService_1.default.saveMessage(chatThreadId, senderId, messageType, content);
            const newMessage = updatedChat.messages[updatedChat.messages.length - 1];
            if (!newMessage._id) {
                console.log('Message not saved properly');
                return ack?.({ status: 'error', error: 'Message not saved' });
            }
            const messagePayload = {
                _id: newMessage._id.toString(),
                chatId: updatedChat._id.toString(),
                senderId,
                content: newMessage.content,
                messageType: newMessage.message_type,
                timestamp: newMessage.timestamp,
                status: 'delivered',
                isAdmin: isAdmin,
                read: false,
            };
            // Emit to all relevant parties
            if (isAdmin) {
                io.to(targetUserId).emit('newMessage', messagePayload);
            }
            else {
                io.to('admin-room').emit('newMessage', messagePayload);
            }
            // Send delivery confirmation to sender
            socket.emit('messageDelivered', messagePayload);
            // Update unread counts if needed
            if (!isAdmin) {
                const unreadCount = await ChatRepository_1.default.getUnreadCount(senderId);
                io.to('admin-room').emit('updateUnreadCount', {
                    userId: senderId,
                    unreadCount,
                });
            }
            ack?.({ status: 'success', message: messagePayload });
        }
        catch (error) {
            console.error('Message sending error:', error);
            socket.emit('messageError', { tempId, error: error.message });
            ack?.({ status: 'error', error: error.message });
        }
    });
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${userId}`);
        if (isAdmin) {
            console.log(`Admin ${userId} left admin-room`);
        }
    });
});
const port = process.env.PORT || 5000;
server.listen(port, () => {
    console.log(`Server started on port ${port} with HTTP and Socket.IO`);
});
exports.default = app;
