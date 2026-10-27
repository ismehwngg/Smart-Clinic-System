import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import {
  Users,
  Stethoscope,
  CalendarCheck,
  CheckCircle2,
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  Award,
  RefreshCw,
  Activity
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function Statistics() {
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    totalAppointments: 0,
    completedAppointments: 0,
    chartData: [],
    statusBreakdown: []
  });
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnalyticsData = async (showToast = false) => {
    setIsLoading(true);
    try {
      const [statsRes, appointmentsRes, doctorsRes] = await Promise.all([
        api.get('/stats'),
        api.get('/appointments'),
        api.get('/doctors')
      ]);

      setStats(statsRes.data);
      setAppointments(appointmentsRes.data || []);
      setDoctors(doctorsRes.data || []);

      if (showToast) {
        toast.success('Đã làm mới số liệu thống kê!');
      }
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu thống kê:', error);
      toast.error('Không thể tải dữ liệu báo cáo & thống kê!');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  // 1. Gán màu cho từng trạng thái lịch hẹn
  const getStatusColor = (statusName) => {
    if (statusName.includes('lên lịch') || statusName === 'Scheduled') return '#3b82f6';
    if (statusName.includes('xác nhận') || statusName === 'Confirmed') return '#f59e0b';
    if (statusName.includes('hoàn thành') || statusName === 'Completed') return '#10b981';
    if (statusName.includes('hủy') || statusName === 'Cancelled') return '#ef4444';
    return '#6366f1';
  };

  // 2. Chuẩn hóa dữ liệu biểu đồ trạng thái
  const rawChart = stats.chartData || stats.statusBreakdown || stats.appointmentsByStatus || [];
  const normalizedChartData = rawChart.map((item) => {
    const name = item.name || item.status || '';
    const count = item.count !== undefined ? item.count : (item.value !== undefined ? item.value : item.soLuong || 0);
    return {
      name,
      count,
      color: getStatusColor(name)
    };
  });

  const activePieData = normalizedChartData.filter((item) => item.count > 0);

  // 3. Tính số ca chờ khám & tỷ lệ hoàn thành
  const pendingFromChart = normalizedChartData
    .filter((item) => item.name === 'Đã lên lịch' || item.name === 'Đã xác nhận' || item.name === 'Scheduled' || item.name === 'Confirmed')
    .reduce((sum, item) => sum + item.count, 0);

  const pendingCount = pendingFromChart > 0
    ? pendingFromChart
    : Math.max(0, (stats.totalAppointments || 0) - (stats.completedAppointments || 0));

  const completionRate = stats.totalAppointments > 0
    ? Math.round((stats.completedAppointments / stats.totalAppointments) * 100)
    : 0;

  // 4. Tạo dữ liệu Biểu đồ Miền (AreaChart) thống kê lịch hẹn theo ngày
  const getTrendData = () => {
    if (!appointments || appointments.length === 0) {
      return [
        { date: 'Hôm qua', total: 0, completed: 0 },
        { date: 'Hôm nay', total: 0, completed: 0 }
      ];
    }

    const groupedByDate = {};
    appointments.forEach((app) => {
      const d = app.date || 'Chưa rõ';
      if (!groupedByDate[d]) {
        groupedByDate[d] = { rawDate: d, total: 0, completed: 0 };
      }
      groupedByDate[d].total += 1;
      if (app.status === 'Completed') {
        groupedByDate[d].completed += 1;
      }
    });

    return Object.values(groupedByDate)
      .sort((a, b) => new Date(a.rawDate) - new Date(b.rawDate))
      .map((item) => {
        const parts = item.rawDate.split('-');
        const label = parts.length === 3 ? `${parts[2]}/${parts[1]}` : item.rawDate;
        return {
          date: label,
          total: item.total,
          completed: item.completed
        };
      });
  };

  const trendData = getTrendData();

  // 5. Thống kê phân bổ Bác sĩ theo Chuyên khoa
  const getSpecialtyStats = () => {
    const map = {};
    doctors.forEach((doc) => {
      const spec = doc.specialty || 'Đa khoa';
      map[spec] = (map[spec] || 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({
      name,
      count,
      percent: doctors.length > 0 ? Math.round((count / doctors.length) * 100) : 0
    }));
  };

  const specialtyStats = getSpecialtyStats();

  if (isLoading) {
    return (
      <div className="p-8 text-center text-gray-500">
        Đang tổng hợp dữ liệu báo cáo & phân tích...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ================================================================= */}
      {/* HEADER TRANG BÁO CÁO & THỐNG KÊ                                   */}
      {/* ================================================================= */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-up">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center shadow-sm shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
              Trung tâm Phân tích & Thống kê Y tế
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Theo dõi chỉ số vận hành (KPI), lưu lượng bệnh nhân và hiệu suất khám chữa bệnh theo thời gian thực
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchAnalyticsData(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-50 hover:bg-emerald-50 text-gray-700 hover:text-teal-00 text-sm font-semibold border border-gray-200/80 transition-all shrink-0 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Làm mới số liệu</span>
        </button>
      </div>

      {/* ================================================================= */}
      {/* TẦNG 1: 4 THẺ CHỈ SỐ KPI KÈM HIỆU ỨNG NỔI 3D & PROGRESS BAR      */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-up delay-100">
        {/* Thẻ 1 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:-translate-y-1 hover:shadow-md transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Tổng Hồ sơ Bệnh nhân</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-2">{stats.totalPatients}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between text-xs">
            <span className="text-gray-400">Hồ sơ y tế lưu trữ</span>
            <Link to="/patients" className="font-semibold text-blue-600 hover:underline">
              Chi tiết →
            </Link>
          </div>
        </div>

        {/* Thẻ 2 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:-translate-y-1 hover:shadow-md transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Đội ngũ Bác sĩ</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-2">{stats.totalDoctors}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100 shrink-0">
              <Stethoscope className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between text-xs">
            <span className="text-gray-400">{specialtyStats.length} chuyên khoa hoạt động</span>
            <Link to="/doctors" className="font-semibold text-teal-600 hover:underline">
              Chi tiết →
            </Link>
          </div>
        </div>

        {/* Thẻ 3 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:-translate-y-1 hover:shadow-md transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Tổng Lịch hẹn Khám</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-2">{stats.totalAppointments}</h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shrink-0">
              <CalendarCheck className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between text-xs">
            <span className="text-amber-600 font-medium">
              • {pendingCount} ca đang chờ xử lý
            </span>
            <Link to="/appointments" className="font-semibold text-amber-600 hover:underline">
              Xem lịch →
            </Link>
          </div>
        </div>

        {/* Thẻ 4 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:-translate-y-1 hover:shadow-md transition-all duration-300 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Hiệu suất Hoàn thành</p>
              <div className="flex items-baseline gap-2 mt-2">
                <h3 className="text-3xl font-bold text-gray-800">{stats.completedAppointments}</h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                  Đạt {completionRate}%
                </span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="mt-4 pt-2">
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              ></div>
            </div>
            <p className="text-[11px] text-gray-400 mt-1.5">
              Hoàn thành {stats.completedAppointments} / {stats.totalAppointments} tổng lịch hẹn
            </p>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* TẦNG 2: BIỂU ĐỒ CỘT ĐA SẮC (2/3) & BIỂU ĐỒ TRÒN DONUT (1/3)      */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-up delay-200">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-50">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-800">Biểu đồ Số lượng Lịch hẹn theo Trạng thái</h3>
                <p className="text-xs text-gray-400">So sánh trực quan số ca khám ở từng khâu vận hành</p>
              </div>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={normalizedChartData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                />
                <Bar dataKey="count" name="Số lượng ca khám" radius={[8, 8, 0, 0]} barSize={52}>
                  {normalizedChartData.map((entry, index) => (
                    <Cell key={`bar-cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center gap-2.5 pb-3 border-b border-gray-50">
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <PieChartIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-800">Cơ cấu Trạng thái</h3>
              <p className="text-xs text-gray-400">Tỷ trọng phần trăm các ca khám</p>
            </div>
          </div>

          <div className="relative h-52 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={activePieData.length > 0 ? activePieData : [{ name: 'Chưa có dữ liệu', count: 1, color: '#e2e8f0' }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {(activePieData.length > 0 ? activePieData : [{ color: '#e2e8f0' }]).map((entry, index) => (
                    <Cell key={`pie-cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-gray-800">{stats.totalAppointments}</span>
              <span className="text-[11px] text-gray-400 font-medium">Tổng ca khám</span>
            </div>
          </div>

          <div className="space-y-2 pt-3 border-t border-gray-50">
            {normalizedChartData.map((item, idx) => {
              const percent = stats.totalAppointments > 0
                ? Math.round((item.count / stats.totalAppointments) * 100)
                : 0;
              return (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    ></span>
                    <span className="text-gray-600 font-medium">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800">{item.count} ca</span>
                    <span className="text-gray-400 w-9 text-right">({percent}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* TẦNG 3: BIỂU ĐỒ MIỀN XU HƯỚNG NGÀY (2/3) & PHÂN BỔ CHUYÊN KHOA   */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-up delay-300">
        {/* Cột trái (2/3): Biểu đồ Miền AreaChart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-50">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-800">Xu hướng Lịch hẹn theo Thời gian</h3>
                <p className="text-xs text-gray-400">Biến động tổng số ca đặt lịch và số ca hoàn thành theo từng ngày</p>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  name="Tổng ca đặt lịch"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorTotal)"
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  name="Ca đã hoàn thành"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorCompleted)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cột phải (1/3): Thống kê nhân lực theo Chuyên khoa */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 pb-3 mb-5 border-b border-gray-50">
              <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-800">Nhân sự theo Chuyên khoa</h3>
                <p className="text-xs text-gray-400">Phân bổ đội ngũ bác sĩ hiện tại</p>
              </div>
            </div>

            {specialtyStats.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm">
                Chưa có dữ liệu chuyên khoa.
              </div>
            ) : (
              <div className="space-y-4">
                {specialtyStats.map((spec, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-700">{spec.name}</span>
                      <span className="text-gray-500 font-medium">
                        {spec.count} bác sĩ ({spec.percent}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full transition-all duration-500"
                        style={{ width: `${spec.percent}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
            <span>Tổng số chuyên khoa:</span>
            <span className="font-bold text-teal-600 text-sm">{specialtyStats.length} khoa</span>
          </div>
        </div>
      </div>
    </div>
  );
}