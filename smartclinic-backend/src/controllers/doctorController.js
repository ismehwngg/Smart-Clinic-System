import { readData, writeData, generateNextId } from '../utils/fileHelper.js';

// [GET] /api/doctors - Lấy danh sách bác sĩ 
export const getDoctors = async (req, res) => {
  try {
    const db = await readData();
    let doctors = db.doctors || [];
    
    // Lấy cả search và specialty từ query params
    const { search, specialty } = req.query;

    // 1. Lọc theo chuyên khoa (nếu người dùng chọn khác 'All')
    if (specialty && specialty !== 'All') {
      doctors = doctors.filter(doc => doc.specialty === specialty);
    }

    // 2. Lọc tiếp theo từ khóa tìm kiếm (nếu có)
    if (search) {
      const keyword = search.toLowerCase();
      doctors = doctors.filter(doc =>
        doc.fullName.toLowerCase().includes(keyword) ||
        doc.specialty.toLowerCase().includes(keyword) ||
        doc.phone.includes(keyword) ||
        doc.id.toLowerCase().includes(keyword)
      );
    }

    res.status(200).json(doctors);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi tải danh sách bác sĩ!' });
  }
};

// [GET] /api/doctors/:id - Lấy chi tiết 1 bác sĩ
export const getDoctorById = async (req, res) => {
  const db = await readData();
  const doctor = db.doctors.find(d => d.id === req.params.id);

  if (!doctor) {
    return res.status(404).json({ message: 'Không tìm thấy bác sĩ!' });
  }
  res.status(200).json(doctor);
};

// [POST] /api/doctors - Thêm mới bác sĩ
export const createDoctor = async (req, res) => {
  const db = await readData();
  const { fullName, specialty, phone, email, notes } = req.body;

  if (!fullName || !specialty) {
    return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ Tên và Chuyên khoa!' });
  }
  const isPhoneExist = db.doctors.some(d => d.phone === phone);
  if (isPhoneExist) {
    return res.status(400).json({ message: 'Số điện thoại này đã được sử dụng!' });
  }

  const newDoctor = {
    id: generateNextId(db.doctors, 'BS'),
    fullName,
    specialty,
    phone: phone || '',
    email: email || '',
    notes: notes || ''
  };

  db.doctors.push(newDoctor);
  const isSaved = await writeData(db);

  if (isSaved) {
    res.status(201).json({ message: 'Thêm bác sĩ thành công!', doctor: newDoctor });
  } else {
    res.status(500).json({ message: 'Lỗi hệ thống khi lưu dữ liệu' });
  }
};

// [PUT] /api/doctors/:id - Cập nhật bác sĩ
export const updateDoctor = async (req, res) => {
  const db = await readData();
  const { id } = req.params;
  const index = db.doctors.findIndex(d => d.id === id);

  if (index === -1) return res.status(404).json({ message: 'Không tìm thấy bác sĩ!' });

  db.doctors[index] = { ...db.doctors[index], ...req.body };
  await writeData(db);

  res.status(200).json({ message: 'Cập nhật thành công!', doctor: db.doctors[index] });
};

// [DELETE] /api/doctors/:id - Xóa bác sĩ
export const deleteDoctor = async (req, res) => {
  const db = await readData();
  const { id } = req.params;
  const index = db.doctors.findIndex(d => d.id === id);

  if (index === -1) return res.status(404).json({ message: 'Không tìm thấy bác sĩ!' });

  db.doctors.splice(index, 1);
  await writeData(db);

  res.status(200).json({ message: 'Xóa bác sĩ thành công!' });
};