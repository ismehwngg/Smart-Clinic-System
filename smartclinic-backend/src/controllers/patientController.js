import { readData, writeData } from '../utils/fileHelper.js';

// Hàm tự động sinh mã Bệnh nhân tăng dần (VD: BN_001 -> BN_002)
const generatePatientId = (patients, prefix = 'BN') => {
  if (!patients || patients.length === 0) {
    return `${prefix}_001`;
  }

  // Lọc ra các số thứ tự từ mã BN_xxx hiện có
  const numbers = patients.map(p => {
    const parts = p.id.split('_');
    const num = parseInt(parts[1], 10);
    return isNaN(num) ? 0 : num;
  });

  const maxNumber = Math.max(...numbers);
  const nextNumber = maxNumber + 1;

  // Đệm thêm số 0 ở đầu cho đủ 3 chữ số (VD: 6 -> "006")
  return `${prefix}_${String(nextNumber).padStart(3, '0')}`;
};

// 1. [GET] /api/patients - Lấy danh sách bệnh nhân (có tìm kiếm)
export const getPatients = async (req, res) => {
  try {
    const db = await readData();
    let patients = db.patients || [];
    const { search } = req.query;

    if (search) {
      const keyword = search.toLowerCase();
      patients = patients.filter(p =>
        p.fullName.toLowerCase().includes(keyword) ||
        p.phone.includes(keyword) ||
        p.id.toLowerCase().includes(keyword)
      );
    }

    res.status(200).json(patients);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi tải danh sách bệnh nhân!' });
  }
};

// 2. [GET] /api/patients/:id - Lấy chi tiết 1 bệnh nhân theo ID
export const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readData();
    const patient = (db.patients || []).find(p => String(p.id) === String(id));

    if (!patient) {
      return res.status(404).json({ message: 'Không tìm thấy bệnh nhân!' });
    }

    res.status(200).json(patient);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy thông tin bệnh nhân!' });
  }
};

// 3. [POST] /api/patients - Thêm bệnh nhân mới
export const createPatient = async (req, res) => {
  try {
    // Đã bổ sung allergies và medicalHistory
    const { fullName, dob, gender, phone, address, allergies, medicalHistory } = req.body;

    if (!fullName || !dob || !phone) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ Họ tên, Ngày sinh và Số điện thoại!' });
    }

    const db = await readData();
    if (!db.patients) db.patients = [];

    const isPhoneExist = db.patients.some(p => p.phone === phone);
    if (isPhoneExist) {
      return res.status(400).json({ message: 'Số điện thoại này đã được đăng ký cho một bệnh nhân khác!' });
    }

    const newPatient = {
      id: generatePatientId(db.patients, 'BN'),
      fullName,
      dob,
      gender: gender || 'Nam',
      phone,
      address: address || 'Chưa cập nhật',
      // Lưu thêm 2 trường tiền sử y tế
      allergies: allergies || '',
      medicalHistory: medicalHistory || ''
    };

    db.patients.push(newPatient);
    await writeData(db);

    res.status(201).json(newPatient);
  } catch (error) {
    console.error('Lỗi khi thêm bệnh nhân:', error);
    res.status(500).json({ message: 'Lỗi hệ thống khi thêm bệnh nhân!' });
  }
};

// 4. [PUT] /api/patients/:id - Cập nhật thông tin bệnh nhân
export const updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    // Đã bổ sung allergies và medicalHistory
    const { fullName, dob, gender, phone, address, allergies, medicalHistory } = req.body;

    const db = await readData();
    const index = (db.patients || []).findIndex(p => p.id === id);

    if (index === -1) {
      return res.status(404).json({ message: 'Không tìm thấy bệnh nhân cần sửa!' });
    }

    if (phone) {
      const isDuplicatePhone = db.patients.some(p => p.phone === phone && p.id !== id);
      if (isDuplicatePhone) {
        return res.status(400).json({ message: 'Số điện thoại này đã thuộc về một bệnh nhân khác!' });
      }
    }

    db.patients[index] = {
      ...db.patients[index],
      fullName: fullName || db.patients[index].fullName,
      dob: dob || db.patients[index].dob,
      gender: gender || db.patients[index].gender,
      phone: phone || db.patients[index].phone,
      address: address !== undefined ? address : db.patients[index].address,
      // Cập nhật 2 trường tiền sử y tế
      allergies: allergies !== undefined ? allergies : db.patients[index].allergies,
      medicalHistory: medicalHistory !== undefined ? medicalHistory : db.patients[index].medicalHistory
    };

    await writeData(db);
    res.status(200).json(db.patients[index]);
  } catch (error) {
    console.error('Lỗi khi cập nhật bệnh nhân:', error);
    res.status(500).json({ message: 'Lỗi hệ thống khi cập nhật bệnh nhân!' });
  }
};

// 5. [DELETE] /api/patients/:id - Xóa bệnh nhân
export const deletePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readData();
    const index = (db.patients || []).findIndex(p => String(p.id) === String(id));

    if (index === -1) {
      return res.status(404).json({ message: 'Không tìm thấy bệnh nhân cần xóa!' });
    }

    db.patients.splice(index, 1);
    await writeData(db);

    res.status(200).json({ message: 'Xóa bệnh nhân thành công!' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi hệ thống khi xóa bệnh nhân!' });
  }
};