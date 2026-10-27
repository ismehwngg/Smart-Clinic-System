import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  UserCheck,
  ArrowLeft,
  User,
  Phone,
  Mail,
  Stethoscope,
  Award,
  FileText,
  Briefcase,
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

export default function DoctorEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    fullName: '',
    specialty: 'Nội tổng quát',
    phone: '',
    email: '',
    experience: '',
    bio: ''
  });

  useEffect(() => {
    const fetchDoctorDetail = async () => {
      setIsFetching(true);
      try {
        const response = await api.get('/doctors');
        const list = response.data || [];
        const found = list.find((d) => String(d.id) === String(id));

        if (found) {
          setFormData({
            fullName: found.fullName || '',
            specialty: found.specialty || 'Nội tổng quát',
            phone: found.phone || '',
            email: found.email || '',
            experience: found.experience || '',
            bio: found.bio || ''
          });
        } else {
          toast.error('Không tìm thấy thông tin bác sĩ này!');
          navigate('/doctors');
        }
      } catch (error) {
        console.error('Lỗi tải thông tin bác sĩ:', error);
        toast.error('Không thể tải dữ liệu bác sĩ!');
      } finally {
        setIsFetching(false);
      }
    };

    fetchDoctorDetail();
  }, [id, navigate]);

  const validateForm = () => {
    const newErrors = {};
    const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})\b/;

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

    // Validate Số năm kinh nghiệm
    if (formData.experience === '' || formData.experience === null) {
      newErrors.experience = 'Vui lòng nhập số năm kinh nghiệm';
    } else if (Number(formData.experience) < 0) {
      newErrors.experience = 'Số năm kinh nghiệm không thể là số âm';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // CHẶN GỌI API NẾU VALIDATE LỖI
    if (!validateForm()) {
      toast.error('Vui lòng kiểm tra lại các thông tin bị lỗi!');
      return; 
    }

    setIsLoading(true);
    try {
      await api.put(`/doctors/${id}`, formData); // Dùng PUT hoặc PATCH cho Edit
      toast.success('Cập nhật hồ sơ bác sĩ thành công!');
      navigate('/doctors'); // Điều hướng về danh sách
    } catch (error) {
      toast.error('Lỗi khi cập nhật hồ sơ bác sĩ!');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="p-8 text-center text-gray-500">
        Đang tải hồ sơ bác sĩ #{id}...
      </div>
    );
  }

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
        {/* Banner Header kèm Avatar bác sĩ */}
        <div className="p-6 bg-gradient-to-r from-teal-600 to-emerald-600 text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center border border-white/30 shrink-0">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold">Chỉnh sửa Hồ sơ Bác sĩ</h1>
              <p className="text-xs text-teal-50 mt-0.5">
                Cập nhật thông tin chuyên khoa và liên hệ cho mã BS: D-{id}
              </p>
            </div>
          </div>

          {/* Live Avatar Preview */}
          <div className="hidden sm:flex items-center gap-3 bg-white/15 backdrop-blur-xs px-3.5 py-2 rounded-2xl border border-white/20">
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.fullName || id}`}
              alt={formData.fullName}
              className="w-10 h-10 rounded-xl bg-white p-0.5"
            />
            <div className="text-left">
              <p className="text-xs font-extrabold text-white truncate max-w-[140px]">
                {formData.fullName || 'Bác sĩ'}
              </p>
              <span className="text-[11px] text-teal-100">{formData.specialty}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Hàng 1: Họ tên & Số điện thoại */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className={`block text-xs font-bold uppercase mb-2 ${errors.fullName ? 'text-red-700' : 'text-gray-700'}`}>
                Họ và tên bác sĩ<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${errors.fullName ? 'text-red-500' : 'text-teal-600'}`} />
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => {
                    setFormData({ ...formData, fullName: e.target.value });
                    if (errors.fullName) setErrors({ ...errors, fullName: null }); 
                  }}
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
              <label className={`block text-xs font-bold uppercase mb-2 ${errors.phone ? 'text-red-700' : 'text-gray-700'}`}>
                Số điện thoại liên hệ <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${errors.phone ? 'text-red-500' : 'text-teal-600'}`} />
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => {
                    setFormData({ ...formData, phone: e.target.value });
                    if (errors.phone) setErrors({ ...errors, phone: null }); 
                  }}
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

          {/* Hàng 2: Email & Kinh nghiệm */}
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
              <label className={`block text-xs font-bold uppercase mb-2 ${errors.experience ? 'text-red-700' : 'text-gray-700'}`}>
                Học vị / Năm kinh nghiệm <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Briefcase className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${errors.experience ? 'text-red-500' : 'text-teal-600'}`} />
                <input
                  type="text"
                  min="0"
                  value={formData.experience}
                  onChange={(e) => {
                    setFormData({ ...formData, experience: e.target.value });
                    if (errors.experience) setErrors({ ...errors, experience: null }); 
                  }}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 ${
                    errors.experience 
                      ? 'bg-red-50/50 border-red-300 text-red-900 focus:ring-red-500/20 focus:border-red-500' 
                      : 'bg-gray-50 border-gray-200 text-gray-800 focus:bg-white focus:ring-teal-500/20 focus:border-teal-500'
                  }`}
                />
              </div>
              {errors.experience && (
                <p className="mt-1.5 text-[11px] font-semibold text-red-500 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-red-500"></span>
                  {errors.experience}
                </p>
              )}
            </div>
          </div>

          {/* Hàng 3: Chọn Chuyên khoa */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gray-50/70 border border-gray-100 space-y-3">
            <label className="block text-xs font-bold text-gray-700 uppercase">
              Chuyên khoa phụ trách <span className="text-red-500">*</span>
            </label>

            <div className="flex flex-wrap gap-2">
              {SPECIALTIES.map((spec) => {
                const active = formData.specialty === spec;
                return (
                  <button
                    key={spec}
                    type="button"
                    onClick={() => setFormData({ ...formData, specialty: spec })}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      active
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'bg-white text-gray-600 border border-gray-200 hover:border-teal-400 hover:text-teal-700'
                    }`}
                  >
                    <Stethoscope className="w-3.5 h-3.5" />
                    <span>{spec}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hàng 4: Ghi chú chuyên môn */}
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
                placeholder="Nhập thông tin giới thiệu chuyên môn hoặc ghi chú ca trực..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              />
            </div>
          </div>

          {/* Nút Hủy & Lưu cập nhật */}
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
              <span>{isLoading ? 'Đang lưu...' : 'Lưu cập nhật Bác sĩ'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}