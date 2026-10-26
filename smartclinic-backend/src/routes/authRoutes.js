import express from 'express';
import { login, getUsers, createUser, updateUser, deleteUser } from '../controllers/authController.js';
import { verifyToken, requireAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Route công khai
router.post('/login', login);

// Các Route quản lý tài khoản (Bắt buộc đăng nhập & phải là Admin)
router.get('/users', verifyToken, requireAdmin, getUsers);
router.post('/users', verifyToken, requireAdmin, createUser);
router.put('/users/:id', verifyToken, requireAdmin, updateUser);
router.delete('/users/:id', verifyToken, requireAdmin, deleteUser);

export default router;