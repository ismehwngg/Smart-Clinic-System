export const mockPatients = [
  { id: 'BN_001', fullName: 'Nguyễn Văn A', phone: '0901234567', gender: 'Nam', dob: '1990-05-12' },
  { id: 'BN_002', fullName: 'Trần Thị B', phone: '0912345678', gender: 'Nữ', dob: '1985-08-20' },
  { id: 'BN_003', fullName: 'Lê Văn C', phone: '0923456789', gender: 'Nam', dob: '1978-11-05' },
];

export const mockDoctors = [
  { id: 'BS_001', fullName: 'Trần Thị B', specialty: 'Nội tổng quát', phone: '0912345678', email: 'dr.b@smartclinic.com' },
  { id: 'BS_002', fullName: 'Phạm Văn D', specialty: 'Nhi khoa', phone: '0934567890', email: 'dr.d@smartclinic.com' },
  { id: 'BS_003', fullName: 'Hoàng Văn E', specialty: 'Răng Hàm Mặt', phone: '0987654321', email: 'dr.e@smartclinic.com' },
];

export const mockAppointments = [
  { id: 'LH_001', patientName: 'Nguyễn Văn A', doctorName: 'Trần Thị B', date: '2026-10-15', time: '09:00', status: 'Scheduled' },
  { id: 'LH_002', patientName: 'Trần Thị B', doctorName: 'Phạm Văn D', date: '2026-10-16', time: '14:30', status: 'Confirmed' },
  { id: 'LH_003', patientName: 'Lê Văn C', doctorName: 'Hoàng Văn E', date: '2026-10-14', time: '10:00', status: 'Completed' },
  { id: 'LH_004', patientName: 'Nguyễn Văn A', doctorName: 'Phạm Văn D', date: '2026-10-20', time: '15:00', status: 'Cancelled' },
];