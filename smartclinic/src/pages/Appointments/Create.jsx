import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  CalendarPlus,
  ArrowLeft,
  User,
  Stethoscope,
  Calendar,
  Clock,
  FileText,
  Save
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const QUICK_TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
];

export default function AppointmentCreate() {
  const navigate = useNavigate();
  const location = useLocation();

  // Nhận doctorId hoặc patientId được truyền sang từ trang Bác sĩ / Bệnh nhân
  const queryParams = new URLSearchParams(location.search);
  const preselectedDoctorId = queryParams.get('doctorId') || location.state?.selectedDoctorId || '';
  const preselectedPatientId = queryParams.get('patientId') || location.state?.selectedPatientId || '';

  const getTodayISO = () => {
    const d = new Date();
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().split('T')[0];
  };

  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(true);

  const [formData, setFormData] = useState({
    patientId: '',
    patientName: '',
    patientGender: '',
    doctorId: '',
    doctorName: '',
    date: getTodayISO(),
    time: '08:30',
    status: 'Scheduled',
    reason: '',
    notes: ''
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsFetchingData(true);
      try {
        const [patientsRes, doctorsRes] = await Promise.all([
          api.get('/patients'),
          api.get('/doctors')
        ]);

        const patientsList = patientsRes.data || [];
        const doctorsList = doctorsRes.data || [];
        setPatients(patientsList);
        setDoctors(doctorsList);

        // Ưu tiên chọn đúng Bác sĩ / Bệnh nhân được truyền sang
        const initialDoc =
          doctorsList.find((d) => String(d.id) === String(preselectedDoctorId)) ||
          doctorsList[0];
        const initialPat =
          patientsList.find((p) => String(p.id) === String(preselectedPatientId)) ||
          patientsList[0];

        setFormData((prev) => ({
          ...prev,
          patientId: initialPat ? initialPat.id : '',
          patientName: initialPat ? initialPat.fullName : '',
          patientGender: initialPat ? (initialPat.gender || 'Chưa rõ') : '', 
          doctorId: initialDoc ? initialDoc.id : '',
          doctorName: initialDoc ? initialDoc.fullName : ''
        }));
      } catch (error) {
        console.error('Lỗi tải dữ liệu:', error);
        toast.error('Không thể tải danh sách bệnh nhân và bác sĩ!');
      } finally {
        setIsFetchingData(false);
      }
    };

    fetchInitialData();
  }, [preselectedDoctorId, preselectedPatientId]);

  const handlePatientChange = (e) => {
    const selectedId = e.target.value;
    const foundPat = patients.find((p) => String(p.id) === String(selectedId));
    setFormData((prev) => ({
      ...prev,
      patientId: selectedId,
      patientName: foundPat ? foundPat.fullName : '',
      patientGender: foundPat ? (foundPat.gender || 'Chưa rõ') : ''
    }));
  };

  const handleDoctorChange = (e) => {
    const selectedId = e.target.value;
    const foundDoc = doctors.find((d) => String(d.id) === String(selectedId));
    setFormData((prev) => ({
      ...prev,
      doctorId: selectedId,
      doctorName: foundDoc ? foundDoc.fullName : ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.patientId || !formData.doctorId) {
      toast.error('Vui lòng chọn Bệnh nhân và Bác sĩ!');
      return;
    }

    setIsLoading(true);
    try {
      // payload lấy toàn bộ formData, không rớt 1 chữ nào
      const payload = { ...formData };

      await api.post('/appointments', payload);
      toast.success('Đã đặt lịch khám thành công!');
      navigate('/appointments');
    } catch (error) {
      console.error('Lỗi khi tạo lịch hẹn:', error);
      const errorMessage = error.response?.data?.message || 'Không thể tạo lịch hẹn! Vui lòng thử lại.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedDoctorObj = doctors.find((d) => String(d.id) === String(formData.doctorId));

  if (isFetchingData) {
    return <div className="p-8 text-center text-gray-500">Đang chuẩn bị biểu mẫu đặt lịch...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <Link
          to="/appointments"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-teal-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách lịch hẹn</span>
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
        {/* Banner Header */}
        <div className="p-6 bg-gradient-to-r from-teal-600 to-emerald-600 text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center border border-white/30 shrink-0">
              <CalendarPlus className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold">Đăng ký Đặt Lịch hẹn Khám mới</h1>
              <p className="text-xs text-teal-50 mt-0.5">
                Chọn hồ sơ bệnh nhân, phân bổ bác sĩ chuyên khoa và ấn định khung giờ khám
              </p>
            </div>
          </div>

          {selectedDoctorObj && (
            <div className="hidden sm:flex flex-col items-end bg-white/15 px-3.5 py-2 rounded-xl border border-white/20 text-right">
              <span className="text-[11px] text-teal-100">Chuyên khoa phụ trách</span>
              <span className="text-xs font-extrabold text-white">
                {selectedDoctorObj.specialty || 'Đa khoa'}
              </span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Chọn Bệnh nhân & Bác sĩ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                Hồ sơ Bệnh nhân <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-teal-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <select
                  value={formData.patientId}
                  onChange={handlePatientChange}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer"
                >
                  <option value="" disabled>-- Chọn bệnh nhân --</option>
                  {patients.map((pat) => (
                    <option key={pat.id} value={pat.id}>
                      {pat.fullName} {pat.phone ? `- (${pat.phone})` : `(#${pat.id})`}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-[11px] text-gray-400 mt-1.5">
                Chưa có hồ sơ?{' '}
                <Link to="/patients/create" className="text-teal-600 font-bold hover:underline">
                  + Thêm bệnh nhân mới
                </Link>
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                Bác sĩ Chuyên khoa <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Stethoscope className="w-4 h-4 text-teal-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <select
                  value={formData.doctorId}
                  onChange={handleDoctorChange}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer"
                >
                  <option value="" disabled>-- Chọn bác sĩ khám --</option>
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.fullName} — [{doc.specialty || 'Đa khoa'}]
                    </option>
                  ))}
                </select>
              </div>
              {preselectedDoctorId && (
                <p className="text-[11px] text-emerald-600 font-semibold mt-1.5">
                  ✓ Đã tự động chọn bác sĩ từ danh mục Bác sĩ
                </p>
              )}
            </div>
          </div>

          {/* Ngày & Giờ khám */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gray-50/70 border border-gray-100 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                  Ngày hẹn khám <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-teal-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                  Giờ khám cụ thể <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-teal-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="time"
                    required
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-extrabold text-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div>
              <span className="block text-[11px] font-bold text-gray-400 uppercase mb-2">
                Chọn nhanh khung giờ ca khám:
              </span>
              <div className="flex flex-wrap gap-2">
                {QUICK_TIME_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setFormData({ ...formData, time: slot })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      formData.time === slot
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'bg-white text-gray-600 border border-gray-200 hover:border-teal-400 hover:text-teal-700'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Lý do khám */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
              Lý do khám / Ghi chú triệu chứng ban đầu
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <textarea
                rows={3}
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Nhập triệu chứng của bệnh nhân hoặc yêu cầu khám..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              />
            </div>
          </div>

          {/* Nút bấm */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <Link
              to="/appointments"
              className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold transition-colors"
            >
              Hủy bỏ
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isLoading ? 'Đang tạo lịch...' : 'Xác nhận Đặt lịch hẹn'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}