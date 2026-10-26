import fs from 'fs/promises';
import path from 'path';

// Trỏ đường dẫn chính xác đến file db.json dựa trên thư mục gốc chạy project
const dataFilePath = path.join(process.cwd(), 'src', 'data', 'db.json');

// Hàm đọc dữ liệu
export const readData = async () => {
  try {
    const fileContent = await fs.readFile(dataFilePath, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error('Lỗi khi đọc file db.json:', error);
    // Nếu lỗi (ví dụ chưa có file), trả về cấu trúc rỗng mặc định
    return { patients: [], doctors: [], appointments: [] };
  }
};

// Hàm ghi dữ liệu
export const writeData = async (data) => {
  try {
    await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Lỗi khi ghi file db.json:', error);
    return false;
  }
};

export const generateNextId = (list, prefix) => {
  if (!list || list.length === 0) {
    return `${prefix}_001`;
  }

  let maxNum = 0;
  list.forEach(item => {
    if (item.id && item.id.startsWith(`${prefix}_`)) {
      const parts = item.id.split('_');
      const num = parseInt(parts[1], 10);
      // Chỉ lấy các số thứ tự hợp lý (nhỏ hơn 100000) để bỏ qua các mã Date.now() cũ quá dài
      if (!isNaN(num) && num < 100000 && num > maxNum) {
        maxNum = num;
      }
    }
  });

  // Tăng lên 1 và đệm thêm số 0 ở đầu cho đủ 3 chữ số (VD: 1 -> "001", 12 -> "012")
  const nextNum = String(maxNum + 1).padStart(3, '0');
  return `${prefix}_${nextNum}`;
};

// Hàm sinh ID Lịch hẹn theo cấu trúc thời gian: LH_YYMMDD_001 (VD: LH_261017_001)
export const generateAppointmentId = (appointments, dateString) => {
  // Lấy ngày hẹn (YYYY-MM-DD), nếu không có thì lấy ngày hiện tại
  const cleanDate = dateString ? dateString.replace(/-/g, '') : new Date().toISOString().slice(0, 10).replace(/-/g, '');
  // Cắt lấy 6 số cuối: YYMMDD (VD: "20261017" -> "261017")
  const datePart = cleanDate.slice(2, 8);
  const prefix = `LH_${datePart}`;

  let maxNum = 0;
  if (appointments && appointments.length > 0) {
    appointments.forEach(app => {
      if (app.id && app.id.startsWith(`${prefix}_`)) {
        const parts = app.id.split('_');
        const num = parseInt(parts[2], 10); // Lấy phần số thứ tự ở cuối
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });
  }

  const nextNum = String(maxNum + 1).padStart(3, '0');
  return `${prefix}_${nextNum}`;
};