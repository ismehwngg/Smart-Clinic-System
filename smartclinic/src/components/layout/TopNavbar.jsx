import { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { CalendarClock, Sparkles, Calendar, Clock, ChevronRight } from 'lucide-react';
import api from '../../services/api';

export default function TopNavbar() {
  const location = useLocation();
  const pathname = location.pathname;

  const [isOpen, setIsOpen] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const dropdownRef = useRef(null);

  const getPageTitle = () => {
    if (pathname.includes('/dashboard')) return 'Trung tâm Điều hành (Dashboard)';
    if (pathname.includes('/patients')) return 'Quản lý Hồ sơ Bệnh nhân';
    if (pathname.includes('/doctors')) return 'Quản lý Đội ngũ Bác sĩ';
    if (pathname.includes('/appointments')) return 'Quản lý Lịch hẹn Khám';
    if (pathname.includes('/users')) return 'Quản lý Tài khoản Nhân sự';
    if (pathname.includes('/dashboard')) return 'Trang chủ Điều hành (Workspace)';
    if (pathname.includes('/statistics')) return 'Báo cáo & Thống kê (Analytics)';
    return 'Hệ thống SmartClinic';
  };

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const getInitial = (name) => (name ? name.trim().split(' ').pop().charAt(0).toUpperCase() : 'U');

  useEffect(() => {
    const fetchRecentAppointments = async () => {
      try {
        const response = await api.get('/appointments');
        const sorted = response.data.sort((a, b) => new Date(b.date) - new Date(a.date));
        setAppointments(sorted.slice(0, 5));
      } catch (error) {
        console.error('Không thể tải lịch hẹn cho thông báo:', error);
      }
    };
    fetchRecentAppointments();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  return (
    <header className="h-16 bg-white border-b border-gray-100 px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold text-gray-800 tracking-tight">
          {getPageTitle()}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Nút và hộp Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className={`relative p-2 rounded-xl transition-colors border ${
              isOpen 
                ? 'bg-green-50 text-green-600 border-green-200' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50 border-transparent hover:border-gray-100'
            }`}
            title="Lịch hẹn mới nhất"
          >
            <CalendarClock className="w-5 h-5" />
            
            {appointments.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-green-600 rounded-full ring-2 ring-white animate-pulse"></span>
            )}
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 py-3 z-50">
              <div className="px-4 pb-3 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-800 text-sm">Lịch hẹn mới gần đây</h3>
                  <span className="px-2 py-0.5 bg-green-50 text-emerald-800 rounded-full text-[11px] font-semibold">
                    {appointments.length} mới
                  </span>
                </div>
                <Link 
                  to="/appointments" 
                  onClick={() => setIsOpen(false)}
                  className="text-xs text-green-700 hover:underline font-medium flex items-center gap-0.5"
                >
                  Xem tất cả <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                {appointments.length === 0 ? (
                  <div className="py-8 text-center text-gray-400 text-sm">
                    Chưa có lịch hẹn nào trong hệ thống.
                  </div>
                ) : (
                  appointments.map((app) => (
                    <div key={app.id} className="p-3 hover:bg-gray-50/80 transition-colors flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-green-50 text-green-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-800 truncate">
                          {app.patientName} <span className="font-normal text-gray-500">khám với</span> {app.doctorName}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-500">
                          <span className="flex items-center gap-1 font-medium text-gray-700">
                            <Clock className="w-3 h-3 text-green-600" /> {app.time} - {formatDate(app.date)}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            app.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-green-50 text-green-600'
                          }`}>
                            {app.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="px-4 pt-2 border-t border-gray-100 text-center">
                <Link
                  to="/appointments/create"
                  onClick={() => setIsOpen(false)}
                  className="text-xs font-semibold text-green-700 hover:text-green-700 block py-1"
                >
                  + Đặt lịch hẹn khám mới
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-gray-200"></div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-800 leading-tight">
              {user?.fullName || 'Người dùng'}
            </p>
            <p className="text-xs text-green-600 font-medium">
              {user?.role === 'Admin' ? 'Quản trị viên' : user?.role === 'Doctor' ? 'Bác sĩ chuyên khoa' : 'Lễ tân trực'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-green-100">
            {getInitial(user?.fullName)}
          </div>
        </div>
      </div>
    </header>
  );
}