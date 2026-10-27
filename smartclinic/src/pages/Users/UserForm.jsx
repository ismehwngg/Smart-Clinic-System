import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  UserPlus,
  UserCheck,
  ArrowLeft,
  ShieldCheck,
  Stethoscope,
  Headset,
  KeyRound,
  User,
  Lock,
  Save
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

// ĐỔI ĐƯỜNG DẪN NÀY CHO KHỚP VỚI FILE index.jsx CỦA BẠN (vd: '/auth/users' hoặc '/users')
const API_ENDPOINT = '/auth/users';

export default function UserForm() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    password: '',
    role: 'Receptionist'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEditMode);
  const [errors, setErrors] = useState({});

  // HÀM VALIDATE DÙNG CHUNG CHO CẢ CREATE & EDIT
  const validateForm = () => {
    const newErrors = {};
    const usernameRegex = /^[a-zA-Z0-9_]+$/; // Chỉ cho phép chữ, số, dấu gạch dưới

    // Validate Họ tên
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Họ tên nhân sự không được để trống';
    }

    // Validate Tên đăng nhập
    if (!formData.username.trim()) {
      newErrors.username = 'Tên đăng nhập không được để trống';
    } else if (formData.username.trim().length < 4) {
      newErrors.username = 'Tên đăng nhập phải từ 4 ký tự trở lên';
    } else if (!usernameRegex.test(formData.username.trim())) {
      newErrors.username = 'Tên đăng nhập viết liền không dấu, không chứa ký tự đặc biệt';
    }

    // Validate Mật khẩu (Logic thay đổi theo Mode)
    if (!isEditMode && !formData.password.trim()) {
      // Khi Tạo mới: Bắt buộc nhập
      newErrors.password = 'Vui lòng khởi tạo mật khẩu cho tài khoản mới';
    } else if (formData.password.trim() && formData.password.trim().length < 6) {
      // Bất kể Tạo mới hay Sửa: Nếu đã nhập thì phải đủ 6 ký tự
      newErrors.password = 'Mật khẩu bảo mật phải có ít nhất 6 ký tự';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Nếu là chế độ Sửa (có id trên URL), tải thông tin tài khoản hiện tại
  useEffect(() => {
    if (!isEditMode) return;

    const fetchUserDetail = async () => {
      try {
        // Thử gọi lấy danh sách rồi tìm theo id (an toàn nhất kể cả khi backend không có API get/:id riêng)
        const res = await api.get(API_ENDPOINT);
        const list = Array.isArray(res.data) ? res.data : res.data?.users || [];
        const found = list.find((u) => String(u.id) === String(id));

        if (found) {
          setFormData({
            fullName: found.fullName || '',
            username: found.username || '',
            password: '', // Để trống, chỉ nhập nếu muốn đổi mật khẩu mới
            role: found.role || 'Receptionist'
          });
        } else {
          toast.error('Không tìm thấy tài khoản nhân sự này!');
          navigate('/users');
        }
      } catch (error) {
        console.error('Lỗi tải thông tin tài khoản:', error);
        toast.error('Không thể tải dữ liệu tài khoản!');
      } finally {
        setIsFetching(false);
      }
    };

    fetchUserDetail();
  }, [id, isEditMode, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // KIỂM TRA VALIDATE TRƯỚC KHI GỌI API
    if (!validateForm()) {
      toast.error('Vui lòng kiểm tra lại các thông tin bị lỗi!');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        fullName: formData.fullName.trim(),
        username: formData.username.trim(),
        role: formData.role
      };

      // Chỉ gửi trường password nếu người dùng có nhập
      if (formData.password.trim()) {
        payload.password = formData.password.trim();
      }

      if (isEditMode) {
        await api.put(`${API_ENDPOINT}/${id}`, payload);
        toast.success('Cập nhật thông tin tài khoản thành công!');
      } else {
        await api.post(API_ENDPOINT, payload);
        toast.success('Đã cấp tài khoản nhân sự mới thành công!');
      }

      navigate('/users');
    } catch (error) {
      console.error('Lỗi lưu tài khoản:', error);
      toast.error(
        error.response?.data?.message || 'Có lỗi xảy ra khi lưu thông tin tài khoản!'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const roles = [
    {
      value: 'Admin',
      title: 'Quản trị viên (Admin)',
      desc: 'Toàn quyền quản trị hệ thống, nhân sự và báo cáo thống kê',
      icon: ShieldCheck,
      activeClass: 'border-purple-600 bg-purple-50/60 text-purple-800',
      iconClass: 'text-purple-600 bg-purple-100'
    },
    {
      value: 'Doctor',
      title: 'Bác sĩ (Doctor)',
      desc: 'Xem lịch hẹn khám, quản lý hồ sơ bệnh án và chuyên môn',
      icon: Stethoscope,
      activeClass: 'border-teal-600 bg-teal-50/60 text-teal-800',
      iconClass: 'text-teal-600 bg-teal-100'
    },
    {
      value: 'Receptionist',
      title: 'Lễ tân (Receptionist)',
      desc: 'Tiếp đón bệnh nhân, tạo mới và điều phối lịch hẹn khám',
      icon: Headset,
      activeClass: 'border-amber-500 bg-amber-50/60 text-amber-800',
      iconClass: 'text-amber-600 bg-amber-100'
    }
  ];

  if (isFetching) {
    return (
      <div className="p-8 text-center text-gray-500">
        Đang tải thông tin tài khoản nhân sự...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-up">
      {/* Header điều hướng quay lại */}
      <div className="flex items-center justify-between">
        <Link
          to="/users"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-teal-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách tài khoản</span>
        </Link>
      </div>

      {/* Khung Form chính */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
        {/* Banner tiêu đề */}
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-teal-600 to-emerald-600 text-white flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center border border-white/30 shrink-0">
            {isEditMode ? <UserCheck className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
          </div>
          <div>
            <h1 className="text-xl font-extrabold">
              {isEditMode ? 'Chỉnh sửa Tài khoản & Phân quyền' : 'Cấp Tài khoản Nhân sự Mới'}
            </h1>
            <p className="text-xs text-teal-50 mt-0.5">
              {isEditMode
                ? `Đang cập nhật thông tin cho tài khoản #${id}`
                : 'Điền thông tin đăng nhập và gán vai trò truy cập hệ thống'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Hàng 1: Họ tên & Username */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className={`block text-xs font-bold uppercase mb-2 ${errors.fullName ? 'text-red-700' : 'text-gray-700'}`}>
                Họ và tên nhân sự <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${errors.fullName ? 'text-red-500' : 'text-gray-400'}`} />
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => {
                    setFormData({ ...formData, fullName: e.target.value });
                    if (errors.fullName) setErrors({ ...errors, fullName: null });
                  }}
                  placeholder="VD: Nguyễn Văn A"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 ${
                    errors.fullName 
                      ? 'bg-red-50/50 border-red-300 text-red-900 focus:ring-red-500/20 focus:border-red-500' 
                      : 'bg-gray-50 border-gray-200 text-gray-800 focus:bg-white focus:ring-teal-500/20 focus:border-teal-500'
                  }`}
                />
              </div>
              {errors.fullName && (
                <p className="mt-1.5 text-[11px] font-semibold text-red-500 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-red-500"></span>
                  {errors.fullName}
                </p>
              )}
            </div>

            <div>
              <label className={`block text-xs font-bold uppercase mb-2 ${errors.username ? 'text-red-700' : 'text-gray-700'}`}>
                Tên đăng nhập (Username) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <KeyRound className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${errors.username ? 'text-red-500' : 'text-gray-400'}`} />
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => {
                    setFormData({ ...formData, username: e.target.value });
                    if (errors.username) setErrors({ ...errors, username: null });
                  }}
                  placeholder="VD: letan01, bacsi_minh..."
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-mono transition-all focus:outline-none focus:ring-2 ${
                    errors.username 
                      ? 'bg-red-50/50 border-red-300 text-red-900 focus:ring-red-500/20 focus:border-red-500' 
                      : 'bg-gray-50 border-gray-200 text-gray-800 focus:bg-white focus:ring-teal-500/20 focus:border-teal-500'
                  }`}
                />
              </div>
              {errors.username && (
                <p className="mt-1.5 text-[11px] font-semibold text-red-500 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-red-500"></span>
                  {errors.username}
                </p>
              )}
            </div>
          </div>
          {/* Hàng 2: Mật khẩu */}
          <div className="mt-5 mb-5">
            <label className={`block text-xs font-bold uppercase mb-2 ${errors.password ? 'text-red-700' : 'text-gray-700'}`}>
              {isEditMode ? 'Đổi mật khẩu mới (Để trống nếu giữ nguyên)' : 'Mật khẩu khởi tạo'}{' '}
              {!isEditMode && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
              <Lock className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${errors.password ? 'text-red-500' : 'text-gray-400'}`} />
              <input
                type="password"
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  if (errors.password) setErrors({ ...errors, password: null });
                }}
                placeholder={
                  isEditMode
                    ? 'Nhập mật khẩu mới nếu muốn cấp lại mật khẩu...'
                    : 'Nhập mật khẩu tối thiểu 6 ký tự...'
                }
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 ${
                  errors.password 
                    ? 'bg-red-50/50 border-red-300 text-red-900 focus:ring-red-500/20 focus:border-red-500' 
                    : 'bg-gray-50 border-gray-200 text-gray-800 focus:bg-white focus:ring-teal-500/20 focus:border-teal-500'
                }`}
              />
            </div>
            {errors.password && (
              <p className="mt-1.5 text-[11px] font-semibold text-red-500 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-red-500"></span>
                {errors.password}
              </p>
            )}
          </div>

          {/* Hàng 3: Chọn Vai trò phân quyền (Role Cards) */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-3">
              Vai trò & Quyền hạn truy cập (RBAC) <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {roles.map((r) => {
                const IconComp = r.icon;
                const isSelected = formData.role === r.value;
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, role: r.value })}
                    className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? r.activeClass
                        : 'border-gray-100 bg-gray-50/60 hover:bg-gray-100/70 text-gray-700'
                    }`}
                  >
                    <div>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${r.iconClass}`}>
                        <IconComp className="w-5 h-5" />
                      </div>
                      <h4 className="font-extrabold text-sm">{r.title}</h4>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{r.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nút Hủy & Lưu thông tin (Màu xanh lá teal-600) */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <Link
              to="/users"
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
              <span>{isLoading ? 'Đang lưu...' : isEditMode ? 'Lưu cập nhật' : 'Tạo tài khoản'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}