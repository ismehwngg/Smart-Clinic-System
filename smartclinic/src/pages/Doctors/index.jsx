import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Stethoscope, Phone, Mail, CalendarPlus, Edit3, Trash2, 
  Award, FileText, X, Eye, Search, Plus
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import ConfirmModal from '../../components/common/ConfirmModal';

const SPECIALTIES = [
  'Tai - Mũi - Họng',
  'Răng - Hàm - Mặt',
  'Sản phụ khoa',
  'Nội tổng quát',
  'Ngoại khoa',
  'Nhi khoa',
  'Da liễu'
];

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // States lọc và tìm kiếm
  const [searchTerm, setSearchTerm] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('All');

  // States cho Modal
  const [selectedDoctor, setSelectedDoctor] = useState(null); // Modal Xem chi tiết
  const [deleteId, setDeleteId] = useState(null);             // Modal Xóa

  // Lấy phân quyền từ LocalStorage
  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const role = currentUser?.role || 'Receptionist';

  // Lấy danh sách bác sĩ từ API
  const fetchDoctors = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/doctors');
      setDoctors(response.data || []);
    } catch (error) {
      console.error('Lỗi khi tải danh sách bác sĩ:', error);
      toast.error('Không thể tải danh sách bác sĩ!');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  // Xóa bác sĩ
  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/doctors/${deleteId}`);
      setDoctors((prev) => prev.filter((d) => d.id !== deleteId));
      toast.success('Đã xóa hồ sơ bác sĩ thành công!');
    } catch (error) {
      console.error('Lỗi khi xóa bác sĩ:', error);
      toast.error('Không thể xóa bác sĩ này!');
    } finally {
      setDeleteId(null);
    }
  };

  // Lọc danh sách bác sĩ
  const filteredDoctors = doctors.filter((doc) => {
    const matchesSpecialty = specialtyFilter === 'All' || doc.specialty === specialtyFilter;
    const q = searchTerm.toLowerCase();
    const matchesSearch = 
      (doc.fullName || '').toLowerCase().includes(q) ||
      (doc.phone || '').toLowerCase().includes(q) ||
      String(doc.id || '').toLowerCase().includes(q);
      
    return matchesSpecialty && matchesSearch;
  });

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Đang tải danh sách bác sĩ...</div>;
  }

  return (
    <>
      <div className="space-y-6">
        {/* ================================================================= */}
        {/* HÀNG 1: TIÊU ĐỀ BÊN TRÁI - Ô TÌM KIẾM & NÚT THÊM MỚI BÊN PHẢI     */}
        {/* ================================================================= */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-up">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-800 whitespace-nowrap">
              Quản lý Bác sĩ
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Danh sách đội ngũ bác sĩ chuyên khoa đang công tác (Bấm vào thẻ bác sĩ để xem hồ sơ)
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-3 items-center w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm tên, mã BS, SĐT..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              />
            </div>

            {role === 'Admin' && (
              <Link
                to="/doctors/create"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold shadow-sm transition-all whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm bác sĩ</span>
              </Link>
            )}
          </div>
        </div>

        {/* ================================================================= */}
        {/* HÀNG 2: DÃY NÚT BẤM LỌC NHANH CHUYÊN KHOA (FILTER PILLS)          */}
        {/* ================================================================= */}
        <div className="flex flex-wrap items-center gap-2 animate-fade-up delay-100">
          {['All', ...SPECIALTIES].map((spec) => (
            <button
              key={spec}
              onClick={() => setSpecialtyFilter(spec)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                specialtyFilter === spec
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-teal-50 hover:text-teal-700'
              }`}
            >
              {spec === 'All' ? 'Tất cả chuyên khoa' : spec}
            </button>
          ))}
        </div>

        {/* ================================================================= */}
        {/* HÀNG 3: LƯỚI THẺ DANH THIẾP BÁC SĨ (DOCTOR CARD GRID)             */}
        {/* ================================================================= */}
        {filteredDoctors.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 text-gray-400 text-sm animate-fade-up delay-200">
            Không tìm thấy bác sĩ nào phù hợp với tiêu chí tìm kiếm.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-up delay-200">
            {filteredDoctors.map((doc, idx) => (
              <div
                key={doc.id}
                onClick={() => setSelectedDoctor(doc)}
                className="bg-white rounded-2xl shadow-xs border border-gray-100 hover:border-teal-300 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group overflow-hidden"
              >
                <div>
                  {/* PHẦN 1: BANNER NỬA TRÊN MÀU GRADIENT XANH */}
                  <div className="bg-gradient-to-r from-teal-600 to-emerald-500 px-5 pt-4 pb-12 flex justify-between items-start">
                    {/* Góc trái: Trạng thái */}
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/20 text-white backdrop-blur-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-200 animate-pulse"></span>
                      Đang công tác
                    </span>
                    
                    {/* Góc phải: Mã BS & Chuyên khoa xếp dọc */}
                    <div className="flex flex-col items-end gap-1.5 ">
                      <span className="text-white/90 text-xs font-mono font-semibold pb-1">
                        Mã BS: #{doc.id}
                      </span>
                      <span className="inline-flex items-center gap-1  px-3.5 py-0.5 rounded-full text-[12px] font-bold bg-white text-teal-700 shadow-sm">
                        {doc.specialty || 'Đa khoa'}
                      </span>
                    </div>
                  </div>

                  {/* PHẦN 2: THÔNG TIN BÊN DƯỚI (Chỉ còn Avatar nổi lên) */}
                  <div className="px-5 pb-4 pt-3 relative z-10">
                    <div className="mb-2">
                      <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${doc.fullName || doc.id || idx}`}
                        alt={doc.fullName}
                        className="-mt-12 w-16 h-16 rounded-2xl bg-white border-4 border-white shadow-md p-0.5 object-cover group-hover:scale-105 transition-transform shrink-0"
                      />
                    </div>

                    {/* Tên & Học vị */}
                    <div>
                      <h3 className="text-base font-extrabold text-gray-800 group-hover:text-teal-700 transition-colors truncate">
                        {doc.fullName}
                      </h3>
                      <p className="text-xs font-semibold text-teal-600 mt-0.5 flex items-center gap-1 truncate">
                        <Award className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{doc.experience || 'Bác sĩ Chuyên khoa'}</span>
                      </p>
                    </div>

                    {/* Thông tin liên hệ & Ghi chú */}
                    <div className="mt-4 pt-3.5 border-t border-gray-100 space-y-2 text-xs text-gray-600">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-teal-600" />
                          Điện thoại:
                        </span>
                        <span className="font-bold text-gray-800 font-mono">
                          {doc.phone || '---'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-gray-400 flex items-center gap-1.5 shrink-0">
                          <Mail className="w-3.5 h-3.5 text-teal-600" />
                          Email:
                        </span>
                        <span className="font-medium text-gray-700 truncate">
                          {doc.email || 'Chưa cập nhật'}
                        </span>
                      </div>

                      {doc.bio && (
                        <div className="mt-2 p-2.5 rounded-xl bg-gray-50 text-[11px] text-gray-500 line-clamp-2 italic border border-gray-100">
                          "{doc.bio}"
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Phần chân thẻ: Nút Đặt lịch khám + Sửa/Xóa */}
                <div
                  className="px-5 py-3.5 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-1.5 flex-1">
                    <Link
                      to={`/appointments/create?doctorId=${doc.id}`}
                      state={{ selectedDoctorId: doc.id, selectedDoctorName: doc.fullName }}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-2xs transition-colors"
                    >
                      <CalendarPlus className="w-3.5 h-3.5" />
                      <span>Đặt lịch khám</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => setSelectedDoctor(doc)}
                      className="p-2 rounded-xl bg-white hover:bg-teal-50 text-teal-700 border border-teal-200 transition-colors cursor-pointer"
                      title="Xem chi tiết hồ sơ Bác sĩ"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>

                  {role === 'Admin' && (
                    <div className="flex items-center gap-1.5">
                      <Link
                        to={`/doctors/edit/${doc.id}`}
                        className="p-2 rounded-xl bg-white hover:bg-teal-50 text-gray-600 hover:text-teal-600 border border-gray-200 transition-colors"
                        title="Chỉnh sửa bác sĩ"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => setDeleteId(doc.id)}
                        className="p-2 rounded-xl bg-white hover:bg-red-50 text-gray-600 hover:text-red-600 border border-gray-200 transition-colors cursor-pointer"
                        title="Xóa bác sĩ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* MODAL 1: XEM CHI TIẾT HỒ SƠ BÁC SĨ (DOCTOR PROFILE MODAL)         */}
      {/* ================================================================= */}
      {selectedDoctor && (
        <div
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4 animate-fade-up"
          onClick={() => setSelectedDoctor(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Banner Header */}
            <div className="bg-gradient-to-r from-teal-600 to-emerald-600 p-6 text-white relative">
              <button
                onClick={() => setSelectedDoctor(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-4">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedDoctor.fullName || selectedDoctor.id}`}
                  alt={selectedDoctor.fullName}
                  className="w-16 h-16 rounded-2xl bg-white p-1 shadow-md shrink-0"
                />
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold mb-1">
                    {selectedDoctor.specialty || 'Đa khoa'}
                  </span>
                  <h3 className="text-xl font-extrabold">{selectedDoctor.fullName}</h3>
                  <p className="text-xs text-teal-100 font-mono mt-0.5">
                    Mã BS: D-BS_{String(selectedDoctor.id).padStart(3, '0')}
                  </p>
                </div>
              </div>
            </div>

            {/* Nội dung chi tiết Hồ sơ */}
            <div className="p-6 space-y-4 text-sm">
              <div className="p-3.5 rounded-2xl bg-teal-50/60 border border-teal-100 flex items-start gap-3">
                <Award className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-bold text-teal-700 uppercase">
                    Học vị & Kinh nghiệm công tác
                  </p>
                  <p className="font-bold text-gray-800 mt-0.5">
                    {selectedDoctor.experience || 'Bác sĩ Chuyên khoa — Đang cập nhật thâm niên'}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 flex items-start gap-3">
                <FileText className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase">
                    Giới thiệu chuyên môn & Lịch trực cố định
                  </p>
                  <p className="text-gray-700 mt-1 leading-relaxed whitespace-pre-line">
                    {selectedDoctor.bio || 'Chưa có ghi chú thêm về lịch trực và tiểu sử chuyên môn.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-xl border border-gray-100 bg-white">
                  <span className="text-[11px] text-gray-400 block">Số điện thoại</span>
                  <span className="font-bold text-gray-800 font-mono">
                    {selectedDoctor.phone || '---'}
                  </span>
                </div>
                <div className="p-3 rounded-xl border border-gray-100 bg-white">
                  <span className="text-[11px] text-gray-400 block">Email công vụ</span>
                  <span className="font-bold text-gray-800 truncate block" title={selectedDoctor.email}>
                    {selectedDoctor.email || 'Chưa cập nhật'}
                  </span>
                </div>
              </div>

              {/* Nút hành động dưới đáy Modal */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5">
                {role === 'Admin' && (
                  <Link
                    to={`/doctors/edit/${selectedDoctor.id}`}
                    className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors"
                  >
                    Chỉnh sửa hồ sơ
                  </Link>
                )}
                <Link
                  to={`/appointments/create?doctorId=${selectedDoctor.id}`}
                  state={{ selectedDoctorId: selectedDoctor.id, selectedDoctorName: selectedDoctor.fullName }}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  + Đặt lịch khám với Bác sĩ này
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 2: XÁC NHẬN XÓA BÁC SĨ                                      */}
      {/* ================================================================= */}
      <ConfirmModal
        isOpen={Boolean(deleteId)}
        title="Xác nhận xóa Bác sĩ"
        message="Bạn có chắc chắn muốn xóa bác sĩ này khỏi hệ thống? Thao tác này không thể hoàn tác."
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteId(null)}
        onClose={() => setDeleteId(null)}
      />
    </>
  );
}