import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  UserCheck, ArrowLeft, User, Phone, Calendar, MapPin,
  HeartPulse, AlertTriangle, Save
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function PatientEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    fullName: '', phone: '', dob: '', gender: 'Nam',
    address: '', allergies: '', medicalHistory: ''
  });

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const res = await api.get('/patients');
        const found = (res.data || []).find(p => String(p.id) === String(id));
        if (found) {
          setFormData({
            fullName: found.fullName || '',
            phone: found.phone || '',
            dob: found.dob || '',
            gender: found.gender || 'Nam',
            address: found.address || '',
            allergies: found.allergies || '',
            medicalHistory: found.medicalHistory || ''
          });
        } else {
          toast.error('Không tìm thấy bệnh nhân!');
          navigate('/patients');
        }
      } catch (error) {
        toast.error('Lỗi tải dữ liệu bệnh nhân!');
      } finally {
        setIsFetching(false);
      }
    };
    fetchPatient();
  }, [id, navigate]);

  const validateForm = () => {
    const newErrors = {};
    const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})\b/; 

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
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Vui lòng kiểm tra lại các thông tin bị lỗi!');
      return; 
    }

    setIsLoading(true);
    try {
      await api.put(`/patients/${id}`, formData); // Dùng PUT hoặc PATCH cho luồng Edit
      toast.success('Cập nhật hồ sơ bệnh nhân thành công!');
      navigate('/patients');
    } catch (error) {
      toast.error('Lỗi khi cập nhật hồ sơ bệnh nhân!');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) return <div className="p-8 text-center text-gray-500">Đang tải hồ sơ...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <Link to="/patients" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-teal-600 transition-colors">
          <ArrowLeft className="w-4 h-4" /> <span>Quay lại danh sách bệnh nhân</span>
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-teal-600 to-emerald-600 text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center border border-white/30 shrink-0">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold">Chỉnh sửa Hồ sơ Bệnh nhân</h1>
              <p className="text-xs text-teal-50 mt-0.5">Cập nhật thông tin mã BN: P-{id}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Thông tin Hành chính */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">1. Thông tin hành chính</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={`block text-xs font-bold uppercase mb-2 ${errors.fullName ? 'text-red-700' : 'text-gray-700'}`}>
                  Họ và tên <span className="text-red-500">*</span>
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
                  Số điện thoại <span className="text-red-500">*</span>
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
              <div>
                <label className={`block text-xs font-bold uppercase mb-2 ${errors.dob ? 'text-red-700' : 'text-gray-700'}`}>
                  Ngày sinh <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${errors.dob ? 'text-red-500' : 'text-teal-600'}`} />
                  <input
                    type="date"
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
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Giới tính</label>
                <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500">
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
            </div>
            <div className="mt-5">
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Địa chỉ</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-teal-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" />
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Tiền sử bệnh lý */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">2. Tiền sử bệnh lý</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2 flex items-center gap-1.5 text-amber-700">
                  <AlertTriangle className="w-4 h-4 text-amber-500" /> Dị ứng (Thuốc/Thực phẩm)
                </label>
                <textarea rows={3} value={formData.allergies} onChange={e => setFormData({...formData, allergies: e.target.value})} placeholder="VD: Dị ứng Penicillin, Hải sản..." className="w-full p-3 rounded-xl bg-amber-50/40 border border-amber-200 text-sm focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2 flex items-center gap-1.5 text-teal-700">
                  <HeartPulse className="w-4 h-4 text-teal-600" /> Tiền sử bệnh nền
                </label>
                <textarea rows={3} value={formData.medicalHistory} onChange={e => setFormData({...formData, medicalHistory: e.target.value})} placeholder="VD: Huyết áp cao, Tiểu đường tuýp 2..." className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <Link to="/patients" className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold transition-colors">Hủy bỏ</Link>
            <button type="submit" disabled={isLoading} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold shadow-sm cursor-pointer disabled:opacity-50">
              <Save className="w-4 h-4" /> <span>{isLoading ? 'Đang lưu...' : 'Lưu cập nhật'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}