import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  CalendarDays, 
  UserPlus, 
  CalendarPlus, 
  Users, 
  Stethoscope, 
  CalendarCheck, 
  ChevronRight, 
  Phone, 
  Clock,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Activity
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    totalAppointments: 0,
    completedAppointments: 0,
    statusBreakdown: []
  });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [doctorsList, setDoctorsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const role = currentUser?.role || 'Receptionist';

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, appointmentsRes, doctorsRes] = await Promise.all([
          api.get('/stats'),
          api.get('/appointments'),
          api.get('/doctors')
        ]);

        setStats(statsRes.data);

        const sorted = (appointmentsRes.data || []).sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );
        setRecentAppointments(sorted.slice(0, 5));
        setDoctorsList((doctorsRes.data || []).slice(0, 4));
      } catch (error) {
        console.error('Lỗi khi tải trang chủ:', error);
        toast.error('Không thể tải dữ liệu bàn làm việc!');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // 1. Lời chào theo khung giờ
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  // 2. Thứ, Ngày, Tháng, Năm tiếng Việt
  const getTodayFormatted = () => {
    const today = new Date();
    return today.toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // 3. Định dạng ngày
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  // 4. Tính ca chờ khám
  const rawChart = stats.chartData || stats.statusBreakdown || stats.appointmentsByStatus || [];
  const pendingFromChart = rawChart
    .filter((item) => (item.name || item.status) === 'Đã lên lịch' || (item.name || item.status) === 'Đã xác nhận' || (item.name || item.status) === 'Scheduled')
    .reduce((sum, item) => sum + (item.count || item.value || 0), 0);

  const pendingCount = pendingFromChart > 0 
    ? pendingFromChart 
    : Math.max(0, (stats.totalAppointments || 0) - (stats.completedAppointments || 0));

  // 5. Badge trạng thái
  const renderStatusBadge = (status) => {
    const statusMap = {
      Scheduled: { label: 'Đã lên lịch', classes: 'bg-blue-50 text-blue-700 border-blue-200' },
      Confirmed: { label: 'Đã xác nhận', classes: 'bg-amber-50 text-amber-700 border-amber-200' },
      Completed: { label: 'Đã hoàn thành', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      Cancelled: { label: 'Đã hủy', classes: 'bg-red-50 text-red-700 border-red-200' }
    };
    const current = statusMap[status] || { label: status, classes: 'bg-gray-50 text-gray-700 border-gray-200' };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${current.classes}`}>
        {current.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-gray-500">
        Đang khởi tạo không gian làm việc SmartClinic...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ================================================================= */}
      {/* 1. HERO BANNER CHÀO MỪNG SINH ĐỘNG CÓ HÌNH MINH HỌA Y TẾ             */}
      {/* ================================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-500 p-6 sm:p-8 text-white shadow-lg animate-fade-up">
        {/* Họa tiết trang trí nền */}
        <div className="absolute -right-10 -top-10 w-56 h-56 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
        <div className="absolute right-40 -bottom-16 w-48 h-48 rounded-full bg-cyan-300/20 blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-medium text-emerald-50 border border-white/20 shadow-xs">
              <CalendarDays className="w-3.5 h-3.5 text-emerald-200" />
              <span className="capitalize">{getTodayFormatted()}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              {getGreeting()}, {currentUser?.fullName || 'Nhân viên y tế'}!
            </h1>

            <p className="text-sm sm:text-base text-emerald-50/90 leading-relaxed">
              Hệ thống điều hành phòng khám đang hoạt động ổn định. Hôm nay có tổng số{' '}
              <span className="font-bold text-white underline decoration-amber-300 decoration-2 underline-offset-4">
                {pendingCount} ca khám
              </span>{' '}
              đang chờ xử lý tiếp đón và khám chữa bệnh.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-medium text-emerald-100">
              <span className="inline-flex items-center gap-1.5 bg-black/10 px-3 py-1 rounded-lg">
                <ShieldCheck className="w-4 h-4 text-emerald-300" /> Bảo mật phân quyền RBAC
              </span>
              <span className="inline-flex items-center gap-1.5 bg-black/10 px-3 py-1 rounded-lg">
                <Activity className="w-4 h-4 text-emerald-300" /> Đồng bộ Real-time
              </span>
            </div>
          </div>

          {/* Cụm nút thao tác nhanh trên Banner */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch gap-3 shrink-0">
            {(role === 'Admin' || role === 'Receptionist') ? (
              <>
                <Link
                  to="/patients/create"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white text-teal-700 hover:bg-emerald-50 font-bold text-sm shadow-md transition-all transform hover:-translate-y-0.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ Tiếp nhận Bệnh nhân mới</span>
                </Link>

                <Link
                  to="/appointments/create"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-teal-900/40 hover:bg-teal-900/60 text-white border border-white/25 backdrop-blur-md font-semibold text-sm transition-all"
                >
                  <CalendarPlus className="w-4 h-4" />
                  <span>+ Đặt Lịch hẹn khám</span>
                </Link>
              </>
            ) : (
              <Link
                to="/appointments"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-white text-teal-700 hover:bg-emerald-50 font-bold text-sm shadow-md transition-all"
              >
                <span>Xem danh sách ca khám hôm nay</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 2. 4 THẺ TÁC VỤ NHANH (VISUAL ACTION CARDS)                      */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-up delay-100">
        {/* Thẻ 1 */}
        <Link 
          to="/patients" 
          className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-teal-300 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100 group-hover:bg-teal-600 group-hover:text-white transition-colors">
              <Users className="w-6 h-6" />
            </div>
            <span className="p-2 text-gray-300 group-hover:text-teal-600 transition-colors">
              <ArrowUpRight className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-6">
            <h3 className="text-lg font-bold text-gray-800 group-hover:text-teal-700 transition-colors">
              Quản lý Bệnh nhân
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              {stats.totalPatients} hồ sơ y tế đang lưu trữ trong hệ thống
            </p>
          </div>
        </Link>

        {/* Thẻ 2 */}
        <Link 
          to="/doctors" 
          className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-emerald-300 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Stethoscope className="w-6 h-6" />
            </div>
            <span className="p-2 text-gray-300 group-hover:text-emerald-600 transition-colors">
              <ArrowUpRight className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-6">
            <h3 className="text-lg font-bold text-gray-800 group-hover:text-emerald-700 transition-colors">
              Đội ngũ Bác sĩ
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              {stats.totalDoctors} bác sĩ chuyên khoa sẵn sàng khám chữa bệnh
            </p>
          </div>
        </Link>

        {/* Thẻ 3 */}
        <Link 
          to="/appointments" 
          className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-amber-300 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <span className="p-2 text-gray-300 group-hover:text-amber-600 transition-colors">
              <ArrowUpRight className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-6">
            <h3 className="text-lg font-bold text-gray-800 group-hover:text-amber-700 transition-colors">
              Lịch hẹn Khám
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              {stats.totalAppointments} lịch hẹn tổng, {pendingCount} đang chờ khám
            </p>
          </div>
        </Link>

        {/* Thẻ 4 */}
        <Link 
          to="/statistics" 
          className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-purple-300 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Sparkles className="w-6 h-6" />
            </div>
            <span className="p-2 text-gray-300 group-hover:text-purple-600 transition-colors">
              <ArrowUpRight className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-6">
            <h3 className="text-lg font-bold text-gray-800 group-hover:text-purple-700 transition-colors">
              Trung tâm Thống kê
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Xem biểu đồ phân tích hiệu suất và báo cáo doanh thu
            </p>
          </div>
        </Link>
      </div>

      {/* ================================================================= */}
      {/* 3. DÒNG THỜI GIAN CA KHÁM (2/3) & ĐỘI NGŨ BÁC SĨ CHÂN DUNG (1/3)    */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-up delay-200">
        {/* Cột trái (2/3): Bảng Lịch hẹn gần đây */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-800">Dòng thời gian Ca khám Gần đây</h3>
                <p className="text-xs text-gray-400">Các cuộc hẹn tiếp nhận mới nhất trong hệ thống</p>
              </div>
            </div>

            <Link 
              to="/appointments" 
              className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg transition-colors"
            >
              Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentAppointments.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">
              Chưa có lịch hẹn nào được ghi nhận.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 text-gray-500 text-xs uppercase border-b border-gray-100">
                    <th className="p-3 font-semibold">Bệnh nhân</th>
                    <th className="p-3 font-semibold">Bác sĩ phụ trách</th>
                    <th className="p-3 font-semibold">Thời gian</th>
                    <th className="p-3 font-semibold text-right">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                  {recentAppointments.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-xs border border-teal-100 shrink-0">
                            {app.patientName ? app.patientName.charAt(0).toUpperCase() : 'P'}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">{app.patientName}</p>
                            <span className="text-[11px] font-mono text-gray-400">ID: {app.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-gray-700 font-medium">{app.doctorName}</td>
                      <td className="p-3">
                        <p className="font-semibold text-gray-800">{app.time}</p>
                        <p className="text-xs text-gray-400">{formatDate(app.date)}</p>
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        {renderStatusBadge(app.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Cột phải (1/3): Đội ngũ Bác sĩ tiêu biểu (Có Avatar hình ảnh sinh động) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-800">Bác sĩ Tiêu biểu</h3>
                  <p className="text-xs text-gray-400">Đội ngũ trực ban hôm nay</p>
                </div>
              </div>

              <Link 
                to="/doctors" 
                className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-0.5"
              >
                Tất cả <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {doctorsList.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm">
                Chưa có dữ liệu bác sĩ.
              </div>
            ) : (
              <div className="space-y-3.5">
                {doctorsList.map((doc, idx) => (
                  <div 
                    key={doc.id} 
                    className="p-3 rounded-xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/20 transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar hình ảnh chân dung sinh động */}
                      <img 
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${doc.fullName || idx}`} 
                        alt={doc.fullName} 
                        className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 shrink-0 shadow-xs"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-800 truncate">{doc.fullName}</p>
                        <span className="inline-block px-2 py-0.5 bg-teal-50 text-teal-700 border border-teal-100 rounded text-[10px] font-semibold mt-0.5">
                          {doc.specialty}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500 font-mono">
                        <Phone className="w-3 h-3 text-emerald-600" />
                        {doc.phone}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-5 pt-3 border-t border-gray-50 text-center">
            <Link 
              to="/appointments/create" 
              className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold transition-colors"
            >
              <CalendarPlus className="w-3.5 h-3.5" />
              Đặt lịch hẹn khám ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}