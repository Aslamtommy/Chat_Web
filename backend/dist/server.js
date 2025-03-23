"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const auth_1 = __importDefault(require("./routes/auth"));
const chat_1 = __importDefault(require("./routes/chat"));
const upload_1 = __importDefault(require("./routes/upload"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// Detailed logging
app.use((req, res, next) => {
    console.log('Request Received:', {
        method: req.method,
        url: req.url,
        origin: req.headers.origin,
        headers: req.headers,
    });
    res.on('finish', () => {
        console.log('Response Sent:', {
            status: res.statusCode,
            headers: res.getHeaders(),
        });
    });
    next();
});
// Handle OPTIONS explicitly  
app.options('*', (0, cors_1.default)({
    origin: ['https://chat-web-ruddy-five.vercel.app',
        'http://localhost:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// CORS middleware
app.use((0, cors_1.default)({
    origin: 'https://chat-web-ruddy-five.vercel.app',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express_1.default.json());
// Test endpoint
app.get('/test', (req, res) => {
    res.json({ message: 'CORS test' });
});
app.use('/auth', auth_1.default);
app.use('/chat', chat_1.default);
app.use('/upload', upload_1.default);
app.get('/', (req, res) => {
    console.log('GET / accessed');
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
const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Server started on port ${port} with HTTP`);
});
exports.default = app;
