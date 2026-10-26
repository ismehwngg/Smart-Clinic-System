import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit3,
  CalendarPlus,
  Phone,
  Calendar,
  MapPin,
  User,
  AlertTriangle,
  HeartPulse,
  Clock,
  Stethoscope,
  FileText,
  CheckCircle2,
  XCircle,
  Activity,
  X,
  DoorOpen,
  BriefcaseMedical
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  useEffect(() => {
    const fetchPatientData = async () => {
      setIsLoading(true);
      try {
        const [patientsRes, appointmentsRes] = await Promise.all([
          api.get('/patients'),
          api.get('/appointments')
        ]);

        const allPatients = patientsRes.data || [];
        const foundPatient = allPatients.find((p) => String(p.id) === String(id));

        if (!foundPatient) {
          toast.error('Không tìm thấy hồ sơ bệnh nhân!');
          navigate('/patients');
          return;
        }

        setPatient(foundPatient);

        // Lọc các lịch hẹn của bệnh nhân này (khớp theo patientId hoặc tên)
        const allAppointments = appointmentsRes.data || [];
        const patientApps = allAppointments.filter(
          (app) =>
            String(app.patientId) === String(foundPatient.id) ||
            (app.patientName &&
              foundPatient.fullName &&
              app.patientName.toLowerCase() === foundPatient.fullName.toLowerCase())
        );

        setAppointments(patientApps);
      } catch (error) {
        console.error('Lỗi khi tải chi tiết bệnh nhân:', error);
        toast.error('Không thể tải dữ liệu hồ sơ bệnh nhân!');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatientData();
  }, [id, navigate]);

  // Hàm tính tuổi và format ngày sinh
  const formatDobAndAge = (dobString) => {
    if (!dobString) return { formatted: 'Chưa cập nhật', age: null };
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) return { formatted: dobString, age: null };

    const formatted = dob.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const age = new Date().getFullYear() - dob.getFullYear();
    return { formatted, age };
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Đã hoàn thành
          </span>
        );
      case 'Confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Đã xác nhận
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Đã hủy
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Chờ xác nhận
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-gray-500 font-medium animate-pulse">
        Đang tải hồ sơ bệnh án điện tử...
      </div>
    );
  }

  if (!patient) return null;

  const { formatted: dobFormatted, age } = formatDobAndAge(patient.dob);
  const completedCount = appointments.filter((a) => a.status === 'Completed').length;
  const upcomingCount = appointments.filter(
    (a) => a.status === 'Scheduled' || a.status === 'Confirmed'
  ).length;

  const hasAllergies =
    patient.allergies &&
    patient.allergies.trim() !== '' &&
    patient.allergies.toLowerCase() !== 'không có';

  return (
    <div className="space-y-6 animate-fade-up">
      {/* THANH TOP ACTION BAR */}
      <div className="bg-white p-4 sm:px-6 rounded-2xl shadow-xs border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <Link
            to="/patients"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-50 hover:bg-teal-50 text-gray-600 hover:text-teal-700 text-xs font-bold border border-gray-200/80 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại</span>
          </Link>
          <div>
            <h1 className="text-lg font-extrabold text-gray-900">Hồ sơ Y tế Bệnh nhân</h1>
            <p className="text-xs text-gray-400">
              Danh sách bệnh nhân / Chi tiết hồ sơ <span className="font-mono font-semibold text-teal-600">#{patient.id}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to={`/patients/edit/${patient.id}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold border border-gray-200 transition-all"
          >
            <Edit3 className="w-3.5 h-3.5 text-gray-500" />
            <span>Sửa thông tin</span>
          </Link>
          <Link
            to={`/appointments/create?patientId=${patient.id}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-all"
          >
            <CalendarPlus className="w-4 h-4" />
            <span>Đặt lịch khám mới</span>
          </Link>
        </div>
      </div>

      {/* GRID NỘI DUNG CHÍNH (TRÁI: THÔNG TIN CÁ NHÂN | PHẢI: BỆNH ÁN & LỊCH SỬ) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CỘT TRÁI (4 CỘT) */}
        <div className="lg:col-span-4 bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
          {/* Banner Gradient */}
          <div className="bg-gradient-to-r from-teal-600 to-emerald-500 px-6 pt-5 pb-14 flex justify-between items-start">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/20 text-white backdrop-blur-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-200 animate-pulse"></span>
              Hồ sơ đang hoạt động
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-white/20 text-white font-mono text-xs font-bold backdrop-blur-xs">
              #{patient.id}
            </span>
          </div>

          {/* Avatar & Tên */}
          <div className="px-6 pb-6 relative">
            <div className="flex flex-col items-center -mt-12 mb-4">
              <div className="w-24 h-24 rounded-full bg-white border-2 border-teal-600 text-teal-700 flex items-center justify-center text-4xl font-extrabold shadow-md z-10">
                {patient.fullName ? patient.fullName.charAt(0).toUpperCase() : 'U'}
              </div>
              <h2 className="text-xl font-extrabold text-gray-900 mt-3 text-center">
                {patient.fullName}
              </h2>
              <span className="mt-1 inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
                Mã BN: {patient.id}
              </span>
            </div>

            <hr className="border-gray-100 my-5" />

            {/* Danh sách thông tin hành chính */}
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-gray-500">
                  <User className="w-4 h-4 text-teal-600" />
                  Giới tính:
                </span>
                <span className="font-bold text-gray-800">{patient.gender || 'Chưa rõ'}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-gray-500">
                  <Calendar className="w-4 h-4 text-teal-600" />
                  Ngày sinh:
                </span>
                <span className="font-bold text-gray-800">
                  {dobFormatted}{' '}
                  {age !== null && (
                    <span className="text-xs font-medium text-gray-400">({age} tuổi)</span>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-gray-500">
                  <Phone className="w-4 h-4 text-teal-600" />
                  Số điện thoại:
                </span>
                <a
                  href={`tel:${patient.phone}`}
                  className="font-mono font-bold text-teal-600 hover:underline"
                >
                  {patient.phone || '---'}
                </a>
              </div>

              <div className="pt-1">
                <span className="flex items-center gap-2 text-gray-500 mb-2">
                  <MapPin className="w-4 h-4 text-teal-600" />
                  Địa chỉ liên hệ:
                </span>
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs font-semibold text-gray-700 leading-relaxed">
                  {patient.address || 'Chưa cập nhật địa chỉ cư trú'}
                </div>
              </div>
            </div>

            {/* Thống kê mini */}
            <div className="grid grid-cols-3 gap-2.5 mt-6">
              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-center">
                <p className="text-lg font-extrabold text-blue-600">{appointments.length}</p>
                <p className="text-[11px] font-semibold text-gray-500 mt-0.5">Tổng lần hẹn</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 text-center">
                <p className="text-lg font-extrabold text-emerald-600">{completedCount}</p>
                <p className="text-[11px] font-semibold text-gray-500 mt-0.5">Hoàn thành</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100 text-center">
                <p className="text-lg font-extrabold text-amber-600">{upcomingCount}</p>
                <p className="text-[11px] font-semibold text-gray-500 mt-0.5">Sắp tới</p>
              </div>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI (8 CỘT): THÔNG TIN Y TẾ & LỊCH SỬ KHÁM */}
        <div className="lg:col-span-8 space-y-6">
          {/* KHỐI 1: TÓM TẮT Y TẾ (DỊ ỨNG & BỆNH NỀN) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Thẻ Dị ứng */}
            <div
              className={`p-5 rounded-2xl border transition-all ${
                hasAllergies
                  ? 'bg-amber-50/70 border-amber-200 shadow-2xs'
                  : 'bg-white border-gray-100 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      hasAllergies ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-700">
                    Tiền sử Dị ứng
                  </h3>
                </div>
                {hasAllergies && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-200/80 text-amber-900 uppercase">
                    Cần lưu ý
                  </span>
                )}
              </div>
              <p
                className={`text-sm mt-2 leading-relaxed ${
                  hasAllergies ? 'font-bold text-amber-900' : 'text-gray-400 italic'
                }`}
              >
                {patient.allergies && patient.allergies.trim() !== ''
                  ? patient.allergies
                  : 'Không ghi nhận tiền sử dị ứng thuốc hoặc thực phẩm.'}
              </p>
            </div>

            {/* Thẻ Tiền sử bệnh nền */}
            <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-xs">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <HeartPulse className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-700">
                  Tiền sử Bệnh nền & Mạn tính
                </h3>
              </div>
              <p
                className={`text-sm mt-2 leading-relaxed ${
                  patient.medicalHistory ? 'font-semibold text-gray-800' : 'text-gray-400 italic'
                }`}
              >
                {patient.medicalHistory && patient.medicalHistory.trim() !== ''
                  ? patient.medicalHistory
                  : 'Chưa có ghi nhận bệnh lý nền hoặc phẫu thuật trước đây.'}
              </p>
            </div>
          </div>

          {/* KHỐI 2: BẢNG LỊCH SỬ KHÁM BỆNH & ĐẶT HẸN */}
          <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-extrabold text-gray-900">
                  Lịch sử Khám bệnh & Đặt hẹn
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Danh sách toàn bộ các ca khám gắn với bệnh nhân {patient.fullName}
                </p>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 self-start sm:self-auto">
                {appointments.length} bản ghi
              </span>
            </div>

            {appointments.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
                  <Calendar className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-gray-700">
                  Bệnh nhân chưa có lịch sử khám bệnh nào
                </p>
                <p className="text-xs text-gray-400 max-w-xs mx-auto">
                  Bấm vào nút "Đặt lịch khám mới" ở góc trên để tạo ca khám đầu tiên cho bệnh nhân này.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/70 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      <th className="py-3.5 px-6">Mã LH</th>
                      <th className="py-3.5 px-6">Ngày & Giờ khám</th>
                      <th className="py-3.5 px-6">Bác sĩ & Lý do khám</th>
                      <th className="py-3.5 px-6">Trạng thái</th>
                      <th className="py-3.5 px-6 text-right">Tác vụ chuyên môn</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {appointments.map((app) => (
                      <tr
                        key={app.id}
                        onClick={() => setSelectedAppointment(app)}
                        className="hover:bg-teal-50/30 transition-colors cursor-pointer group"
                      >
                        <td className="py-4 px-6 font-mono text-xs font-bold text-gray-600">
                          #{app.id}
                        </td>
                        <td className="py-4 px-6">
                          <p className="font-extrabold text-gray-900">{app.date}</p>
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-teal-600" />
                            Ca khám: {app.time}
                          </p>
                        </td>
                        <td className="py-4 px-6">
                          <p className="font-bold text-gray-900 flex items-center gap-1.5">
                            <Stethoscope className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                            <span>{app.doctorName}</span>
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                            Lý do: {app.reason || 'Khám tổng quát'}
                          </p>
                        </td>
                        <td className="py-4 px-6">{renderStatusBadge(app.status)}</td>
                        <td
                          className="py-4 px-6 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedAppointment(app)}
                              className="px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold transition-colors cursor-pointer"
                            >
                              Chi tiết
                            </button>
                            <Link
                              to={`/appointments/edit/${app.id}`}
                              className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors"
                            >
                              Sửa
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL CHI TIẾT CA KHÁM KHI CLICK VÀO DÒNG LỊCH SỬ */}
      {selectedAppointment && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-up"
          onClick={() => setSelectedAppointment(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-base font-extrabold text-gray-800">Chi tiết Ca khám</h3>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3.5 pb-4 border-b border-gray-100">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                  <BriefcaseMedical className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-gray-900">{patient.fullName}</h4>
                  <p className="text-xs text-gray-500">
                    Mã BN: {patient.id} | Giới tính: {patient.gender}
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Mã lịch hẹn:</span>
                  <span className="font-mono font-bold text-gray-900">#{selectedAppointment.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Ngày & Giờ khám:</span>
                  <span className="font-bold text-gray-900">
                    {selectedAppointment.date} lúc {selectedAppointment.time}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Bác sĩ phụ trách:</span>
                  <span className="font-bold text-teal-700">{selectedAppointment.doctorName}</span>
                </div>
                <div className="flex justify-between items-start gap-4">
                  <span className="text-gray-500 shrink-0">Lý do khám:</span>
                  <span className="font-semibold text-gray-800 text-right">
                    {selectedAppointment.reason || 'Khám tổng quát'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Trạng thái:</span>
                  {renderStatusBadge(selectedAppointment.status)}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex gap-2.5">
                <Link
                  to={`/appointments/edit/${selectedAppointment.id}`}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  Chỉnh sửa / Đổi trạng thái
                </Link>
                <button
                  onClick={() => setSelectedAppointment(null)}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}