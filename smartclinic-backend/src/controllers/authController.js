import jwt from 'jsonwebtoken';
import { readData, writeData } from '../utils/fileHelper.js';

export const JWT_SECRET = 'smartclinic_secret_key_2026';

// Hàm tự động sinh mã Nhân viên tăng dần (VD: NV_001 -> NV_004)
const generateUserId = (users) => {
  if (!users || users.length === 0) return 'NV_001';
  const numbers = users.map((u) => {
    const parts = u.id.split('_');
    const num = parseInt(parts[1], 10);
    return isNaN(num) ? 0 : num;
  });
  const nextNumber = Math.max(...numbers) + 1;
  return `NV_${String(nextNumber).padStart(3, '0')}`;
};

// 1. [POST] /api/auth/login - Đăng nhập
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ tài khoản và mật khẩu!' });
    }

    const db = await readData();
    const users = db.users || [];

    const user = users.find((u) => u.username === username && u.password === password);

    if (!user) {
      return res.status(401).json({ message: 'Tài khoản hoặc mật khẩu không chính xác!' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      message: 'Đăng nhập thành công!',
      token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    res.status(500).json({ message: 'Lỗi hệ thống khi đăng nhập!' });
  }
};

// 2. [GET] /api/auth/users - Lấy danh sách tài khoản nhân sự (Chỉ Admin)
export const getUsers = async (req, res) => {
  try {
    const db = await readData();
    const users = db.users || [];

    // Ẩn trường password khi trả danh sách về Frontend để bảo mật
    const safeUsers = users.map(({ password, ...rest }) => rest);
    res.status(200).json(safeUsers);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi tải danh sách tài khoản!' });
  }
};

// 3. [POST] /api/auth/users - Admin cấp tài khoản nhân viên mới
export const createUser = async (req, res) => {
  try {
    const { username, password, fullName, role } = req.body;

    if (!username || !password || !fullName || !role) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin tài khoản!' });
    }

    const db = await readData();
    if (!db.users) db.users = [];

    // Kiểm tra chống trùng tên đăng nhập (username)
    const isExist = db.users.some(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase()
    );
    if (isExist) {
      return res.status(400).json({ message: 'Tên đăng nhập này đã tồn tại trong hệ thống!' });
    }

    const newUser = {
      id: generateUserId(db.users),
      username: username.trim(),
      password: password.trim(),
      fullName: fullName.trim(),
      role
    };

    db.users.push(newUser);
    await writeData(db);

    const { password: _, ...safeNewUser } = newUser;
    res.status(201).json(safeNewUser);
  } catch (error) {
    console.error('Lỗi tạo tài khoản:', error);
    res.status(500).json({ message: 'Lỗi hệ thống khi cấp tài khoản!' });
  }
};

// 4. [DELETE] /api/auth/users/:id - Admin thu hồi / xóa tài khoản
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Chặn Admin tự xóa chính tài khoản đang đăng nhập của mình
    if (req.user && req.user.id === id) {
      return res.status(400).json({ message: 'Bạn không thể tự xóa tài khoản đang đăng nhập của chính mình!' });
    }

    const db = await readData();
    const index = (db.users || []).findIndex((u) => u.id === id);

    if (index === -1) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản cần xóa!' });
    }

    db.users.splice(index, 1);
    await writeData(db);

    res.status(200).json({ message: 'Đã thu hồi tài khoản thành công!' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi hệ thống khi xóa tài khoản!' });
  }
};

// 5. [PUT] /api/auth/users/:id - Admin cập nhật thông tin / đặt lại mật khẩu tài khoản
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, fullName, role } = req.body;

    const db = await readData();
    const index = (db.users || []).findIndex((u) => u.id === id);

    if (index === -1) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản cần sửa!' });
    }

    // Kiểm tra chống trùng username với tài khoản khác
    if (username) {
      const isDuplicate = db.users.some(
        (u) => u.username.toLowerCase() === username.trim().toLowerCase() && u.id !== id
      );
      if (isDuplicate) {
        return res.status(400).json({ message: 'Tên đăng nhập này đã thuộc về một nhân sự khác!' });
      }
    }

    // Không cho phép Admin tự hạ quyền của chính tài khoản đang đăng nhập
    if (req.user && req.user.id === id && role && role !== 'Admin') {
      return res.status(400).json({ message: 'Bạn không thể tự hạ quyền Quản trị viên của chính mình!' });
    }

    // Cập nhật thông tin (Nếu ô password để trống thì giữ nguyên mật khẩu cũ)
    db.users[index] = {
      ...db.users[index],
      fullName: fullName ? fullName.trim() : db.users[index].fullName,
      username: username ? username.trim() : db.users[index].username,
      role: role || db.users[index].role,
      password: password && password.trim() !== '' ? password.trim() : db.users[index].password
    };

    await writeData(db);

    const { password: _, ...safeUpdatedUser } = db.users[index];
    res.status(200).json(safeUpdatedUser);
  } catch (error) {
    console.error('Lỗi cập nhật tài khoản:', error);
    res.status(500).json({ message: 'Lỗi hệ thống khi cập nhật tài khoản!' });
  }
};