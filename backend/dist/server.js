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
const StorageService_1 = __importDefault(require("./services/StorageService"));
const dotenv_1 = __importDefault(require("dotenv"));
const ChatRepository_1 = __importDefault(require("./repositories/ChatRepository"));
const ChatThread_1 = __importDefault(require("./models/ChatThread"));
dotenv_1.default.config();
const FRONTEND_URL = process.env.FRONTEND_URL;
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
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
    console.log('Socket auth token:', token);
    if (!token)
        return next(new Error('Authentication error: No token provided'));
    try {
        const secret = process.env.JWT_SECRET || 'mysecret';
        console.log('Socket JWT_SECRET:', secret); // Debug
        const decoded = jsonwebtoken_1.default.verify(token, 'mysecret');
        console.log('Socket decoded token:', decoded);
        socket.data.user = decoded;
        next();
    }
    catch (error) {
        next(new Error('Authentication error: Invalid token'));
    }
});
const syncUnreadCounts = async (socket) => {
    try {
        const allUsers = await mongoose_1.default.model('User').find({ role: 'user' });
        const unreadCounts = {};
        for (const user of allUsers) {
            const uid = user._id.toString();
            const count = await ChatRepository_1.default.getUnreadCount(uid);
            unreadCounts[uid] = count;
        }
        console.log('Syncing unread counts to admin on connect:', unreadCounts);
        socket.emit('initialUnreadCounts', unreadCounts);
    }
    catch (error) {
        console.error('Error syncing unread counts:', error);
    }
};
io.on('connection', (socket) => {
    const userId = socket.data.user.id;
    const isAdmin = socket.data.user.role === 'admin';
    console.log(`User connected: ${userId} (${socket.data.user.role})`);
    socket.join(userId);
    if (isAdmin) {
        socket.join('admin-room');
        syncUnreadCounts(socket); // Ensure this runs on every admin connect
    }
    socket.on('getChatHistory', async () => {
        try {
            const chat = await ChatService_1.default.getOrCreateChat(userId);
            socket.emit('chatHistory', chat);
        }
        catch (error) {
            console.error('Error fetching chat history:', error);
        }
    });
    socket.on('syncUnreadCounts', () => {
        if (isAdmin) {
            syncUnreadCounts(socket); // Respond to explicit client request
            console.log('Admin requested syncUnreadCounts');
        }
    });
    socket.on('sendMessage', async ({ targetUserId, messageType, content, duration, tempId }, ack) => {
        try {
            const senderId = socket.data.user.id;
            const isAdmin = socket.data.user.role === 'admin';
            const chatThreadId = isAdmin ? targetUserId : senderId;
            let finalContent = content;
            if (messageType === 'image' || messageType === 'voice') {
                if (!(content instanceof Buffer)) {
                    throw new Error('File content must be a Buffer for image or voice messages');
                }
                finalContent = await StorageService_1.default.uploadFileFromSocket(content, messageType === 'image' ? 'image' : 'audio');
            }
            const updatedChat = await ChatService_1.default.saveMessage(chatThreadId, senderId, messageType, finalContent, duration);
            const newMessage = updatedChat.messages[updatedChat.messages.length - 1];
            const messagePayload = {
                _id: newMessage._id.toString(),
                chatId: updatedChat._id.toString(),
                senderId,
                content: newMessage.content,
                messageType: newMessage.message_type,
                duration: newMessage.duration,
                timestamp: newMessage.timestamp,
                status: 'delivered',
                isAdmin,
                read: newMessage.read_by_admin,
            };
            if (isAdmin) {
                io.to(targetUserId).emit('newMessage', { ...messagePayload, isSelf: false });
                socket.emit('messageDelivered', { ...messagePayload, isSelf: true });
            }
            else {
                io.to('admin-room').emit('newMessage', { ...messagePayload, isSelf: false });
                socket.emit('messageDelivered', { ...messagePayload, isSelf: true });
                const unreadCount = await ChatRepository_1.default.getUnreadCount(chatThreadId);
                console.log(`Emitting updateUnreadCount for user ${chatThreadId}: ${unreadCount}`);
                io.to('admin-room').emit('updateUnreadCount', { userId: chatThreadId, unreadCount });
            }
            ack?.({ status: 'success', message: messagePayload });
            io.to('admin-room').emit('updateUserOrder', {
                userId: chatThreadId,
                timestamp: newMessage.timestamp,
            });
        }
        catch (error) {
            console.error('[sendMessage] Error:', error.message);
            socket.emit('messageError', { tempId, error: error.message });
            ack?.({ status: 'error', error: error.message });
        }
    });
    socket.on('editMessage', async ({ messageId, content }, ack) => {
        try {
            const senderId = socket.data.user.id;
            const chat = await ChatThread_1.default.findOne({ 'messages._id': messageId });
            if (!chat || !chat.messages.find((msg) => msg._id?.toString() === messageId)) {
                throw new Error('Message not found');
            }
            if (chat.messages.find((msg) => msg._id?.toString() === messageId).sender_id.toString() !== senderId) {
                throw new Error('You can only edit your own messages');
            }
            const updatedMessage = await ChatService_1.default.editMessage(messageId, content);
            const messagePayload = {
                _id: updatedMessage._id.toString(),
                content: updatedMessage.content,
                isEdited: true,
            };
            io.to(chat.user_id.toString()).emit('messageEdited', messagePayload);
            io.to('admin-room').emit('messageEdited', messagePayload);
            ack?.({ status: 'success', message: messagePayload });
        }
        catch (error) {
            ack?.({ status: 'error', error: error.message });
        }
    });
    socket.on('deleteMessage', async ({ messageId }, ack) => {
        try {
            const senderId = socket.data.user.id;
            const chat = await ChatThread_1.default.findOne({ 'messages._id': messageId });
            if (!chat || !chat.messages.find((msg) => msg._id?.toString() === messageId)) {
                throw new Error('Message not found');
            }
            if (chat.messages.find((msg) => msg._id?.toString() === messageId).sender_id.toString() !== senderId) {
                throw new Error('You can only delete your own messages');
            }
            await ChatService_1.default.deleteMessage(messageId);
            io.to(chat.user_id.toString()).emit('messageDeleted', { messageId });
            io.to('admin-room').emit('messageDeleted', { messageId });
            ack?.({ status: 'success' });
        }
        catch (error) {
            ack?.({ status: 'error', error: error.message });
        }
    });
    socket.on('markMessagesAsRead', async ({ chatId }) => {
        if (!isAdmin)
            return;
        await ChatRepository_1.default.markMessagesAsRead(chatId, userId);
        const unreadCount = await ChatRepository_1.default.getUnreadCount(chatId);
        console.log(`Messages marked as read for chat ${chatId}, new unread count: ${unreadCount}`);
        io.to('admin-room').emit('updateUnreadCount', { userId: chatId, unreadCount });
        io.to(chatId).emit('messagesRead', { chatId, readBy: userId, timestamp: new Date().toISOString() });
    });
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${userId}`);
    });
});
const port = process.env.PORT || 5000;
server.listen(port, () => {
    console.log(`Server started on port ${port} with HTTP and Socket.IO`);
});
exports.default = app;
