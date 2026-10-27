import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import {
  Activity,
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CalendarCheck,
  Pill,
  Receipt,
  AlertCircle,
  Sparkles,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const DEMO_ACCOUNTS = [
  { role: 'Quản trị viên', username: 'admin', password: '123', badge: 'Full quyền' },
  { role: 'Lễ tân', username: 'letan', password: '123', badge: 'Tiếp đón & Thu ngân' },
  { role: 'Bác sĩ', username: 'bacsi', password: '123', badge: 'Khám & Kê đơn' }
];

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [errors, setErrors] = useState({});
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Nếu đã đăng nhập rồi thì đẩy thẳng vào Dashboard
  if (localStorage.getItem('token')) {
    return <Navigate to="/dashboard" replace />;
  }

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username.trim()) {
      newErrors.username = 'Vui lòng nhập tên tài khoản';
    }
    if (!formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorMsg('');
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Điền nhanh tài khoản demo khi click
  const handleQuickFill = (acc) => {
    setFormData({ username: acc.username, password: acc.password });
    setErrors({});
    setErrorMsg('');
    toast.success(`Đã điền tài khoản ${acc.role} (${acc.username})`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrorMsg('');

    try {
      const response = await api.post('/auth/login', formData);

      // Lưu Token và thông tin người dùng vào localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // Chuyển hướng về trang chủ Dashboard
      toast.success(`Xin chào, ${response.data.user.fullName}!`);
      navigate('/dashboard');
    } catch (error) {
      const msg = error.response?.data?.message || 'Sai tài khoản hoặc không thể kết nối máy chủ!';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-50">
      {/* ===================================================================== */}
      {/* CỘT TRÁI: BANNER THƯƠNG HIỆU & GIỚI THIỆU HỆ THỐNG (Ẩn trên Mobile)    */}
      {/* ===================================================================== */}
      <div className="hidden lg:flex lg:w-7/12 relative overflow-hidden bg-gradient-to-br from-teal-800 via-teal-700 to-emerald-900 text-white p-12 flex-col justify-between">
        {/* Các khối ánh sáng trang trí nền (Glassmorphism Glow) */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-[28rem] h-[28rem] bg-emerald-400/15 rounded-full blur-3xl pointer-events-none" />

        {/* Tầng 1: Logo & Badge */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center shadow-lg">
              <Activity className="w-6 h-6 text-teal-200" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-white">
                SmartClinic
              </span>
              <span className="block text-[11px] font-medium text-teal-200/90 uppercase tracking-wider">
                Healthcare SaaS Platform
              </span>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 border border-white/20 backdrop-blur-md text-teal-100">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
            Bảo mật chuẩn Y tế
          </span>
        </div>

        {/* Tầng 2: Thông điệp chính & 3 Thẻ tính năng nổi bật */}
        <div className="relative z-10 max-w-xl space-y-8 my-auto">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-teal-500/20 border border-teal-300/30 text-teal-100 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Hệ thống Quản trị Phòng khám Thông minh v2.0</span>
            </div>
            <h1 className="text-4xl xl:text-5xl font-black leading-tight tracking-tight">
              Số hóa quy trình khám chữa bệnh toàn diện.
            </h1>
            <p className="text-teal-100/85 text-base leading-relaxed">
              Kết nối liền mạch từ khâu tiếp đón bệnh nhân, điều phối lịch hẹn bác sĩ, kê đơn thuốc lâm sàng cho đến tự động đối soát viện phí chỉ trên một nền tảng duy nhất.
            </p>
          </div>

          {/* 3 Card điểm nhấn nghiệp vụ */}
          <div className="grid grid-cols-1 gap-3.5 pt-2">
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 hover:bg-white/15 transition-all">
              <div className="p-2.5 rounded-xl bg-teal-400/20 text-teal-200 shrink-0">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Điều phối Lịch hẹn Chống trùng ca</h3>
                <p className="text-xs text-teal-100/80 mt-0.5">
                  Kiểm soát xung đột lịch trình hai chiều giữa Bác sĩ và Bệnh nhân theo thời gian thực.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 hover:bg-white/15 transition-all">
              <div className="p-2.5 rounded-xl bg-emerald-400/20 text-emerald-200 shrink-0">
                <Pill className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Bệnh án & Kê đơn Thuốc Điện tử</h3>
                <p className="text-xs text-teal-100/80 mt-0.5">
                  Tích hợp danh mục thuốc chuẩn hóa, hỗ trợ lưu nháp lâm sàng và tính liều lượng nhanh chóng.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 hover:bg-white/15 transition-all">
              <div className="p-2.5 rounded-xl bg-amber-400/20 text-amber-200 shrink-0">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Tự động hóa Viện phí & Hóa đơn</h3>
                <p className="text-xs text-teal-100/80 mt-0.5">
                  Tự động tổng hợp tiền khám và đơn thuốc ngay khi hoàn tất ca khám, xuất biên lai tức thì.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tầng 3: Footer bản quyền */}
        <div className="relative z-10 flex items-center justify-between text-xs text-teal-200/70 border-t border-white/10 pt-6">
          <span>© 2026 SmartClinic System. All rights reserved.</span>
          <span>Phát triển cho hệ thống Y tế Số</span>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* CỘT PHẢI: FORM ĐĂNG NHẬP & CHỌN NHANH TÀI KHOẢN DEMO                  */}
      {/* ===================================================================== */}
      <div className="w-full lg:w-5/12 flex items-center justify-center p-6 sm:p-12 bg-white">
        <div className="w-full max-w-md space-y-7 animate-fade-up">
          {/* Logo hiển thị riêng trên màn hình nhỏ (Mobile/Tablet) */}
          <div className="flex lg:hidden items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <span className="text-lg font-extrabold text-gray-900">SmartClinic</span>
              <span className="block text-[10px] font-semibold text-teal-600 uppercase">
                Healthcare System
              </span>
            </div>
          </div>

          {/* Tiêu đề Form */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Chào mừng!
            </h2>
            <p className="text-sm text-gray-500 mt-1.5">
              Vui lòng đăng nhập tài khoản nhân sự để truy cập bàn làm việc.
            </p>
          </div>

          {/* Thông báo lỗi từ Server (nếu có) */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-red-700 text-xs sm:text-sm font-semibold animate-fade-up">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form nhập liệu */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Ô Tên đăng nhập */}
            <div>
              <label
                className={`block text-xs font-bold uppercase mb-2 ${
                  errors.username ? 'text-red-700' : 'text-gray-700'
                }`}
              >
                Tên đăng nhập <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User
                  className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                    errors.username ? 'text-red-500' : 'text-teal-600'
                  }`}
                />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Nhập tên tài khoản (VD: admin)"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                    errors.username
                      ? 'bg-red-50/50 border-red-300 text-red-900 focus:ring-red-500/20 focus:border-red-500'
                      : 'bg-gray-50/80 border-gray-200 text-gray-800 focus:bg-white focus:ring-teal-500/20 focus:border-teal-600'
                  }`}
                />
              </div>
              {errors.username && (
                <p className="mt-1.5 text-[11px] font-semibold text-red-500 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-red-500" />
                  {errors.username}
                </p>
              )}
            </div>

            {/* Ô Mật khẩu */}
            <div>
              <label
                className={`block text-xs font-bold uppercase mb-2 ${
                  errors.password ? 'text-red-700' : 'text-gray-700'
                }`}
              >
                Mật khẩu <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock
                  className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                    errors.password ? 'text-red-500' : 'text-teal-600'
                  }`}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Nhập mật khẩu của bạn"
                  className={`w-full pl-10 pr-11 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                    errors.password
                      ? 'bg-red-50/50 border-red-300 text-red-900 focus:ring-red-500/20 focus:border-red-500'
                      : 'bg-gray-50/80 border-gray-200 text-gray-800 focus:bg-white focus:ring-teal-500/20 focus:border-teal-600'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-[11px] font-semibold text-red-500 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-red-500" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Nút Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold text-sm shadow-md shadow-teal-600/20 hover:shadow-lg hover:shadow-teal-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang xác thực thông tin...</span>
                </>
              ) : (
                <>
                  <span>Đăng nhập hệ thống</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Khu vực Chọn nhanh Tài khoản Demo (1-Click Fill) */}
          <div className="pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Tài khoản trải nghiệm nhanh (1-Click)
              </span>
              <span className="text-[11px] text-teal-600 font-semibold">
                Mật khẩu: 123
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {DEMO_ACCOUNTS.map((acc) => {
                const isSelected = formData.username === acc.username;
                return (
                  <button
                    key={acc.username}
                    type="button"
                    onClick={() => handleQuickFill(acc)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-teal-600 bg-teal-50/70 ring-2 ring-teal-500/15'
                        : 'border-gray-200/80 bg-gray-50/60 hover:bg-teal-50/40 hover:border-teal-200'
                    }`}
                  >
                    <div className="text-xs font-extrabold text-gray-800 truncate">
                      {acc.role}
                    </div>
                    <div className="text-[11px] font-mono text-teal-700 font-semibold mt-0.5">
                      @{acc.username}
                    </div>
                    <div className="text-[10px] text-gray-400 truncate mt-1">
                      {acc.badge}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}