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
const ChatService_1 = __importDefault(require("./services/ChatService")); // Import ChatService for real-time message handling
const dotenv_1 = __importDefault(require("dotenv"));
const ChatRepository_1 = __importDefault(require("./repositories/ChatRepository"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app); // Create an HTTP server for Socket.IO
const io = new socket_io_1.Server(server, {
    cors: {
        origin: 'https://chat-web-beige.vercel.app', // Match your frontend URL
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    },
});
exports.io = io;
// Middleware
app.options('*', (0, cors_1.default)({
    origin: 'https://chat-web-beige.vercel.app',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use((0, cors_1.default)({
    origin: 'https://chat-web-beige.vercel.app',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express_1.default.json({ limit: '10mb' }));
// Test endpoint
app.get('/test', (req, res) => {
    res.json({ message: 'CORS test' });
});
// Routes
app.use('/auth', auth_1.default);
app.use('/chat', chat_1.default);
app.use('/upload', upload_1.default);
app.use('/admin', adminRoutes_1.default);
app.get('/', (req, res) => {
    console.log('GET / accessed');
    res.send('Backend is running');
});
// MongoDB Connection
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
// Socket.IO Authentication Middleware
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
    if (isAdmin)
        socket.join('admin-room');
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
            const chatThreadId = isAdmin ? targetUserId : recipientId;
            // Check for duplicate message
            const existingMessage = await ChatRepository_1.default.findMessageByContent(chatThreadId, content);
            if (existingMessage) {
                socket.emit('messageError', { tempId, error: 'Duplicate message detected' });
                return ack?.({ status: 'error', error: 'Duplicate message' });
            }
            const updatedChat = await ChatService_1.default.saveMessage(chatThreadId, senderId, messageType, content);
            const newMessage = updatedChat.messages[updatedChat.messages.length - 1];
            if (newMessage._id == undefined) {
                console.log('newMessage._id is undefined');
                return ack?.({ status: 'error', error: 'Message not saved' });
            }
            const messagePayload = {
                _id: newMessage._id.toString(),
                chatId: updatedChat._id.toString(),
                senderId,
                content: newMessage.content,
                messageType: newMessage.message_type,
                timestamp: newMessage.timestamp,
                status: 'delivered'
            };
            const recipientRoom = isAdmin ? targetUserId : 'admin-room';
            // Prevent duplicate emission with once handler
            io.to(recipientRoom).emit('newMessage', {
                ...messagePayload,
                isAdmin: isAdmin
            });
            socket.emit('messageDelivered', {
                ...messagePayload,
                isAdmin: senderRole === 'admin',
                status: 'delivered'
            });
            // Enhanced admin notification
            if (!isAdmin) {
                io.to('admin-room').emit('newUserMessage', {
                    userId: senderId,
                    message: messagePayload,
                    timestamp: new Date().toISOString()
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
    });
});
// Start Server
const port = process.env.PORT || 5000;
server.listen(port, () => {
    console.log(`Server started on port ${port} with HTTP and Socket.IO`);
});
exports.default = app;
