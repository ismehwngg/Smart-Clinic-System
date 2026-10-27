import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  UserPlus,
  ArrowLeft,
  User,
  Phone,
  Calendar,
  MapPin,
  HeartPulse,
  AlertTriangle,
  FileText,
  Save,
  Droplets
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function PatientCreate() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    dob: '',
    gender: 'Nam',
    address: '',
    allergies: '',
    medicalHistory: ''
  });

  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.fullName.trim() || !formData.phone.trim()) {
      toast.error('Vui lòng nhập đầy đủ Họ tên và Số điện thoại bệnh nhân!');
      return;
    }
    // KIỂM TRA VALIDATE TRƯỚC KHI LƯU
    if (!validateForm()) {
      toast.error('Vui lòng kiểm tra lại các thông tin bị lỗi!');
      return; 
    }


    setIsLoading(true);
    try {
      const payload = {
        ...formData,
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        allergies: formData.allergies.trim(),
        medicalHistory: formData.medicalHistory.trim()
      };

      await api.post('/patients', payload);
      toast.success('Đã thêm hồ sơ bệnh nhân mới thành công!');
      navigate('/patients');
    } catch (error) {
      console.error('Lỗi khi thêm bệnh nhân:', error);
      toast.error(error.response?.data?.message || 'Không thể tạo hồ sơ bệnh nhân!');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. HÀM KIỂM TRA HỢP LỆ (VALIDATE)
  const validateForm = () => {
    const newErrors = {};
    const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})\b/; // Định dạng SĐT Việt Nam (10 số, bắt đầu bằng 0)

    // Validate Họ tên
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Họ tên không được để trống';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Họ tên phải từ 2 ký tự trở lên';
    }

    // Validate Số điện thoại
    if (!formData.phone.trim()) {
      newErrors.phone = 'Số điện thoại không được để trống';
    } else if (!phoneRegex.test(formData.phone.trim())) {
      newErrors.phone = 'Số điện thoại không hợp lệ (phải gồm 10 số và bắt đầu bằng 0)';
    }

    // Validate Ngày sinh
    if (!formData.dob) {
      newErrors.dob = 'Vui lòng chọn ngày sinh';
    } else {
      const today = new Date();
      const dobDate = new Date(formData.dob);
      if (dobDate >= today) {
        newErrors.dob = 'Ngày sinh không được lớn hơn hoặc bằng ngày hiện tại';
      }
    }

    setErrors(newErrors);
    // Trả về true nếu object newErrors rỗng (không có lỗi nào)
    return Object.keys(newErrors).length === 0;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-up">
      {/* Thanh điều hướng quay lại */}
      <div className="flex items-center justify-between">
        <Link
          to="/patients"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-teal-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách bệnh nhân</span>
        </Link>
      </div>

      {/* Khung Biểu mẫu chính */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
        {/* Banner Header */}
        <div className="p-6 bg-gradient-to-r from-teal-600 to-emerald-600 text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center border border-white/30 shrink-0">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold">Tiếp nhận Hồ sơ Bệnh nhân Mới</h1>
              <p className="text-xs text-teal-50 mt-0.5">
                Khai báo thông tin hành chính, nhóm máu và tiền sử bệnh lý y tế
              </p>
            </div>
          </div>

          {/* Live Avatar Preview */}
          <div className="hidden sm:flex items-center gap-3 bg-white/15 backdrop-blur-xs px-3.5 py-2 rounded-2xl border border-white/20">
            <div className="text-left">
              <p className="text-xs font-extrabold text-white truncate max-w-[140px]">
                {formData.fullName || 'Họ tên Bệnh nhân'}
              </p>
              <span className="text-[11px] text-teal-100">Hồ sơ mới</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* PHẦN 1: THÔNG TIN HÀNH CHÍNH */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
              1. Thông tin hành chính
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${errors.fullName ? 'text-red-500' : 'text-teal-600'}`} />
                  <input
                    type="text"
                    value={formData.fullName}
                    // Khi user gõ lại, tự động xóa lỗi của trường này
                    onChange={(e) => {
                      setFormData({ ...formData, fullName: e.target.value });
                      if (errors.fullName) setErrors({ ...errors, fullName: null }); 
                    }}
                    placeholder="Nguyễn Văn A"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 ${
                      errors.fullName 
                        ? 'bg-red-50/50 border-red-300 text-red-900 focus:ring-red-500/20 focus:border-red-500' // Trạng thái LỖI
                        : 'bg-gray-50 border-gray-200 text-gray-800 focus:bg-white focus:ring-teal-500/20 focus:border-teal-500' // Trạng thái BÌNH THƯỜNG
                    }`}
                  />
                </div>
                {/* HIỂN THỊ DÒNG TEXT LỖI */}
                {errors.fullName && (
                  <p className="mt-1.5 text-[11px] font-semibold text-red-500 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-red-500"></span>
                    {errors.fullName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                  Số điện thoại <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${errors.phone ? 'text-red-500' : 'text-teal-600'}`} />
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData({ ...formData, phone: e.target.value });
                      if (errors.phone) setErrors({ ...errors, phone: null }); 
                    }}
                    placeholder="0901234567"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 ${
                      errors.phone 
                        ? 'bg-red-50/50 border-red-300 text-red-900 focus:ring-red-500/20 focus:border-red-500' 
                        : 'bg-gray-50 border-gray-200 text-gray-800 focus:bg-white focus:ring-teal-500/20 focus:border-teal-500'
                    }`}
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1.5 text-[11px] font-semibold text-red-500 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-red-500"></span>
                    {errors.phone}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                  Ngày sinh <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${errors.dob ? 'text-red-500' : 'text-teal-600'}`} />
                  <input
                    type="date"
                    required
                    value={formData.dob}
                    onChange={(e) => {
                      setFormData({ ...formData, dob: e.target.value });
                      if (errors.dob) setErrors({ ...errors, dob: null }); 
                    }}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 cursor-pointer ${
                      errors.dob 
                        ? 'bg-red-50/50 border-red-300 text-red-900 focus:ring-red-500/20 focus:border-red-500' 
                        : 'bg-white border-gray-200 text-gray-800 focus:ring-teal-500/20 focus:border-teal-500'
                    }`}
                  />
                </div>
                {errors.dob && (
                  <p className="mt-1.5 text-[11px] font-semibold text-red-500 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-red-500"></span>
                    {errors.dob}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                  Giới tính
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all cursor-pointer"
                >
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
            </div>

            <div className="mt-5">
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                Địa chỉ cư trú
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-teal-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="VD: Số 123, Đường Cầu Giấy, Hà Nội"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                />
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* PHẦN 2: THÔNG TIN Y TẾ & TIỀN SỬ BỆNH */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
              2. Thông tin Y tế & Tiền sử bệnh lý
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Dị ứng */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2 flex items-center gap-1.5 text-amber-700">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Tiền sử dị ứng (Thuốc / Thực phẩm)
                </label>
                <textarea
                  rows={3}
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  placeholder="VD: Dị ứng Penicillin, Hải sản..."
                  className="w-full p-3 rounded-xl bg-amber-50/40 border border-amber-200 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                />
              </div>

              {/* Tiền sử bệnh nền */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2 flex items-center gap-1.5 text-teal-700">
                  <HeartPulse className="w-4 h-4 text-teal-600" />
                  Tiền sử bệnh nền / Bệnh mạn tính
                </label>
                <textarea
                  rows={3}
                  value={formData.medicalHistory}
                  onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                  placeholder="VD: Huyết áp cao, Tiểu đường tuýp 2, Hen suyễn..."
                  className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* THANH NÚT BẤM LƯU / HỦY */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <Link
              to="/patients"
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
              <span>{isLoading ? 'Đang lưu...' : 'Lưu hồ sơ Bệnh nhân'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}