import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  CalendarCheck,
  ArrowLeft,
  User,
  Stethoscope,
  Calendar,
  Clock,
  FileText,
  Save,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const QUICK_TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
];

export default function AppointmentEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(true);

  const [formData, setFormData] = useState({
    patientId: '',
    patientName: '',
    doctorId: '',
    doctorName: '',
    date: '',
    time: '',
    status: 'Scheduled',
    reason: '',
    notes: ''
  });

  useEffect(() => {
    const fetchEditData = async () => {
      setIsFetchingData(true);
      try {
        const [patientsRes, doctorsRes, appRes] = await Promise.all([
          api.get('/patients'),
          api.get('/doctors'),
          api.get('/appointments')
        ]);

        const patientsList = patientsRes.data || [];
        const doctorsList = doctorsRes.data || [];
        const appList = appRes.data || [];

        setPatients(patientsList);
        setDoctors(doctorsList);

        const found = appList.find((a) => String(a.id) === String(id));
        if (found) {
          setFormData({
            patientId: found.patientId || '',
            patientName: found.patientName || '',
            doctorId: found.doctorId || '',
            doctorName: found.doctorName || '',
            date: found.date || '',
            time: found.time || '08:30',
            status: found.status || 'Scheduled',
            reason: found.reason || found.notes || '',
            notes: found.notes || found.reason || ''
          });
        } else {
          toast.error('Không tìm thấy lịch hẹn khám này!');
          navigate('/appointments');
        }
      } catch (error) {
        console.error('Lỗi tải chi tiết lịch hẹn:', error);
        toast.error('Không thể tải thông tin lịch hẹn!');
      } finally {
        setIsFetchingData(false);
      }
    };

    fetchEditData();
  }, [id, navigate]);

  const handlePatientChange = (e) => {
    const selectedId = e.target.value;
    const foundPat = patients.find((p) => String(p.id) === String(selectedId));
    setFormData((prev) => ({
      ...prev,
      patientId: selectedId,
      patientName: foundPat ? foundPat.fullName : prev.patientName
    }));
  };

  const handleDoctorChange = (e) => {
    const selectedId = e.target.value;
    const foundDoc = doctors.find((d) => String(d.id) === String(selectedId));
    setFormData((prev) => ({
      ...prev,
      doctorId: selectedId,
      doctorName: foundDoc ? foundDoc.fullName : prev.doctorName
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const payload = {
        ...formData,
        reason: formData.reason.trim(),
        notes: formData.reason.trim()
      };

      await api.put(`/appointments/${id}`, payload);
      toast.success('Cập nhật lịch hẹn khám thành công!');
      navigate('/appointments');
    } catch (error) {
      console.error('Lỗi cập nhật lịch hẹn:', error);
      toast.error(error.response?.data?.message || 'Không thể cập nhật lịch hẹn!');
    } finally {
      setIsLoading(false);
    }
  };

  const statusOptions = [
    {
      value: 'Scheduled',
      label: 'Chờ xác nhận',
      desc: 'Mới đăng ký lịch',
      activeClass: 'border-blue-600 bg-blue-50/70 text-blue-800',
      dot: 'bg-blue-500'
    },
    {
      value: 'Confirmed',
      label: 'Đã xác nhận',
      desc: 'Bác sĩ đã nhận lịch',
      activeClass: 'border-amber-500 bg-amber-50/70 text-amber-800',
      dot: 'bg-amber-500'
    },
    {
      value: 'Completed',
      label: 'Hoàn thành',
      desc: 'Đã khám xong',
      activeClass: 'border-emerald-600 bg-emerald-50/70 text-emerald-800',
      dot: 'bg-emerald-500'
    },
    {
      value: 'Cancelled',
      label: 'Đã hủy',
      desc: 'Hủy ca khám',
      activeClass: 'border-red-500 bg-red-50/70 text-red-800',
      dot: 'bg-red-500'
    }
  ];

  if (isFetchingData) {
    return <div className="p-8 text-center text-gray-500">Đang tải dữ liệu lịch hẹn #{id}...</div>;
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
              <CalendarCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold">Cập nhật Thông tin Lịch hẹn</h1>
              <p className="text-xs text-teal-50 mt-0.5">
                Điều chỉnh thời gian, bác sĩ phụ trách hoặc trạng thái ca khám #{id}
              </p>
            </div>
          </div>
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
                Đổi nhanh khung giờ ca khám:
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

          {/* Trạng thái ca khám */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-2.5">
              Trạng thái ca khám
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {statusOptions.map((st) => {
                const isSelected = formData.status === st.value;
                return (
                  <button
                    key={st.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, status: st.value })}
                    className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                      isSelected
                        ? st.activeClass
                        : 'border-gray-100 bg-gray-50/50 hover:bg-gray-100/70 text-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${st.dot}`}></span>
                      <span className="text-xs font-extrabold">{st.label}</span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">{st.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lý do khám */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
              Lý do khám / Ghi chú lâm sàng
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <textarea
                rows={3}
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Nhập triệu chứng hoặc ghi chú điều chỉnh..."
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
              <span>{isLoading ? 'Đang lưu...' : 'Lưu cập nhật lịch hẹn'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}