import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';

export default function MainLayout() {
  return (
    <div className="flex h-screen bg-blue-50">
      {/* Lắp component Sidebar vào */}
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Lắp component TopNavbar vào */}
        <TopNavbar />

        {/* Nơi hiển thị các component con (Dashboard, Patients...) */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}