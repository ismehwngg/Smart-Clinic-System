import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarPlus,
  Search,
  Calendar,
  Clock,
  Stethoscope,
  CheckCircle2,
  XCircle,
  Edit3,
  Trash2,
  RotateCcw,
  FileText,
  Check,
  ChevronLeft,
  ChevronRight,
  User,
  Plus,
  X,
  Activity,
  Pill,
  BriefcaseMedical
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import ConfirmModal from '../../components/common/ConfirmModal';

// Danh mục thuốc mặc định dự phòng (sử dụng ngay nếu Backend chưa mở route /api/medicines)
const FALLBACK_MEDICINES = [
  { id: 'MED_001', name: 'Paracetamol 500mg', unit: 'Viên', price: 2000, category: 'Giảm đau, hạ sốt' },
  { id: 'MED_002', name: 'Amoxicillin 500mg', unit: 'Viên', price: 3500, category: 'Kháng sinh' },
  { id: 'MED_003', name: 'Loratadin 10mg', unit: 'Viên', price: 1500, category: 'Kháng histamin (Dị ứng)' },
  { id: 'MED_004', name: 'Omeprazol 20mg', unit: 'Viên', price: 4000, category: 'Dạ dày' },
  { id: 'MED_005', name: 'Oresol 245', unit: 'Gói', price: 5000, category: 'Bù nước và điện giải' },
  { id: 'MED_006', name: 'Vitamin C 500mg', unit: 'Viên', price: 1500, category: 'Tăng đề kháng' },
  { id: 'MED_007', name: 'Cefuroxim 500mg', unit: 'Viên', price: 8000, category: 'Kháng sinh' }
];

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // State bộ lọc
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // State Modal xóa
  const [deleteId, setDeleteId] = useState(null);

  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const role = currentUser?.role || 'Receptionist';

  // State chuyển đổi giữa 2 Tab: 'info' (Thông tin chung) | 'prescription' (Đơn thuốc)
  const [activeModalTab, setActiveModalTab] = useState('info');

  // Danh sách thuốc lấy từ kho (hoặc dùng danh sách dự phòng)
  const [medicinesList, setMedicinesList] = useState(FALLBACK_MEDICINES);

  // Mảng đơn thuốc hiện tại của ca khám
  const [prescriptionItems, setPrescriptionItems] = useState([]);

  // Ghi chú của bác sĩ
  const [doctorNotes, setDoctorNotes] = useState('');

  // State cho các ô input thêm/sửa thuốc
  const [medForm, setMedForm] = useState({
    medicineId: '',
    quantity: 1,
    dosage: ''
  });

  // Lưu vị trí dòng thuốc đang sửa (-1 là chế độ thêm mới)
  const [editingMedIndex, setEditingMedIndex] = useState(-1);
  const [isSavingPrescription, setIsSavingPrescription] = useState(false);

  // State lưu ngày bắt đầu của tuần đang xem (Mặc định lấy Thứ 2 của tuần hiện tại)
  const getMonday = (d) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  };
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));

  const toLocalISO = (d) => {
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().split('T')[0];
  };

  // Tạo mảng 7 ngày trong tuần
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const iso = toLocalISO(d);
    const dayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return {
      iso,
      dayLabel: dayLabels[d.getDay()],
      dayNumber: d.getDate(),
      monthLabel: `Tháng ${d.getMonth() + 1}`,
      hasAppt: appointments.some((a) => a.date === iso)
    };
  });

  const shiftWeek = (days) => {
    const next = new Date(weekStart);
    next.setDate(weekStart.getDate() + days);
    setWeekStart(next);
  };

  const fetchAppointments = async (showToast = false) => {
    setIsLoading(true);
    try {
      const response = await api.get('/appointments');
      const sorted = (response.data || []).sort(
        (a, b) => new Date(`${b.date}T${b.time || '00:00'}`) - new Date(`${a.date}T${a.time || '00:00'}`)
      );
      setAppointments(sorted);
      if (showToast) toast.success('Đã làm mới danh sách lịch hẹn!');
    } catch (error) {
      console.error('Lỗi tải lịch hẹn:', error);
      toast.error('Không thể tải danh sách lịch hẹn!');
    } finally {
      setIsLoading(false);
    }
  };

  // Gọi API lấy danh mục thuốc khi vào trang (Nếu lỗi 404 sẽ tự động dùng FALLBACK_MEDICINES)
  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const res = await api.get('/medicines');
        const list = Array.isArray(res.data) ? res.data : res.data?.medicines || [];
        if (list.length > 0) {
          setMedicinesList(list);
        }
      } catch {
        // Nếu Backend chưa cấu hình route /api/medicines thì giữ nguyên FALLBACK_MEDICINES
      }
    };
    fetchMedicines();
  }, []);

  // Mỗi khi người dùng bấm chọn xem 1 Lịch hẹn khác, đồng bộ lại dữ liệu đơn thuốc vào State
  useEffect(() => {
    if (selectedAppointment) {
      setPrescriptionItems(selectedAppointment.prescription || []);
      setDoctorNotes(selectedAppointment.notes || '');
      setActiveModalTab('info'); // Mặc định mở tab thông tin trước
      setMedForm({ medicineId: '', quantity: 1, dosage: '' });
      setEditingMedIndex(-1);
    }
  }, [selectedAppointment]);

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Hàm Thêm hoặc Cập nhật 1 loại thuốc vào danh sách
  const handleAddOrUpdateMed = () => {
    if (!medForm.medicineId) {
      toast.error('Vui lòng chọn loại thuốc!');
      return;
    }
    if (!medForm.quantity || Number(medForm.quantity) <= 0) {
      toast.error('Số lượng thuốc phải lớn hơn 0!');
      return;
    }
    if (!medForm.dosage.trim()) {
      toast.error('Vui lòng nhập liều dùng / cách dùng!');
      return;
    }

    const foundMed = medicinesList.find((m) => String(m.id) === String(medForm.medicineId));
    if (!foundMed) return;

    const newMedItem = {
      medicineId: foundMed.id,
      medicineName: foundMed.name,
      unit: foundMed.unit || 'Viên',
      price: foundMed.price || 0,
      quantity: Number(medForm.quantity),
      dosage: medForm.dosage.trim()
    };

    const updatedList = [...prescriptionItems];

    if (editingMedIndex >= 0) {
      // Đang ở chế độ Sửa dòng thuốc
      updatedList[editingMedIndex] = newMedItem;
      toast.success('Đã cập nhật thông tin thuốc!');
      setEditingMedIndex(-1);
    } else {
      // Đang ở chế độ Thêm mới: Kiểm tra xem thuốc đã có trong đơn chưa
      const existingIdx = updatedList.findIndex((item) => item.medicineId === newMedItem.medicineId);
      if (existingIdx >= 0) {
        updatedList[existingIdx].quantity += newMedItem.quantity;
        updatedList[existingIdx].dosage = newMedItem.dosage;
        toast.success('Thuốc đã có trong đơn, đã cộng dồn số lượng!');
      } else {
        updatedList.push(newMedItem);
        toast.success('Đã thêm thuốc vào đơn!');
      }
    }

    setPrescriptionItems(updatedList);
    setMedForm({ medicineId: '', quantity: 1, dosage: '' }); // Reset form nhập
  };

  // Hàm đổ dữ liệu thuốc lên form để Sửa
  const handleEditMedRow = (index) => {
    const item = prescriptionItems[index];
    setMedForm({
      medicineId: item.medicineId,
      quantity: item.quantity,
      dosage: item.dosage
    });
    setEditingMedIndex(index);
  };

  // Hàm Xóa 1 loại thuốc khỏi danh sách
  const handleRemoveMedRow = (index) => {
    const updatedList = prescriptionItems.filter((_, i) => i !== index);
    setPrescriptionItems(updatedList);
    if (editingMedIndex === index) {
      setEditingMedIndex(-1);
      setMedForm({ medicineId: '', quantity: 1, dosage: '' });
    }
  };

  // Hàm Lưu chính thức Đơn thuốc xuống Backend (db.json)
  const handleSavePrescriptionToDB = async (markAsCompleted = false) => {
    if (!selectedAppointment) return;
    setIsSavingPrescription(true);

    try {
      const updatedPayload = {
        ...selectedAppointment,
        notes: doctorNotes,
        prescription: prescriptionItems,
        status: markAsCompleted ? 'Completed' : selectedAppointment.status
      };

      await api.put(`/appointments/${selectedAppointment.id}`, updatedPayload);

      toast.success(
        markAsCompleted
          ? 'Đã hoàn tất ca khám và xuất đơn thuốc!'
          : 'Đã lưu cập nhật đơn thuốc!'
      );

      setSelectedAppointment(updatedPayload);
      fetchAppointments();
    } catch (error) {
      console.error('Lỗi lưu đơn thuốc:', error);
      toast.error(error.response?.data?.message || 'Không thể lưu đơn thuốc!');
    } finally {
      setIsSavingPrescription(false);
    }
  };

  // Hàm đổi trạng thái nhanh 1-Click ngay trên dòng lịch hẹn
  const handleQuickStatusChange = async (appointment, newStatus) => {
    try {
      const updatedData = { ...appointment, status: newStatus };
      await api.put(`/appointments/${appointment.id}`, updatedData);

      setAppointments((prev) =>
        prev.map((item) => (item.id === appointment.id ? { ...item, status: newStatus } : item))
      );

      const statusText = {
        Confirmed: 'Đã xác nhận lịch hẹn!',
        Completed: 'Đã hoàn thành ca khám!',
        Cancelled: 'Đã hủy lịch hẹn!'
      };
      toast.success(statusText[newStatus] || 'Đã cập nhật trạng thái!');
    } catch (error) {
      console.error('Lỗi cập nhật trạng thái:', error);
      toast.error('Không thể cập nhật trạng thái lịch hẹn!');
    }
  };

  // Hàm xóa lịch hẹn qua ConfirmModal
  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/appointments/${deleteId}`);
      setAppointments((prev) => prev.filter((item) => item.id !== deleteId));
      toast.success('Đã xóa lịch hẹn thành công!');
    } catch (error) {
      console.error('Lỗi khi xóa lịch hẹn:', error);
      toast.error('Không thể xóa lịch hẹn này!');
    } finally {
      setDeleteId(null);
    }
  };

  // Các hàm định dạng hiển thị
  const formatDate = (dateStr) => {
    if (!dateStr) return '---';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const getInitial = (name) => {
    if (!name) return 'P';
    const parts = name.trim().split(' ');
    return parts[parts.length - 1].charAt(0).toUpperCase();
  };

  const renderStatusBadge = (status) => {
    const map = {
      Scheduled: {
        label: 'Chờ xác nhận',
        classes: 'bg-blue-50 text-blue-700 border-blue-200',
        dot: 'bg-blue-500'
      },
      Confirmed: {
        label: 'Đã xác nhận',
        classes: 'bg-amber-50 text-amber-700 border-amber-200',
        dot: 'bg-amber-500'
      },
      Completed: {
        label: 'Hoàn thành',
        classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500'
      },
      Cancelled: {
        label: 'Đã hủy',
        classes: 'bg-red-50 text-red-700 border-red-200',
        dot: 'bg-red-500'
      }
    };
    const curr = map[status] || {
      label: status,
      classes: 'bg-gray-50 text-gray-700 border-gray-200',
      dot: 'bg-gray-400'
    };

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${curr.classes}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${curr.dot}`}></span>
        {curr.label}
      </span>
    );
  };

  // Bộ đếm cho từng Tab trạng thái
  const statusCounts = {
    All: appointments.length,
    Scheduled: appointments.filter((a) => a.status === 'Scheduled').length,
    Confirmed: appointments.filter((a) => a.status === 'Confirmed').length,
    Completed: appointments.filter((a) => a.status === 'Completed').length,
    Cancelled: appointments.filter((a) => a.status === 'Cancelled').length
  };

  const statusTabs = [
    { key: 'All', label: 'Tất cả lịch hẹn', count: statusCounts.All },
    { key: 'Scheduled', label: 'Chờ xác nhận', count: statusCounts.Scheduled },
    { key: 'Confirmed', label: 'Đã xác nhận', count: statusCounts.Confirmed },
    { key: 'Completed', label: 'Hoàn thành', count: statusCounts.Completed },
    { key: 'Cancelled', label: 'Đã hủy', count: statusCounts.Cancelled }
  ];

  // Lọc danh sách lịch hẹn
  const filteredAppointments = appointments.filter((app) => {
    const matchesStatus = statusFilter === 'All' || app.status === statusFilter;
    const matchesDate = !dateFilter || app.date === dateFilter;
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      (app.patientName || '').toLowerCase().includes(q) ||
      (app.doctorName || '').toLowerCase().includes(q) ||
      String(app.id || '').toLowerCase().includes(q) ||
      (app.reason || app.notes || '').toLowerCase().includes(q);

    return matchesStatus && matchesDate && matchesSearch;
  });

  const setTodayFilter = () => {
    const now = new Date();
    setWeekStart(getMonday(now));
    setDateFilter(toLocalISO(now));
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-gray-500">
        Đang tải bảng điều phối lịch hẹn khám...
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* ================================================================= */}
        {/* TẦNG 1: HEADER & NÚT ĐẶT LỊCH HẸN MỚI                              */}
        {/* ================================================================= */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-up">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">
              Điều phối Lịch hẹn Khám
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Theo dõi tiến độ tiếp đón, duyệt nhanh trạng thái ca khám và phân bổ lịch trình bác sĩ
            </p>
          </div>

          {(role === 'Admin' || role === 'Receptionist') && (
            <Link
              to="/appointments/create"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold shadow-sm transition-all shrink-0"
            >
              <CalendarPlus className="w-4 h-4" />
              <span>+ Đặt lịch hẹn mới</span>
            </Link>
          )}
        </div>

        {/* ================================================================= */}
        {/* TẦNG 2: THANH TAB TRẠNG THÁI (CÓ SỐ ĐẾM) & BỘ LỌC TÌM KIẾM          */}
        {/* ================================================================= */}
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-100 space-y-4 animate-fade-up delay-100">
          {/* Dãy Tab Trạng thái */}
          <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-gray-100">
            {statusTabs.map((tab) => {
              const active = statusFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-gray-50 text-gray-600 hover:bg-teal-50 hover:text-teal-700'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] ${
                      active ? 'bg-white/20 text-white' : 'bg-gray-200/80 text-gray-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Thanh Tìm kiếm + Chọn ngày + Nút Hôm nay */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm bệnh nhân, bác sĩ, SĐT hoặc mã lịch hẹn..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200/80 text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={setTodayFilter}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-teal-50 text-teal-700 border border-teal-500 text-xs font-bold transition-colors cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Hôm nay</span>
              </button>

              {dateFilter && (
                <button
                  onClick={() => setDateFilter('')}
                  className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Xem tất cả ngày
                </button>
              )}

              <button
                onClick={() => {
                  setStatusFilter('All');
                  setSearchTerm('');
                  setDateFilter('');
                  fetchAppointments(true);
                }}
                title="Đặt lại bộ lọc"
                className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-500 border border-gray-200 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Dải Lịch Tuần Ngang (Weekly Date Strip) */}
          <div className="pt-2 flex items-center justify-center sm:justify-start gap-2 sm:gap-3 overflow-x-auto">
            <button
              onClick={() => shiftWeek(-7)}
              className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
              title="Tuần trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2.5">
              {weekDays.map((day) => {
                const isSelected = dateFilter === day.iso;
                return (
                  <button
                    key={day.iso}
                    onClick={() => setDateFilter(isSelected ? '' : day.iso)}
                    className={`w-14 sm:w-16 py-2.5 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer shrink-0 ${
                      isSelected
                        ? 'bg-emerald-50/80 border-2 border-teal-600 text-teal-700 shadow-xs'
                        : 'bg-white hover:bg-gray-50 border border-transparent text-gray-700'
                    }`}
                  >
                    <span className={`text-[11px] font-medium ${isSelected ? 'text-teal-700 font-bold' : 'text-gray-500'}`}>
                      {day.dayLabel}
                    </span>
                    <span className={`text-lg font-extrabold my-0.5 ${isSelected ? 'text-teal-800' : 'text-gray-800'}`}>
                      {day.dayNumber}
                    </span>
                    <span className={`text-[10px] ${isSelected ? 'text-teal-600 font-semibold' : 'text-gray-400'}`}>
                      {day.monthLabel}
                    </span>

                    {/* Chấm tròn báo hiệu ngày có lịch hẹn */}
                    <span
                      className={`w-1.5 h-1.5 rounded-full mt-1.5 ${
                        day.hasAppt
                          ? isSelected
                            ? 'bg-teal-600'
                            : 'bg-blue-500'
                          : 'bg-transparent'
                      }`}
                    ></span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => shiftWeek(7)}
              className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
              title="Tuần kế tiếp"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* TẦNG 3: DANH SÁCH THẺ DÒNG THỜI GIAN CA KHÁM (TIMELINE CARDS)      */}
        {/* ================================================================= */}
        <div className="space-y-3 animate-fade-up delay-200">
          {/* Tiêu đề danh sách lịch hẹn */}
          <div className="flex items-center justify-between px-1 pt-1">
            <h2 className="text-lg font-extrabold text-gray-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-600" />
              <span>
                {dateFilter ? `Lịch hẹn ngày ${formatDate(dateFilter)}` : 'Lịch hẹn gần đây'}
              </span>
            </h2>
            <span className="text-xs font-semibold text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-2xs">
              Hiển thị {filteredAppointments.length} ca khám
            </span>
          </div>
          {filteredAppointments.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 text-gray-400 text-sm">
              Không tìm thấy lịch hẹn khám nào khớp với bộ lọc hiện tại.
            </div>
          ) : (
            filteredAppointments.map((app) => (
              <div
                key={app.id}
                className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-gray-100 hover:border-teal-200 hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer"
                onClick={() => setSelectedAppointment(app)}
              >
                {/* CỤM TRÁI: Khối Thời gian + Thông tin Bệnh nhân & Bác sĩ */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1 min-w-0">
                  {/* Khối Lịch & Giờ khám nổi bật */}
                  <div className="w-full sm:w-28 py-2.5 px-3 rounded-2xl bg-teal-50/70 border border-teal-100 flex sm:flex-col items-center justify-between sm:justify-center text-center shrink-0">
                    <div className="flex items-center gap-1 text-teal-700 font-extrabold text-base">
                      <Clock className="w-4 h-4 shrink-0" />
                      <span>{app.time || '08:00'}</span>
                    </div>
                    <span className="text-[11px] font-semibold text-gray-500 mt-0.5">
                      {formatDate(app.date)}
                    </span>
                  </div>

                  {/* Thông tin Bệnh nhân & Bác sĩ phụ trách */}
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-teal-700 font-bold text-xs flex items-center justify-center border border-teal-200 shrink-0">
                        {getInitial(app.patientName)}
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-gray-800 leading-tight">
                          {app.patientName || 'Bệnh nhân chưa rõ'}
                        </h3>
                        <span className="text-[11px] font-mono text-gray-400">
                          Mã lịch: #{app.id}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-600">
                      <span className="inline-flex items-center gap-1.5 font-semibold text-teal-700 bg-teal-50/60 px-2.5 py-1 rounded-lg border border-teal-100">
                        <Stethoscope className="w-3.5 h-3.5" />
                        BS. {app.doctorName || 'Chưa phân công'}
                      </span>

                      {(app.reason || app.notes) && (
                        <span className="inline-flex items-center gap-1.5 text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100 max-w-md truncate">
                          <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="truncate">{app.reason || app.notes}</span>
                        </span>
                      )}

                      {app.prescription?.length > 0 && (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                          <Pill className="w-3.5 h-3.5" />
                          <span>{app.prescription.length} thuốc</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* CỤM PHẢI: Trạng thái & Các nút Duyệt Nhanh 1-Click */}
                <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-gray-100 shrink-0">
                  {/* Badge Trạng thái hiện tại */}
                  {renderStatusBadge(app.status)}

                  {/* Nút Duyệt Nhanh 1-Click theo ngữ cảnh trạng thái */}
                  <div className="flex items-center gap-1.5">
                    {app.status === 'Scheduled' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickStatusChange(app, 'Confirmed');
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-bold transition-colors cursor-pointer"
                        title="Xác nhận lịch hẹn này"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Xác nhận</span>
                      </button>
                    )}

                    {(app.status === 'Scheduled' || app.status === 'Confirmed') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickStatusChange(app, 'Completed');
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                        title="Đánh dấu hoàn thành ca khám"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Hoàn thành</span>
                      </button>
                    )}

                    {(app.status === 'Scheduled' || app.status === 'Confirmed') &&
                      (role === 'Admin' || role === 'Receptionist') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickStatusChange(app, 'Cancelled');
                          }}
                          className="p-1.5 rounded-xl bg-gray-50 hover:bg-red-50 text-gray-500 hover:text-red-600 border border-gray-200 transition-colors cursor-pointer"
                          title="Hủy ca khám"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}

                    {/* Nút Chỉnh sửa & Xóa */}
                    {(role === 'Admin' || role === 'Receptionist') && (
                      <>
                        <Link
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          to={`/appointments/edit/${app.id}`}
                          className="p-1.5 rounded-xl bg-gray-50 hover:bg-teal-50 text-gray-600 hover:text-teal-600 border border-gray-200 transition-colors"
                          title="Chỉnh sửa lịch hẹn"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Link>

                        {role === 'Admin' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteId(app.id);
                            }}
                            className="p-1.5 rounded-xl bg-gray-50 hover:bg-red-50 text-gray-600 hover:text-red-600 border border-gray-200 transition-colors cursor-pointer"
                            title="Xóa lịch hẹn"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ================================================================= */}
      {/* MODAL CHI TIẾT LỊCH HẸN & KÊ ĐƠN THUỐC                            */}
      {/* ================================================================= */}
      {selectedAppointment && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-up"
          onClick={() => setSelectedAppointment(null)}
        >
          <div
            className={`bg-white rounded-2xl shadow-xl w-full ${
              activeModalTab === 'prescription' ? 'max-w-2xl' : 'max-w-md'
            } overflow-hidden flex flex-col max-h-[90vh] transition-all`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-lg font-extrabold text-gray-800">Chi tiết Lịch hẹn</h2>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* THANH CHUYỂN TAB NẰM TRONG MODAL */}
            <div className="flex border-b border-gray-100 bg-gray-50/60 px-6 shrink-0">
              <button
                type="button"
                onClick={() => setActiveModalTab('info')}
                className={`flex items-center gap-2 py-3 px-4 text-xs font-bold uppercase border-b-2 transition-all cursor-pointer ${
                  activeModalTab === 'info'
                    ? 'border-teal-600 text-teal-700 bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Thông tin Ca khám</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveModalTab('prescription')}
                className={`flex items-center gap-2 py-3 px-4 text-xs font-bold uppercase border-b-2 transition-all cursor-pointer ${
                  activeModalTab === 'prescription'
                    ? 'border-teal-600 text-teal-700 bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <Pill className="w-4 h-4" />
                <span>Đơn thuốc & Lâm sàng</span>
                {prescriptionItems.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-teal-100 text-teal-800 font-extrabold">
                    {prescriptionItems.length}
                  </span>
                )}
              </button>
            </div>

            {/* NỘI DUNG TỪNG TAB TRONG MODAL */}
            <div className="p-6 overflow-y-auto">
              {activeModalTab === 'info' ? (
                <div>
                  {/* Thông tin Bệnh nhân */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                      <BriefcaseMedical className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-gray-900">
                        {selectedAppointment.patientName || 'Bệnh nhân chưa rõ'}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Mã BN: {selectedAppointment.patientId || '---'} | Giới tính:{' '}
                        {selectedAppointment.patientGender || selectedAppointment.gender || 'Chưa cập nhật'}
                      </p>
                    </div>
                  </div>

                  <hr className="border-gray-100 mb-6" />

                  {/* Danh sách thông tin chi tiết */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2.5 text-gray-500">
                        <FileText className="w-4 h-4" />
                        <span className="text-sm">Mã lịch hẹn:</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">
                        APT-{String(selectedAppointment.id).padStart(4, '0')}A
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2.5 text-gray-500">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">Ngày hẹn:</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{selectedAppointment.date}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2.5 text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">Thời gian:</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{selectedAppointment.time}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2.5 text-gray-500">
                        <Activity className="w-4 h-4" />
                        <span className="text-sm">Lý do khám:</span>
                      </div>
                      <span
                        className="text-sm font-bold text-gray-900 text-right max-w-[50%] truncate"
                        title={selectedAppointment.reason}
                      >
                        {selectedAppointment.reason || 'Khám tổng quát'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2.5 text-gray-500">
                        <User className="w-4 h-4" />
                        <span className="text-sm">Bác sĩ:</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{selectedAppointment.doctorName}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2.5 text-gray-500">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-sm">Trạng thái:</span>
                      </div>
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${
                          selectedAppointment.status === 'Scheduled'
                            ? 'bg-gray-100 text-gray-700 border border-gray-200'
                            : selectedAppointment.status === 'Confirmed'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : selectedAppointment.status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : selectedAppointment.status === 'Cancelled'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-gray-50 text-gray-700 border border-gray-200'
                        }`}
                      >
                        {selectedAppointment.status === 'Scheduled'
                          ? 'Chờ xác nhận'
                          : selectedAppointment.status === 'Confirmed'
                          ? 'Đã xác nhận'
                          : selectedAppointment.status === 'Completed'
                          ? 'Hoàn thành'
                          : selectedAppointment.status === 'Cancelled'
                          ? 'Đã hủy'
                          : selectedAppointment.status}
                      </span>
                    </div>
                  </div>

                  {/* Khu vực nút bấm Action */}
                  <div className="mt-8 space-y-2.5">
                    <button
                      type="button"
                      onClick={() => setActiveModalTab('prescription')}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-700 text-sm font-bold transition-colors cursor-pointer"
                    >
                      <Pill className="w-4 h-4" />
                      Kê đơn thuốc & Ghi chú lâm sàng
                    </button>

                    <Link
                      to={`/appointments/edit/${selectedAppointment.id}`}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-bold transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      Xem / Chỉnh sửa lịch hẹn
                    </Link>

                    <button
                      onClick={() => {
                        setSelectedAppointment(null);
                        setDeleteId(selectedAppointment.id);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 bg-white hover:bg-red-50 text-red-500 text-sm font-bold transition-colors cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      Hủy lịch khám
                    </button>
                  </div>
                </div>
              ) : (
                /* GIAO DIỆN TAB KÊ ĐƠN THUỐC */
                <div className="space-y-6 animate-fade-up">
                  {/* Khung Nhập/Sửa thuốc (Ẩn nếu ca khám đã Hủy) */}
                  {selectedAppointment.status !== 'Cancelled' && (
                    <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-100 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-extrabold text-teal-900 uppercase flex items-center gap-1.5">
                          <Pill className="w-4 h-4 text-teal-600" />
                          {editingMedIndex >= 0 ? 'Chỉnh sửa thuốc trong đơn' : 'Kê thêm thuốc vào đơn'}
                        </h4>
                        {editingMedIndex >= 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingMedIndex(-1);
                              setMedForm({ medicineId: '', quantity: 1, dosage: '' });
                            }}
                            className="text-xs text-red-600 hover:underline font-semibold cursor-pointer"
                          >
                            Hủy sửa
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                        {/* Chọn thuốc */}
                        <div className="sm:col-span-5">
                          <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                            Tên thuốc / Hoạt chất *
                          </label>
                          <select
                            value={medForm.medicineId}
                            onChange={(e) => setMedForm({ ...medForm, medicineId: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                          >
                            <option value="">-- Chọn thuốc trong kho --</option>
                            {medicinesList.map((med) => (
                              <option key={med.id} value={med.id}>
                                {med.name} ({med.price?.toLocaleString()}đ/{med.unit})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Số lượng */}
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                            Số lượng *
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={medForm.quantity}
                            onChange={(e) => setMedForm({ ...medForm, quantity: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                          />
                        </div>

                        {/* Liều dùng */}
                        <div className="sm:col-span-5">
                          <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                            Liều dùng & Cách uống *
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={medForm.dosage}
                              onChange={(e) => setMedForm({ ...medForm, dosage: e.target.value })}
                              placeholder="VD: Sáng 1v, tối 1v sau ăn"
                              className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                            />
                            <button
                              type="button"
                              onClick={handleAddOrUpdateMed}
                              className="shrink-0 inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                            >
                              <Plus className="w-4 h-4" />
                              <span>{editingMedIndex >= 0 ? 'Cập nhật' : 'Thêm'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bảng Danh sách thuốc đã kê */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-700 uppercase mb-3">
                      Danh mục thuốc đã chỉ định ({prescriptionItems.length})
                    </h4>

                    {prescriptionItems.length === 0 ? (
                      <div className="p-8 text-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 text-gray-400 text-sm">
                        Chưa có loại thuốc nào được kê cho ca khám này.
                      </div>
                    ) : (
                      <div className="border border-gray-200 rounded-2xl overflow-hidden">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase">
                              <th className="py-2.5 px-4">STT</th>
                              <th className="py-2.5 px-4">Tên thuốc</th>
                              <th className="py-2.5 px-4 text-center">Số lượng</th>
                              <th className="py-2.5 px-4">Hướng dẫn sử dụng</th>
                              <th className="py-2.5 px-4 text-right">Thao tác</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 text-sm">
                            {prescriptionItems.map((item, idx) => (
                              <tr key={idx} className="hover:bg-gray-50/80">
                                <td className="py-3 px-4 font-bold text-gray-400">{idx + 1}</td>
                                <td className="py-3 px-4 font-bold text-teal-900">{item.medicineName}</td>
                                <td className="py-3 px-4 text-center">
                                  <span className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 font-bold text-xs">
                                    {item.quantity} {item.unit || 'Viên'}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-gray-600">{item.dosage}</td>
                                <td className="py-3 px-4 text-right">
                                  <div className="inline-flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleEditMedRow(idx)}
                                      className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                      title="Sửa liều lượng"
                                    >
                                      <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveMedRow(idx)}
                                      className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                      title="Xóa khỏi đơn"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Ghi chú lâm sàng của Bác sĩ */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                      Lời dặn của Bác sĩ / Chẩn đoán lâm sàng
                    </label>
                    <textarea
                      rows="2"
                      value={doctorNotes}
                      onChange={(e) => setDoctorNotes(e.target.value)}
                      placeholder="Nhập kết luận chẩn đoán, lời dặn ăn uống, ngày tái khám..."
                      className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                  </div>

                  {/* Nút Lưu Đơn Thuốc */}
                  {selectedAppointment.status !== 'Cancelled' && (
                    <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                      <button
                        type="button"
                        disabled={isSavingPrescription}
                        onClick={() => handleSavePrescriptionToDB(false)}
                        className="px-4 py-2.5 rounded-xl border border-teal-600 text-teal-700 hover:bg-teal-50 text-xs font-bold transition-all cursor-pointer"
                      >
                        Lưu nháp đơn thuốc
                      </button>

                      <button
                        type="button"
                        disabled={isSavingPrescription}
                        onClick={() => handleSavePrescriptionToDB(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Lưu Đơn & Hoàn thành Ca khám</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal xác nhận xóa đặt bên ngoài div space-y-6 để không bị hở mép trên */}
      <ConfirmModal
        isOpen={Boolean(deleteId)}
        title="Xác nhận xóa lịch hẹn"
        message="Bạn có chắc chắn muốn xóa lịch hẹn khám này khỏi hệ thống? Thao tác này không thể hoàn tác."
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteId(null)}
        onClose={() => setDeleteId(null)}
      />
    </>
  );
}