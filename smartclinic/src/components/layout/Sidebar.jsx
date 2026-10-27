import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  LayoutDashboard, 
  Users, 
  Stethoscope, 
  CalendarDays, 
  UserCog, 
  LogOut, 
  Activity,
  Banknote,
  BarChart3 
} from 'lucide-react';
import ConfirmModal from '../common/ConfirmModal';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const getMenuClass = (path) => {
    const isActive = location.pathname.includes(path);
    return `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all ${
      isActive 
        ? 'bg-gradient-to-r from-teal-600 to-emerald-500 text-white font-semibold shadow-md shadow-green-500/25' 
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium'
    }`;
  };

  const handleConfirmLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Đã đăng xuất khỏi hệ thống!');
    navigate('/login');
  };

  return (
    <>
      <aside className="w-64 bg-white shadow-md flex flex-col justify-between border-r border-gray-100">
        <div>
          {/* Logo Header */}
          <div className="h-16 px-6 border-b border-gray-100 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center shadow-sm">
              <Activity className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">
              Smart<span className="text-green-600">Clinic</span>
            </h1>
          </div>

          {/* Menu điều hướng */}
          <nav className="p-4 space-y-1.5">
            <Link to="/dashboard" className={getMenuClass('/dashboard')}>
              <LayoutDashboard className="w-4 h-4" />
              <span>Trang chủ điều hành</span>
            </Link>
            <Link to="/statistics" className={getMenuClass('/statistics')}>
              <BarChart3 className="w-5 h-5" />
              <span>Báo cáo & Thống kê</span>
            </Link>
            <Link to="/patients" className={getMenuClass('/patients')}>
              <Users className="w-4 h-4" />
              <span>Bệnh nhân</span>
            </Link>
            <Link to="/doctors" className={getMenuClass('/doctors')}>
              <Stethoscope className="w-4 h-4" />
              <span>Bác sĩ</span>
            </Link>
            <Link to="/appointments" className={getMenuClass('/appointments')}>
              <CalendarDays className="w-4 h-4" />
              <span>Lịch hẹn</span>
            </Link>
            <Link to="/invoices" className={getMenuClass('/invoices')}>
              <Banknote className="w-4 h-4" />
              <span>Hóa đơn</span>
            </Link>

            {/* PHÂN QUYỀN: Chỉ Admin mới thấy mục Quản lý Tài khoản */}
            {user?.role === 'Admin' && (
              <div className="pt-3 mt-3 border-t border-gray-100">
                <p className="px-4 text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Quản trị hệ thống
                </p>
                <Link to="/users" className={getMenuClass('/users')}>
                  <UserCog className="w-4 h-4" />
                  <span>Tài khoản nhân sự</span>
                </Link>
              </div>
            )}
          </nav>
        </div>

        {/* Footer Sidebar: Thông tin người dùng & Nút Đăng xuất */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/70">
          {user && (
            <div className="mb-3 px-2">
              <p className="text-sm font-semibold text-gray-800 truncate">{user.fullName}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Vai trò: <span className="font-semibold text-green-700">{user.role}</span>
              </p>
            </div>
          )}
          <button
            onClick={() => setIsLogoutModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      <ConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
        title="Đăng xuất hệ thống"
        message="Bạn có chắc chắn muốn kết thúc phiên làm việc hiện tại không?"
        confirmText="Đăng xuất"
        variant="danger"
      />
    </>
  );
}