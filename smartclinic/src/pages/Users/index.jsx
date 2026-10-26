import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users as UsersIcon,
  UserPlus,
  ShieldCheck,
  Stethoscope,
  Headset,
  Search,
  RotateCcw,
  Edit3,
  Trash2,
  KeyRound,
  CheckCircle2,
  Lock
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import ConfirmModal from '../../components/common/ConfirmModal';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // State tìm kiếm & lọc theo vai trò
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  // State Modal xóa
  const [deleteId, setDeleteId] = useState(null);

  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;

  const fetchUsers = async (showToast = false) => {
    setIsLoading(true);
    try {
      const response = await api.get('/auth/users');
      setUsers(response.data || []);
      if (showToast) toast.success('Đã làm mới danh sách tài khoản!');
    } catch (error) {
      console.error('Lỗi khi tải danh sách tài khoản:', error);
      toast.error('Không thể tải danh sách tài khoản nhân sự!');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 1. Xử lý xóa tài khoản
  const handleConfirmDelete = async () => {
    if (!deleteId) return;

    // Chặn tự xóa chính mình
    if (
      String(deleteId) === String(currentUser?.id) ||
      users.find((u) => u.id === deleteId)?.username === currentUser?.username
    ) {
      toast.error('Bạn không thể tự xóa tài khoản đang đăng nhập của chính mình!');
      setDeleteId(null);
      return;
    }

    try {
      await api.delete(`/auth/users/${deleteId}`);
      setUsers((prev) => prev.filter((u) => u.id !== deleteId));
      toast.success('Đã thu hồi và xóa tài khoản thành công!');
    } catch (error) {
      console.error('Lỗi khi xóa tài khoản:', error);
      toast.error('Không thể xóa tài khoản này!');
    } finally {
      setDeleteId(null);
    }
  };

  // 2. Các hàm hiển thị Badge Vai trò & Quyền hạn
  const renderRoleBadge = (role) => {
    const roleMap = {
      Admin: {
        label: 'Quản trị viên (Admin)',
        classes: 'bg-purple-50 text-purple-700 border-purple-200',
        icon: ShieldCheck
      },
      Doctor: {
        label: 'Bác sĩ (Doctor)',
        classes: 'bg-teal-50 text-teal-700 border-teal-200',
        icon: Stethoscope
      },
      Receptionist: {
        label: 'Lễ tân (Receptionist)',
        classes: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: Headset
      }
    };

    const current = roleMap[role] || {
      label: role || 'Nhân viên',
      classes: 'bg-gray-50 text-gray-700 border-gray-200',
      icon: UsersIcon
    };
    const IconComponent = current.icon;

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${current.classes}`}
      >
        <IconComponent className="w-3.5 h-3.5" />
        <span>{current.label}</span>
      </span>
    );
  };

  const getRolePermissionsText = (role) => {
    if (role === 'Admin') return 'Toàn quyền hệ thống, nhân sự & thống kê';
    if (role === 'Doctor') return 'Xem lịch khám, hồ sơ bệnh án & chuyên môn';
    return 'Tiếp đón bệnh nhân, đặt & điều phối lịch hẹn';
  };

  // 3. Thống kê số lượng theo từng vai trò
  const roleCounts = {
    All: users.length,
    Admin: users.filter((u) => u.role === 'Admin').length,
    Doctor: users.filter((u) => u.role === 'Doctor').length,
    Receptionist: users.filter((u) => u.role === 'Receptionist').length
  };

  const roleTabs = [
    { key: 'All', label: 'Tất cả nhân sự', count: roleCounts.All },
    { key: 'Admin', label: 'Quản trị viên', count: roleCounts.Admin },
    { key: 'Doctor', label: 'Bác sĩ', count: roleCounts.Doctor },
    { key: 'Receptionist', label: 'Lễ tân', count: roleCounts.Receptionist }
  ];

  // 4. Lọc danh sách tài khoản
  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === 'All' || u.role === roleFilter;
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      (u.fullName || '').toLowerCase().includes(q) ||
      (u.username || '').toLowerCase().includes(q) ||
      String(u.id || '').toLowerCase().includes(q);

    return matchesRole && matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="p-8 text-center text-gray-500">
        Đang tải danh sách tài khoản và phân quyền hệ thống...
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* ================================================================= */}
        {/* TẦNG 1: HEADER QUẢN TRỊ TÀI KHOẢN & PHÂN QUYỀN (RBAC)              */}
        {/* ================================================================= */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-up">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-teal-50 text-teal-700 text-xs font-bold mb-1.5 border border-teal-100">
              <Lock className="w-3 h-3" />
              <span>Bảo mật Phân quyền RBAC</span>
            </div>
            <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">
              Quản lý Tài khoản Nhân sự
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Cấp phát tài khoản đăng nhập, phân quyền vai trò và kiểm soát truy cập hệ thống
            </p>
          </div>

          <Link
            to="/users/create"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold shadow-sm transition-all shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Cấp Tài khoản mới</span>
          </Link>
        </div>

        {/* ================================================================= */}
        {/* TẦNG 2: 4 THẺ TÓM TẮT NHÂN SỰ THEO VAI TRÒ                        */}
        {/* ================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 animate-fade-up delay-100">
          <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase">Tổng Tài khoản</p>
              <h3 className="text-2xl font-extrabold text-gray-800 mt-1">{roleCounts.All}</h3>
              <p className="text-xs text-emerald-600 font-medium mt-1">Đang kích hoạt</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <UsersIcon className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase">Quản trị viên</p>
              <h3 className="text-2xl font-extrabold text-purple-700 mt-1">{roleCounts.Admin}</h3>
              <p className="text-xs text-gray-400 mt-1">Toàn quyền hệ thống</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase">Tài khoản Bác sĩ</p>
              <h3 className="text-2xl font-extrabold text-teal-700 mt-1">{roleCounts.Doctor}</h3>
              <p className="text-xs text-gray-400 mt-1">Khám & xem bệnh án</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
              <Stethoscope className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase">Tài khoản Lễ tân</p>
              <h3 className="text-2xl font-extrabold text-amber-600 mt-1">{roleCounts.Receptionist}</h3>
              <p className="text-xs text-gray-400 mt-1">Tiếp đón & điều phối</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <Headset className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* TẦNG 3: THANH LỌC VAI TRÒ (FILTER PILLS) & BẢNG TÀI KHOẢN          */}
        {/* ================================================================= */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden animate-fade-up delay-200">
          {/* Thanh công cụ lọc & tìm kiếm */}
          <div className="p-4 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Nút bấm lọc nhanh vai trò */}
            <div className="flex flex-wrap items-center gap-2">
              {roleTabs.map((tab) => {
                const active = roleFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setRoleFilter(tab.key)}
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

            {/* Ô tìm kiếm + Nút làm mới */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-72">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm họ tên, username hoặc mã NV..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                />
              </div>

              <button
                onClick={() => {
                  setRoleFilter('All');
                  setSearchTerm('');
                  fetchUsers(true);
                }}
                title="Đặt lại bộ lọc"
                className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-500 border border-gray-200 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Bảng danh sách nhân sự */}
          {filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-sm">
              Không tìm thấy tài khoản nhân sự nào khớp với bộ lọc hiện tại.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/70 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Nhân sự</th>
                    <th className="py-3.5 px-6">Tên đăng nhập</th>
                    <th className="py-3.5 px-6">Vai trò & Phân quyền</th>
                    <th className="py-3.5 px-6">Trạng thái</th>
                    <th className="py-3.5 px-6 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                  {filteredUsers.map((u, idx) => {
                    const isCurrentUser =
                      String(u.id) === String(currentUser?.id) ||
                      u.username === currentUser?.username;

                    return (
                      <tr
                        key={u.id}
                        className={`transition-colors ${
                          isCurrentUser ? 'bg-teal-50/30' : 'hover:bg-gray-50/80'
                        }`}
                      >
                        {/* Cột 1: Avatar chân dung + Họ tên */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3.5">
                            <img
                              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username || u.fullName || idx}`}
                              alt={u.fullName}
                              className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 p-0.5 shrink-0"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-800">
                                  {u.fullName || u.username}
                                </span>
                                {isCurrentUser && (
                                  <span className="px-2 py-0.5 rounded-md bg-teal-600 text-white text-[10px] font-bold">
                                    Bạn
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                                ID: #{u.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Cột 2: Username */}
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-mono text-xs font-semibold">
                            <KeyRound className="w-3 h-3 text-slate-400" />
                            @{u.username}
                          </span>
                        </td>

                        {/* Cột 3: Badge Vai trò & Mô tả quyền */}
                        <td className="py-4 px-6">
                          <div className="space-y-1">
                            {renderRoleBadge(u.role)}
                            <p className="text-[11px] text-gray-400">
                              {getRolePermissionsText(u.role)}
                            </p>
                          </div>
                        </td>

                        {/* Cột 4: Trạng thái hoạt động */}
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                            <CheckCircle2 className="w-4 h-4" />
                            Đang hoạt động
                          </span>
                        </td>

                        {/* Cột 5: Nút Chỉnh sửa & Xóa */}
                        <td className="py-4 px-6 text-right">
                          <div className="inline-flex items-center justify-end gap-2">
                            <Link
                              to={`/users/edit/${u.id}`}
                              className="p-2 rounded-xl bg-gray-50 hover:bg-teal-50 text-gray-600 hover:text-teal-600 border border-gray-200 transition-colors"
                              title="Chỉnh sửa tài khoản"
                            >
                              <Edit3 className="w-4 h-4" />
                            </Link>

                            <button
                              onClick={() => setDeleteId(u.id)}
                              disabled={isCurrentUser}
                              className={`p-2 rounded-xl border transition-colors ${
                                isCurrentUser
                                  ? 'bg-gray-100 text-gray-300 border-gray-100 cursor-not-allowed'
                                  : 'bg-gray-50 hover:bg-red-50 text-gray-600 hover:text-red-600 border-gray-200 cursor-pointer'
                              }`}
                              title={
                                isCurrentUser
                                  ? 'Không thể xóa tài khoản đang đăng nhập'
                                  : 'Thu hồi / Xóa tài khoản'
                              }
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal xác nhận xóa đặt bên ngoài div space-y-6 để phủ kín màn hình */}
      <ConfirmModal
        isOpen={Boolean(deleteId)}
        title="Xác nhận thu hồi tài khoản"
        message="Bạn có chắc chắn muốn xóa tài khoản nhân sự này? Nhân viên này sẽ không thể đăng nhập vào hệ thống được nữa."
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteId(null)}
        onClose={() => setDeleteId(null)}
      />
    </>
  );
}