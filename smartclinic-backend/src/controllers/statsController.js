import { readData } from '../utils/fileHelper.js';

// [GET] /api/stats - Lấy thông số tổng quan và dữ liệu biểu đồ cho Dashboard
export const getDashboardStats = async (req, res) => {
  try {
    const db = await readData();
    
    const patients = db.patients || [];
    const doctors = db.doctors || [];
    const appointments = db.appointments || [];

    // Đếm số lượng theo từng trạng thái lịch hẹn
    const statusCounts = appointments.reduce((acc, curr) => {
      acc[curr.status] = (acc[curr.status] || 0) + 1;
      return acc;
    }, {});

    const stats = {
      totalPatients: patients.length,
      totalDoctors: doctors.length,
      totalAppointments: appointments.length,
      completedAppointments: statusCounts['Completed'] || 0,
      chartData: [
        { name: 'Đã lên lịch', value: statusCounts['Scheduled'] || 0 },
        { name: 'Đã xác nhận', value: statusCounts['Confirmed'] || 0 },
        { name: 'Đã hoàn thành', value: statusCounts['Completed'] || 0 },
        { name: 'Đã hủy', value: statusCounts['Cancelled'] || 0 },
      ]
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error('Lỗi thống kê:', error);
    res.status(500).json({ message: 'Lỗi khi lấy dữ liệu thống kê' });
  }
};