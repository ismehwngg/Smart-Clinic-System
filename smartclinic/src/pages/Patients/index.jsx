import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Activity,
  Calendar,
  Search,
  RotateCcw,
  Download,
  Phone,
  MapPin,
  FileText,
  Edit3,
  Trash2,
  X,
  Eye,
  CalendarPlus,
  Clock,
  Stethoscope,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import ConfirmModal from '../../components/common/ConfirmModal';

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // State bộ lọc & tìm kiếm
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // State cho Panel chi tiết bên phải (Master-Detail View)
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'medical' | 'visits'

  // State cho Modal xóa
  const [deleteId, setDeleteId] = useState(null);

  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const role = currentUser?.role || 'Receptionist';

  const fetchData = async (showToast = false) => {
    setIsLoading(true);
    try {
      const [patientsRes, appointmentsRes] = await Promise.all([
        api.get('/patients'),
        api.get('/appointments')
      ]);

      const patientList = patientsRes.data || [];
      setPatients(patientList);
      setAppointments(appointmentsRes.data || []);

      // Tự động chọn bệnh nhân đầu tiên để hiển thị khung bên phải giống mẫu thiết kế
      if (patientList.length > 0 && !selectedPatient) {
        setSelectedPatient(patientList[0]);
      } else if (selectedPatient) {
        const updated = patientList.find((p) => p.id === selectedPatient.id);
        setSelectedPatient(updated || patientList[0] || null);
      }

      if (showToast) toast.success('Đã làm mới danh bạ bệnh nhân!');
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu bệnh nhân:', error);
      toast.error('Không thể tải danh sách bệnh nhân!');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 1. Các hàm hỗ trợ tính toán thông tin từ dữ liệu thật
  const getInitial = (name) => {
    if (!name) return 'P';
    const parts = name.trim().split(' ');
    return parts[parts.length - 1].charAt(0).toUpperCase();
  };

  const calculateAge = (dob) => {
    if (!dob) return null;
    const year = parseInt(dob.split('-')[0], 10);
    if (isNaN(year)) return null;
    return new Date().getFullYear() - year;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Chưa cập nhật';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  // Lấy danh sách lịch hẹn của 1 bệnh nhân cụ thể
  const getPatientAppointments = (patient) => {
    if (!patient) return [];
    return appointments.filter(
      (app) =>
        String(app.patientId) === String(patient.id) ||
        (app.patientName && patient.fullName && app.patientName.toLowerCase() === patient.fullName.toLowerCase())
    );
  };

  // Xác định trạng thái điều trị của bệnh nhân dựa trên lịch hẹn
  const getPatientTreatmentStatus = (patient) => {
    const pApps = getPatientAppointments(patient);
    if (pApps.length === 0) return { key: 'New', label: 'Mới tiếp nhận', classes: 'bg-gray-100 text-gray-600' };
    const hasActive = pApps.some((a) => a.status === 'Scheduled' || a.status === 'Confirmed');
    if (hasActive) return { key: 'InProgress', label: 'Đang theo dõi', classes: 'bg-teal-50 text-teal-700 border border-teal-200' };
    const hasCompleted = pApps.some((a) => a.status === 'Completed');
    if (hasCompleted) return { key: 'Completed', label: 'Đã hoàn thành', classes: 'bg-emerald-50 text-emerald-700 border border-emerald-200' };
    return { key: 'New', label: 'Mới tiếp nhận', classes: 'bg-gray-100 text-gray-600' };
  };

  // Tìm bác sĩ phụ trách & ngày khám gần nhất của bệnh nhân
  const getLastVisitInfo = (patient) => {
    const pApps = getPatientAppointments(patient);
    if (pApps.length === 0) {
      return { doctor: 'Chưa phân công', lastDate: 'Chưa có lịch khám' };
    }
    const sorted = [...pApps].sort((a, b) => new Date(b.date) - new Date(a.date));
    return {
      doctor: sorted[0].doctorName || 'Bác sĩ đa khoa',
      lastDate: formatDate(sorted[0].date)
    };
  };

  // 2. Tính toán 4 chỉ số cho 4 thẻ KPI đầu trang
  const totalPatientsCount = patients.length;
  const patientsWithMedicalNotes = patients.filter(
    (p) => p.medicalHistory && p.medicalHistory.trim() !== '' && p.medicalHistory !== 'Không có'
  ).length;
  const activeTreatmentsCount = patients.filter(
    (p) => getPatientTreatmentStatus(p).key === 'InProgress'
  ).length;
  const todayStr = new Date().toISOString().split('T')[0];
  const appointmentsTodayCount = appointments.filter((a) => a.date === todayStr).length || appointments.filter((a) => a.status === 'Scheduled' || a.status === 'Confirmed').length;

  // 3. Lọc danh sách bệnh nhân
  const filteredPatients = patients.filter((p) => {
    const nameMatch = (p.fullName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const phoneMatch = (p.phone || '').includes(searchTerm);
    const idMatch = String(p.id || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSearch = nameMatch || phoneMatch || idMatch;

    const matchesGender = genderFilter === 'All' || p.gender === genderFilter;
    const statusObj = getPatientTreatmentStatus(p);
    const matchesStatus = statusFilter === 'All' || statusObj.key === statusFilter;

    return matchesSearch && matchesGender && matchesStatus;
  });

  // 4. Xử lý xóa bệnh nhân
  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/patients/${deleteId}`);
      toast.success('Đã xóa hồ sơ bệnh nhân thành công!');
      const remaining = patients.filter((p) => p.id !== deleteId);
      setPatients(remaining);
      if (selectedPatient?.id === deleteId) {
        setSelectedPatient(remaining[0] || null);
      }
    } catch (error) {
      console.error('Lỗi khi xóa bệnh nhân:', error);
      toast.error('Không thể xóa hồ sơ bệnh nhân này!');
    } finally {
      setDeleteId(null);
    }
  };

  // 5. Tính năng Xuất dữ liệu ra file CSV (Mở bằng Excel hỗ trợ tiếng Việt)
  const handleExportCSV = () => {
    if (patients.length === 0) {
      toast.error('Không có dữ liệu để xuất!');
      return;
    }
    const headers = ['Mã BN', 'Họ và Tên', 'Số điện thoại', 'Giới tính', 'Ngày sinh', 'Địa chỉ', 'Tiền sử bệnh'];
    const rows = patients.map((p) => [
      p.id,
      `"${p.fullName || ''}"`,
      `"${p.phone || ''}"`,
      p.gender || '',
      p.dateOfBirth || p.dob || '',
      `"${p.address || ''}"`,
      `"${p.medicalHistory || 'Không có'}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Danh_ba_benh_nhan_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Đã xuất file Excel (CSV) thành công!');
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-gray-500">
        Đang tải danh bạ hồ sơ bệnh nhân...
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
      {/* ================================================================= */}
      {/* TẦNG 1: HEADER DANH BẠ BỆNH NHÂN & CỤM NÚT HÀNH ĐỘNG              */}
      {/* ================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-up">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">
            Danh bạ Hồ sơ Bệnh nhân
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Quản lý thông tin hành chính, hồ sơ bệnh sử và tiến trình điều trị của bệnh nhân
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-xs sm:text-sm font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-teal-600" />
            <span>Xuất Dữ liệu</span>
          </button>

          {(role === 'Admin' || role === 'Receptionist') && (
            <Link
              to="/patients/create"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Thêm Bệnh nhân</span>
            </Link>
          )}
        </div>
      </div>

      {/* ================================================================= */}
      {/* TẦNG 2: 4 THẺ CHỈ SỐ MINI-KPI (GIỐNG ẢNH MẪU)                     */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 animate-fade-up delay-100">
        {/* Card 1 */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-gray-400">Tổng Bệnh nhân</span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-gray-800">{totalPatientsCount}</h3>
            <p className="text-xs text-gray-400 mt-0.5">Đã đăng ký trong hệ thống</p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-gray-400">Đang theo dõi</span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-gray-800">{activeTreatmentsCount}</h3>
            <p className="text-xs text-gray-400 mt-0.5">Bệnh nhân có lịch hẹn khám</p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-gray-400">Lưu ý Bệnh sử</span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-gray-800">{patientsWithMedicalNotes}</h3>
            <p className="text-xs text-gray-400 mt-0.5">Có tiền sử bệnh / dị ứng</p>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-gray-400">Ca khám chờ xử lý</span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-gray-800">{appointmentsTodayCount}</h3>
            <p className="text-xs text-gray-400 mt-0.5">Lịch hẹn đang hoạt động</p>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* TẦNG 3: THANH CÔNG CỤ TÌM KIẾM & BỘ LỌC NHANH                     */}
      {/* ================================================================= */}
      <div className="bg-white p-3.5 rounded-2xl shadow-xs border border-gray-100 flex flex-wrap items-center gap-3 w-full lg:w-fit animate-fade-up delay-200">
        {/* Ô tìm kiếm */}
        <div className="relative flex-1 sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên, SĐT hoặc mã BN..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-50 border border-gray-200/80 text-xs sm:text-sm text-gray-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
          />
        </div>

        {/* Lọc Trạng thái */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200/80 text-xs sm:text-sm text-gray-700 font-medium focus:outline-none focus:border-teal-500 cursor-pointer"
        >
          <option value="All">Tất cả trạng thái</option>
          <option value="InProgress">Đang theo dõi</option>
          <option value="Completed">Đã hoàn thành</option>
          <option value="New">Mới tiếp nhận</option>
        </select>

        {/* Lọc Giới tính */}
        <select
          value={genderFilter}
          onChange={(e) => setGenderFilter(e.target.value)}
          className="px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200/80 text-xs sm:text-sm text-gray-700 font-medium focus:outline-none focus:border-teal-500 cursor-pointer"
        >
          <option value="All">Tất cả giới tính</option>
          <option value="Nam">Nam</option>
          <option value="Nữ">Nữ</option>
        </select>

        {/* Nút Reset bộ lọc */}
        <button
          onClick={() => {
            setSearchTerm('');
            setGenderFilter('All');
            setStatusFilter('All');
            fetchData(true);
          }}
          title="Đặt lại bộ lọc"
          className="p-2 rounded-xl bg-gray-50 hover:bg-teal-50 text-gray-500 hover:text-teal-600 border border-gray-200/80 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* ================================================================= */}
      {/* TẦNG 4: BỐ CỤC MASTER-DETAIL (BẢNG BÊN TRÁI + PANEL BÊN PHẢI)     */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-up delay-300">
        {/* CỘT TRÁI: BẢNG DANH SÁCH BỆNH NHÂN (Chiếm 8/12 cột khi mở Panel, hoặc 12/12 nếu đóng) */}
        <div className={`${selectedPatient ? 'lg:col-span-8' : 'lg:col-span-12'} bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden transition-all`}>
          {filteredPatients.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-sm">
              Không tìm thấy hồ sơ bệnh nhân nào khớp với bộ lọc hiện tại.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">
                    <th className="py-3.5 px-4">Bệnh nhân</th>
                    <th className="py-3.5 px-4">Số điện thoại</th>
                    <th className="py-3.5 px-4">Ngày sinh</th>
                    <th className="py-3.5 px-4">Bác sĩ phụ trách</th>
                    <th className="py-3.5 px-4">Trạng thái</th>
                    <th className="py-3.5 px-4">Lần khám cuối</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                  {filteredPatients.map((patient) => {
                    const isSelected = selectedPatient?.id === patient.id;
                    const dob = patient.dateOfBirth || patient.dob;
                    const age = calculateAge(dob);
                    const statusInfo = getPatientTreatmentStatus(patient);
                    const visitInfo = getLastVisitInfo(patient);

                    return (
                      <tr
                        key={patient.id}
                        onClick={() => setSelectedPatient(patient)}
                        className={`cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-emerald-50/60 border-l-4 border-l-teal-600'
                            : 'hover:bg-gray-50/80 border-l-4 border-l-transparent'
                        }`}
                      >
                        {/* Cột 1: Avatar + Tên + Mã BN */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                isSelected
                                  ? 'bg-teal-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {getInitial(patient.fullName)}
                            </div>
                            <div>
                              <p
                                className={`font-bold ${
                                  isSelected ? 'text-teal-700' : 'text-gray-800'
                                }`}
                              >
                                {patient.fullName}
                              </p>
                              <p className="text-[11px] text-gray-400 font-mono">
                                ID: P-{patient.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Cột 2: Điện thoại */}
                        <td className="py-3.5 px-4 text-gray-600 font-mono text-xs">
                          {patient.phone || '---'}
                        </td>

                        {/* Cột 3: Ngày sinh & Tuổi */}
                        <td className="py-3.5 px-4">
                          <p className="text-gray-700 text-xs font-medium">
                            {formatDate(dob)}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            {age ? `${age} tuổi` : patient.gender || ''}
                          </p>
                        </td>

                        {/* Cột 4: Bác sĩ */}
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1.5 text-xs text-gray-600">
                            <Stethoscope className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span className="truncate max-w-[130px]">{visitInfo.doctor}</span>
                          </span>
                        </td>

                        {/* Cột 5: Badge Trạng thái */}
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusInfo.classes}`}>
                            {statusInfo.label}
                          </span>
                        </td>

                        {/* Cột 6: Lần khám cuối */}
                        <td className="py-3.5 px-4 text-xs text-gray-600 font-medium">
                          {visitInfo.lastDate}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
          
        {/* CỘT PHẢI: KHUNG CHI TIẾT BỆNH NHÂN (PATIENT DETAILS PANEL - Chiếm 4/12 cột) */}
        {selectedPatient && (
          <div className="lg:col-span-4 bg-white rounded-2xl shadow-xs border border-gray-100 p-6 sticky top-6">
            {/* Header Panel */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-50">
              <h3 className="text-base font-bold text-gray-800">Chi tiết Bệnh nhân</h3>
              <button
                onClick={() => setSelectedPatient(null)}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors cursor-pointer"
                title="Đóng bảng chi tiết"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Khối Avatar tròn lớn ở chính giữa giống hệt mẫu */}
            <div className="flex flex-col items-center text-center my-6">
              <div className="w-20 h-20 rounded-full bg-slate-100 text-slate-700 border-2 border-teal-600 flex items-center justify-center text-2xl font-bold shadow-xs mb-3">
                {getInitial(selectedPatient.fullName)}
              </div>
              <h4 className="text-lg font-extrabold text-gray-800">
                {selectedPatient.fullName}
              </h4>
              <div className="mt-1.5">
                <span className={`px-3 py-0.5 rounded-full text-xs font-semibold ${getPatientTreatmentStatus(selectedPatient).classes}`}>
                  {getPatientTreatmentStatus(selectedPatient).label}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-2 font-mono">
                ID: P-{selectedPatient.id} •{' '}
                {calculateAge(selectedPatient.dateOfBirth || selectedPatient.dob)
                  ? `${calculateAge(selectedPatient.dateOfBirth || selectedPatient.dob)} tuổi`
                  : selectedPatient.gender || 'Chưa rõ'}
              </p>
            </div>

            {/* Thanh chuyển Tab (Overview / Medical Info / Visits) */}
            <div className="grid grid-cols-3 border-b border-gray-100 text-xs font-semibold text-center mb-5">
              <button
                onClick={() => setActiveTab('overview')}
                className={`pb-2.5 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'overview'
                    ? 'border-teal-600 text-teal-600 font-bold'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                Tổng quan
              </button>
              <button
                onClick={() => setActiveTab('medical')}
                className={`pb-2.5 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'medical'
                    ? 'border-teal-600 text-teal-600 font-bold'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                Tiền sử bệnh
              </button>
              <button
                onClick={() => setActiveTab('visits')}
                className={`pb-2.5 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'visits'
                    ? 'border-teal-600 text-teal-600 font-bold'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                Lịch khám ({getPatientAppointments(selectedPatient).length})
              </button>
            </div>

            {/* Nội dung theo từng Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-3.5 text-xs">
                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-gray-400 flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5" /> Điện thoại
                  </span>
                  <span className="font-bold text-gray-800 font-mono">
                    {selectedPatient.phone || 'Chưa cập nhật'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-gray-400 flex items-center gap-2">
                    <Users className="w-3.5 h-3.5" /> Giới tính
                  </span>
                  <span className="font-semibold text-gray-800">
                    {selectedPatient.gender || 'Chưa cập nhật'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="text-gray-400 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" /> Ngày sinh
                  </span>
                  <span className="font-semibold text-gray-800">
                    {formatDate(selectedPatient.dateOfBirth || selectedPatient.dob)}
                  </span>
                </div>

                <div className="flex items-start justify-between py-2 border-b border-gray-50 gap-4">
                  <span className="text-gray-400 flex items-center gap-2 shrink-0">
                    <MapPin className="w-3.5 h-3.5" /> Địa chỉ
                  </span>
                  <span className="font-semibold text-gray-800 text-right">
                    {selectedPatient.address || 'Chưa cập nhật'}
                  </span>
                </div>
              </div>
            )}

            {activeTab === 'medical' && (
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-100">
                  <p className="font-bold text-amber-800 flex items-center gap-1.5 mb-1">
                    <FileText className="w-3.5 h-3.5" /> Tiền sử bệnh lý & Dị ứng
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    {selectedPatient.medicalHistory || 'Bệnh nhân chưa ghi nhận tiền sử bệnh lý đặc biệt.'}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-gray-400 mb-1">Bác sĩ theo dõi gần nhất:</p>
                  <p className="font-bold text-gray-800">
                    {getLastVisitInfo(selectedPatient).doctor}
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'visits' && (
              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {getPatientAppointments(selectedPatient).length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6">
                    Bệnh nhân chưa có lịch hẹn khám nào.
                  </p>
                ) : (
                  getPatientAppointments(selectedPatient).map((app) => (
                    <div
                      key={app.id}
                      className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-gray-800">{app.doctorName}</p>
                        <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" /> {app.time} - {formatDate(app.date)}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-white border border-gray-200 text-[10px] font-semibold text-gray-600">
                        {app.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Cụm nút thao tác ở đáy Panel */}
            <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to={`/patients/${selectedPatient.id}`}
                  className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" /> Hồ sơ đầy đủ
                </Link>

                <Link
                  to="/appointments/create"
                  className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors"
                >
                  <CalendarPlus className="w-3.5 h-3.5" /> Đặt lịch khám
                </Link>
              </div>

              {(role === 'Admin' || role === 'Receptionist') && (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to={`/patients/edit/${selectedPatient.id}`}
                    className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold border border-gray-200/70 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Chỉnh sửa
                  </Link>

                  {role === 'Admin' && (
                    <button
                      onClick={() => setDeleteId(selectedPatient.id)}
                      className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold border border-red-100 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Xóa hồ sơ
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      </div>
      {/* Modal xác nhận xóa */}
      <ConfirmModal
        isOpen={Boolean(deleteId)}
        title="Xác nhận xóa hồ sơ bệnh nhân"
        message="Bạn có chắc chắn muốn xóa hồ sơ bệnh nhân này khỏi hệ thống? Thao tác này không thể hoàn tác."
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteId(null)}
        onClose={() => setDeleteId(null)}
      />
    </>
  );
}