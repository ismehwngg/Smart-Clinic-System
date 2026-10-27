import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Receipt, 
  Search, 
  Wallet, 
  CheckCircle2, 
  Clock, 
  FileText,
  User,
  Pill,
  X,
  Printer,
  CreditCard,
  Banknote
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

// Phí khám bệnh mặc định
const CONSULTATION_FEE = 200000;

export default function Invoices() {
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'paid'
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [appointments, setAppointments] = useState([]);
  const [invoices, setInvoices] = useState([]);

  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;

  // =========================================================================
  // STATE CHO MODAL THANH TOÁN & XEM CHI TIẾT
  // =========================================================================
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('pay'); // 'pay': Lập hóa đơn | 'view': Xem lại
  const [selectedApp, setSelectedApp] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null); // Dùng khi ở chế độ 'view'
  const [paymentMethod, setPaymentMethod] = useState('Tiền mặt');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Gọi 2 API cùng lúc
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [resApps, resInvs] = await Promise.all([
        api.get('/appointments'),
        api.get('/invoices')
      ]);
      setAppointments(resApps.data || []);
      setInvoices(resInvs.data || []);
    } catch (error) {
      console.error('Lỗi tải dữ liệu hóa đơn:', error);
      toast.error('Không thể tải dữ liệu viện phí!');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Lọc ca khám Chờ thu tiền
  const pendingInvoices = appointments.filter(app => {
    const isCompleted = app.status === 'Completed';
    const isNotPaid = !invoices.some(inv => String(inv.appointmentId) === String(app.id));
    const matchSearch = app.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        String(app.id).includes(searchTerm);
    return isCompleted && isNotPaid && matchSearch;
  });

  // Lọc Hóa đơn đã thu tiền
  const paidInvoices = invoices.filter(inv => {
    const matchSearch = inv.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        String(inv.id).toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch;
  });

  // Mở Modal Lập hóa đơn (Chế độ PAY)
  const handleOpenPaymentModal = (app) => {
    setSelectedApp(app);
    setSelectedInvoice(null);
    setModalMode('pay');
    setPaymentMethod('Tiền mặt');
    setIsModalOpen(true);
  };

  // Mở Modal Xem chi tiết (Chế độ VIEW)
  const handleViewInvoice = (inv) => {
    // Tìm lại ca khám gốc để lấy danh sách đơn thuốc
    const originalApp = appointments.find(a => String(a.id) === String(inv.appointmentId));
    setSelectedInvoice(inv);
    setSelectedApp(originalApp || { patientName: inv.patientName, doctorName: '---', prescription: [] });
    setModalMode('view');
    setIsModalOpen(true);
  };

  // Tính tiền thuốc
  const calculateMedicineFee = (prescription = []) => {
    return prescription.reduce((total, med) => total + (med.price * med.quantity), 0);
  };

  // Xác nhận thu tiền
  const handleConfirmPayment = async () => {
    if (!selectedApp) return;
    setIsSubmitting(true);
    
    const medicineFee = calculateMedicineFee(selectedApp.prescription);
    const totalAmount = CONSULTATION_FEE + medicineFee;

    try {
      const payload = {
        appointmentId: selectedApp.id,
        patientId: selectedApp.patientId,
        patientName: selectedApp.patientName,
        consultationFee: CONSULTATION_FEE,
        medicineFee: medicineFee,
        totalAmount: totalAmount,
        paymentMethod: paymentMethod,
        cashierName: currentUser?.fullName || currentUser?.username || 'Lễ tân'
      };

      await api.post('/invoices', payload);
      toast.success('Thanh toán và xuất hóa đơn thành công!');
      
      setIsModalOpen(false);
      setSelectedApp(null);
      setActiveTab('paid'); 
      fetchData(); 
      
    } catch (error) {
      console.error('Lỗi khi lập hóa đơn:', error);
      toast.error(error.response?.data?.message || 'Không thể lập hóa đơn lúc này!');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Đang tải dữ liệu viện phí...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-up">
      {/* HEADER */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight flex items-center gap-2">
            <Receipt className="w-7 h-7 text-teal-600" />
            Viện phí & Hóa đơn
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý thanh toán ca khám, xuất hóa đơn và đối soát doanh thu.
          </p>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('pending')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'pending'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-gray-50 text-gray-600 hover:bg-amber-50 hover:text-amber-700'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Chờ thu tiền</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'pending' ? 'bg-white/20' : 'bg-gray-200'}`}>
                {pendingInvoices.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('paid')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'paid'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-gray-50 text-gray-600 hover:bg-teal-50 hover:text-teal-700'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Lịch sử Hóa đơn</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'paid' ? 'bg-white/20' : 'bg-gray-200'}`}>
                {paidInvoices.length}
              </span>
            </button>
          </div>

          <div className="relative min-w-[280px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={activeTab === 'pending' ? "Tìm bệnh nhân chờ thanh toán..." : "Tìm mã hóa đơn, bệnh nhân..."}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
            />
          </div>
        </div>

        {/* TAB CHỜ THU TIỀN */}
        {activeTab === 'pending' && (
          <div>
            {pendingInvoices.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                Không có ca khám nào đang chờ thanh toán.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {pendingInvoices.map(app => (
                  <div key={app.id} className="p-5 rounded-2xl border border-amber-200 bg-amber-50/30 hover:shadow-md transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-lg">
                          Mã ca khám: #{app.id}
                        </span>
                        <span className="text-xs text-gray-500 font-semibold">{app.date}</span>
                      </div>
                      <h3 className="text-lg font-extrabold text-gray-900 mb-1">{app.patientName}</h3>
                      <p className="text-sm text-gray-600 flex items-center gap-1.5 mb-3">
                        <User className="w-4 h-4 text-gray-400" />
                        BS. {app.doctorName}
                      </p>
                      
                      <div className="pt-3 border-t border-amber-100 flex items-center gap-4 text-xs font-semibold text-gray-600">
                        <span className="flex items-center gap-1">
                          <Pill className="w-3.5 h-3.5 text-teal-500" />
                          {app.prescription?.length || 0} loại thuốc
                        </span>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleOpenPaymentModal(app)}
                      className="mt-4 w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Wallet className="w-4 h-4" />
                      Lập Hóa đơn Thu tiền
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB LỊCH SỬ HÓA ĐƠN */}
        {activeTab === 'paid' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 text-xs font-bold text-gray-500 uppercase border-b border-gray-200">
                  <th className="py-3 px-4">Mã HĐ</th>
                  <th className="py-3 px-4">Ngày giờ</th>
                  <th className="py-3 px-4">Bệnh nhân</th>
                  <th className="py-3 px-4 text-right">Tiền khám</th>
                  <th className="py-3 px-4 text-right">Tiền thuốc</th>
                  <th className="py-3 px-4 text-right text-teal-700">Tổng cộng</th>
                  <th className="py-3 px-4 text-center">Trạng thái</th>
                  <th className="py-3 px-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {paidInvoices.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-gray-400">Chưa có dữ liệu hóa đơn.</td>
                  </tr>
                ) : (
                  paidInvoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-bold text-gray-700">{inv.id}</td>
                      <td className="py-3 px-4 text-gray-500">{new Date(inv.createdAt).toLocaleString('vi-VN')}</td>
                      <td className="py-3 px-4 font-bold text-teal-900">{inv.patientName}</td>
                      <td className="py-3 px-4 text-right font-medium">{inv.consultationFee.toLocaleString()}đ</td>
                      <td className="py-3 px-4 text-right font-medium">{inv.medicineFee.toLocaleString()}đ</td>
                      <td className="py-3 px-4 text-right font-extrabold text-teal-600">{inv.totalAmount.toLocaleString()}đ</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Đã thu tiền
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button 
                          onClick={() => handleViewInvoice(inv)}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer" 
                          title="Xem chi tiết"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* MODAL DÙNG CHUNG: LẬP HÓA ĐƠN HOẶC XEM CHI TIẾT                   */}
      {/* ================================================================= */}
      {/* ================================================================= */}
      {/* MODAL DÙNG CHUNG: LẬP HÓA ĐƠN HOẶC XEM CHI TIẾT                   */}
      {/* ================================================================= */}
      {isModalOpen && selectedApp && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 animate-fade-up">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[95vh]">
            
            <div className={`px-6 py-4 border-b border-gray-100 flex items-center justify-between text-white ${modalMode === 'pay' ? 'bg-amber-500' : 'bg-teal-600'}`}>
              <h2 className="text-lg font-extrabold flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                {modalMode === 'pay' ? 'Phiếu Thanh Toán Viện Phí' : `Hóa đơn: ${selectedInvoice?.id}`}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto bg-gray-50/50">
              
              <div className="mb-6 space-y-1">
                <p className="text-sm text-gray-500">Bệnh nhân: <span className="font-bold text-gray-900">{selectedApp.patientName}</span></p>
                <p className="text-sm text-gray-500">Mã ca khám: <span className="font-bold text-gray-900">#{selectedApp.id || selectedInvoice?.appointmentId}</span></p>
                <p className="text-sm text-gray-500">Bác sĩ chỉ định: <span className="font-bold text-gray-900">{selectedApp.doctorName}</span></p>
                {modalMode === 'view' && selectedInvoice?.createdAt && (
                  <p className="text-sm text-gray-500">Ngày thu tiền: <span className="font-bold text-gray-900">{new Date(selectedInvoice.createdAt).toLocaleString('vi-VN')}</span></p>
                )}
              </div>

              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-500">
                    <tr>
                      <th className="py-2.5 px-4 font-bold">Nội dung</th>
                      <th className="py-2.5 px-4 text-right font-bold">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className="py-3 px-4 font-semibold text-gray-800">Phí khám bệnh lâm sàng</td>
                      <td className="py-3 px-4 text-right font-bold text-gray-900">
                        {modalMode === 'view' ? selectedInvoice?.consultationFee.toLocaleString() : CONSULTATION_FEE.toLocaleString()}đ
                      </td>
                    </tr>
                    {selectedApp.prescription?.map((med, idx) => (
                      <tr key={idx}>
                        <td className="py-3 px-4 text-gray-600">
                          {med.medicineName} <br/>
                          <span className="text-xs text-gray-400">SL: {med.quantity} x {(med.price || 0).toLocaleString()}đ</span>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-gray-900">
                          {((med.price || 0) * med.quantity).toLocaleString()}đ
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className={`flex items-center justify-between p-4 border rounded-xl mb-6 ${modalMode === 'pay' ? 'bg-amber-50 border-amber-100' : 'bg-teal-50 border-teal-100'}`}>
                <span className={`font-bold uppercase ${modalMode === 'pay' ? 'text-amber-900' : 'text-teal-900'}`}>
                  Tổng thanh toán:
                </span>
                <span className={`text-2xl font-black ${modalMode === 'pay' ? 'text-amber-700' : 'text-teal-700'}`}>
                  {modalMode === 'view' 
                    ? selectedInvoice?.totalAmount.toLocaleString() 
                    : (CONSULTATION_FEE + calculateMedicineFee(selectedApp.prescription)).toLocaleString()}đ
                </span>
              </div>

              {modalMode === 'pay' ? (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-3">Phương thức thanh toán</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setPaymentMethod('Tiền mặt')}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 font-bold text-sm transition-all cursor-pointer ${
                        paymentMethod === 'Tiền mặt' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <Banknote className="w-4 h-4" /> Tiền mặt
                    </button>
                    <button
                      onClick={() => setPaymentMethod('Chuyển khoản')}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 font-bold text-sm transition-all cursor-pointer ${
                        paymentMethod === 'Chuyển khoản' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" /> Chuyển khoản
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-bold text-sm">Đã thu tiền ({selectedInvoice?.paymentMethod})</span>
                  </div>
                  <div className="text-xs text-emerald-600 font-semibold text-right">
                    Thu ngân: {selectedInvoice?.cashierName}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-white">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold transition-colors cursor-pointer"
              >
                Đóng
              </button>
              
              {modalMode === 'pay' ? (
                <button 
                  onClick={handleConfirmPayment}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <Wallet className="w-4 h-4" />
                  <span>{isSubmitting ? 'Đang xử lý...' : 'Xác nhận Thu tiền'}</span>
                </button>
              ) : (
                <button 
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold shadow-sm transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>In Hóa Đơn</span>
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body // Gắn thẳng vào body
      )}
    </div>
  );
}