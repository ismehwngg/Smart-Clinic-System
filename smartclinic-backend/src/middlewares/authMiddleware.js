import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../controllers/authController.js';

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Truy cập bị từ chối! Vui lòng đăng nhập.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn!' });
  }
};

export const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'Admin') {
    next();
  } else {
    return res.status(403).json({ 
      message: 'Chỉ Quản trị viên (Admin) mới có quyền thực hiện thao tác này!' 
    });
  }
};