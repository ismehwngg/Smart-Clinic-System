import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import MainLayout from '../components/layout/MainLayout';
import Dashboard from '../pages/Dashboard';

import Patients from '../pages/Patients';
import CreatePatient from '../pages/Patients/Create'; 
import EditPatient from '../pages/Patients/Edit';
import PatientDetail from '../pages/Patients/Detail';

import Doctors from '../pages/Doctors';
import CreateDoctor from '../pages/Doctors/Create';
import EditDoctor from '../pages/Doctors/Edit';

import Appointments from '../pages/Appointments';
import CreateAppointment from '../pages/Appointments/Create';
import EditAppointment from '../pages/Appointments/Edit'; 

import Users from '../pages/Users';
import UserForm from '../pages/Users/UserForm';

import Login from '../pages/Login';
import Statistics from '../pages/Statistics';

import Invoices from '../pages/Invoices';


// Component Trạm gác bảo vệ Route
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default function AppRoutes() {
  return (
    <>
      {/* Cấu hình Toast Notification hiển thị ở góc trên bên phải cho toàn hệ thống */}
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#1f2937',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            borderRadius: '10px',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: '500',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />

      <Routes>
        {/* Tự động điều hướng đường dẫn gốc vào Dashboard (nếu chưa đăng nhập sẽ bị ProtectedRoute đẩy về /login) */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* Trang Đăng nhập nằm độc lập bên ngoài */}
        <Route path="/login" element={<Login />} />

        {/* Toàn bộ các trang quản lý bên trong đều được bọc bởi ProtectedRoute */}
        <Route 
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/statistics" element={<Statistics />} />        
          
          {/* Bệnh nhân route */}
          <Route path="/patients" element={<Patients />} />
          <Route path="/patients/create" element={<CreatePatient />} />
          <Route path="/patients/edit/:id" element={<EditPatient />} />
          <Route path="/patients/:id" element={<PatientDetail />} />
          
          {/* Bác sĩ route */}
          <Route path="/doctors" element={<Doctors />} />
          <Route path="/doctors/create" element={<CreateDoctor />} />
          <Route path="/doctors/edit/:id" element={<EditDoctor />} />

          {/* Lịch hẹn route */}
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/appointments/create" element={<CreateAppointment />} />
          <Route path="/appointments/edit/:id" element={<EditAppointment />} />

          {/* Hóa đơn & Viện phí */}
          <Route path="/invoices" element={<Invoices />} />

          {/* Quản lý tài khoản nhân sự (Chỉ Admin) */}
          <Route path="/users" element={<Users />} />
          <Route path="/users/create" element={<UserForm />} />
          <Route path="/users/edit/:id" element={<UserForm />} />
        </Route>
      </Routes>
    </>
  );
}