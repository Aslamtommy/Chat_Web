"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRoleMiddleware = void 0;
const adminRoleMiddleware = (req, res, next) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Admins only' });
    }
    next();
};
exports.adminRoleMiddleware = adminRoleMiddleware;
