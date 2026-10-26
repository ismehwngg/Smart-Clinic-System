import { readData, writeData } from '../utils/fileHelper.js';

// [GET] /api/invoices - Lấy danh sách hóa đơn
export const getInvoices = async (req, res) => {
  try {
    const db = await readData();
    let invoices = db.invoices || [];
    
    // Sắp xếp hóa đơn mới nhất lên đầu
    invoices.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi tải danh sách hóa đơn!' });
  }
};

// [POST] /api/invoices - Tạo mới hóa đơn (Thanh toán)
export const createInvoice = async (req, res) => {
  try {
    const { appointmentId, patientId, patientName, consultationFee, medicineFee, totalAmount, paymentMethod, cashierName } = req.body;

    const db = await readData();
    if (!db.invoices) db.invoices = [];

    // Kiểm tra xem ca khám này đã được thanh toán chưa
    const isAlreadyPaid = db.invoices.some(inv => String(inv.appointmentId) === String(appointmentId));
    if (isAlreadyPaid) {
      return res.status(400).json({ message: 'Ca khám này đã được thanh toán!' });
    }

    // Tạo mã hóa đơn ngẫu nhiên (VD: INV_1701234567)
    const newId = `INV_${Date.now().toString().slice(-6)}`;

    const newInvoice = {
      id: newId,
      appointmentId,
      patientId,
      patientName,
      consultationFee: Number(consultationFee),
      medicineFee: Number(medicineFee),
      totalAmount: Number(totalAmount),
      status: 'Paid',
      paymentMethod,
      cashierName: cashierName || 'Unknown',
      createdAt: new Date().toISOString()
    };

    db.invoices.push(newInvoice);
    await writeData(db);

    res.status(201).json(newInvoice);
  } catch (error) {
    console.error('Lỗi khi tạo hóa đơn:', error);
    res.status(500).json({ message: 'Lỗi khi tạo hóa đơn thanh toán!' });
  }
};