import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  UserPlus,
  ArrowLeft,
  User,
  Phone,
  Mail,
  Stethoscope,
  Award,
  FileText,
  Save
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const SPECIALTIES = [
  'Tai - Mũi - Họng',
  'Răng - Hàm - Mặt',
  'Sản phụ khoa',
  'Nội tổng quát',
  'Ngoại khoa',
  'Nhi khoa',
  'Da liễu'
];

export default function DoctorCreate() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    fullName: '',
    specialty: 'Tai - Mũi - Họng',
    phone: '',
    email: '',
    experience: '',
    bio: ''
  });

  // 2. HÀM KIỂM TRA HỢP LỆ
  const validateForm = () => {
    const newErrors = {};
    const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})\b/; // Định dạng SĐT VN

    // Validate Họ tên
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Họ tên bác sĩ không được để trống';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Họ tên phải từ 2 ký tự trở lên';
    }

    // Validate Số điện thoại
    if (!formData.phone.trim()) {
      newErrors.phone = 'Số điện thoại không được để trống';
    } else if (!phoneRegex.test(formData.phone.trim())) {
      newErrors.phone = 'Số điện thoại không hợp lệ (phải gồm 10 số và bắt đầu bằng 0)';
    }

    // Validate Chuyên khoa
    if (!formData.specialty || !formData.specialty.trim()) {
      newErrors.specialty = 'Vui lòng chọn chuyên khoa';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Vui lòng kiểm tra lại các thông tin bị lỗi!');
      return; 
    }

    // if (!formData.fullName.trim() || !formData.phone.trim()) {
    //   toast.error('Vui lòng nhập đầy đủ Họ tên và Số điện thoại bác sĩ!');
    //   return;
    // }

    setIsLoading(true);
    try {
      const payload = {
        ...formData,
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim()
      };

      await api.post('/doctors', payload);
      toast.success('Đã thêm hồ sơ bác sĩ mới thành công!');
      navigate('/doctors');
    } catch (error) {
      console.error('Lỗi thêm bác sĩ:', error);
      toast.error(error.response?.data?.message || 'Không thể thêm bác sĩ mới!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-up">
      {/* Thanh điều hướng quay lại */}
      <div className="flex items-center justify-between">
        <Link
          to="/doctors"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-teal-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách bác sĩ</span>
        </Link>
      </div>

      {/* Khung Biểu mẫu chính */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
        {/* Banner Header kèm Avatar xem trước */}
        <div className="p-6 bg-gradient-to-r from-teal-600 to-emerald-600 text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center border border-white/30 shrink-0">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold">Tiếp nhận Hồ sơ Bác sĩ Mới</h1>
              <p className="text-xs text-teal-50 mt-0.5">
                Cập nhật thông tin định danh, phân bổ chuyên khoa và thông tin liên hệ
              </p>
            </div>
          </div>

          {/* Live Avatar Preview */}
          <div className="hidden sm:flex items-center gap-3 bg-white/15 backdrop-blur-xs px-3.5 py-2 rounded-2xl border border-white/20">
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.fullName || 'DoctorNew'}`}
              alt="Preview"
              className="w-10 h-10 rounded-xl bg-white p-0.5"
            />
            <div className="text-left">
              <p className="text-xs font-extrabold text-white truncate max-w-[140px]">
                {formData.fullName || 'Họ tên Bác sĩ'}
              </p>
              <span className="text-[11px] text-teal-100">{formData.specialty}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Hàng 1: Họ tên & Số điện thoại */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${errors.fullName ? 'text-red-500' : 'text-teal-600'}`} />
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => {
                    setFormData({ ...formData, fullName: e.target.value });
                    if (errors.fullName) setErrors({ ...errors, fullName: null }); 
                  }}
                  placeholder="Nguyễn Văn A"
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
          </div>

          {/* Hàng 2: Email & Kinh nghiệm công tác */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                Địa chỉ Email công vụ
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-teal-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="VD: dr.minh@smartclinic.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                Học vị / Số năm kinh nghiệm
              </label>
              <div className="relative">
                <Award className="w-4 h-4 text-teal-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  placeholder="VD: Thạc sĩ - 8 năm kinh nghiệm"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Hàng 3: Chọn Chuyên khoa */}
          <div className={`p-4 sm:p-5 rounded-2xl space-y-3 transition-all ${
            errors.specialty 
              ? 'bg-red-50/50 border border-red-300' 
              : 'bg-gray-50/70 border border-gray-100'
          }`}>
            <label className={`block text-xs font-bold uppercase ${
              errors.specialty ? 'text-red-700' : 'text-gray-700'
            }`}>
              Chuyên khoa phụ trách <span className="text-red-500">*</span>
            </label>

            <div className="flex flex-wrap gap-2">
              {SPECIALTIES.map((spec) => {
                const active = formData.specialty === spec;
                return (
                  <button
                    key={spec}
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, specialty: spec });
                      // Tự động tắt báo lỗi khi người dùng bấm chọn chuyên khoa
                      if (errors.specialty) setErrors({ ...errors, specialty: null }); 
                    }}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      active
                        ? 'bg-teal-600 text-white shadow-xs'
                        : errors.specialty 
                          ? 'bg-white text-red-600 border border-red-200 hover:border-red-400' // Nút cũng ám đỏ nhẹ nếu đang bị lỗi
                          : 'bg-white text-gray-600 border border-gray-200 hover:border-teal-400 hover:text-teal-700'
                    }`}
                  >
                    <Stethoscope className="w-3.5 h-3.5" />
                    <span>{spec}</span>
                  </button>
                );
              })}
            </div>
            
            {/* HIỂN THỊ DÒNG TEXT LỖI Ở DƯỚI CÙNG */}
            {errors.specialty && (
              <p className="mt-1.5 text-[11px] font-semibold text-red-500 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-red-500"></span>
                {errors.specialty}
              </p>
            )}
          </div>

          {/* Hàng 4: Giới thiệu chuyên môn / Ghi chú */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
              Ghi chú chuyên môn / Lịch trực cố định
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <textarea
                rows={3}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Nhập thông tin giới thiệu chuyên môn hoặc ghi chú ca trực của bác sĩ..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              />
            </div>
          </div>

          {/* Nút Hủy & Lưu thông tin */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <Link
              to="/doctors"
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
              <span>{isLoading ? 'Đang lưu...' : 'Lưu Hồ sơ Bác sĩ'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}