import express from 'express';
import cors from 'cors';
import patientRoutes from './routes/patientRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import authRoutes from './routes/authRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';

import { verifyToken } from './middlewares/authMiddleware.js';

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
// Khai báo đường dẫn API cho Bệnh nhân
app.use('/api/patients',verifyToken ,patientRoutes); //Khai bao duong dan API cho Benh nhan
app.use('/api/doctors',verifyToken, doctorRoutes); // Khai bao duong dan API cho Bac si
app.use('/api/appointments',verifyToken, appointmentRoutes); // Khai bao duong dan API cho Lich hen
app.use('/api/stats',verifyToken, statsRoutes); //Khai bao duong dan API cho Dashboard
app.use('/api/invoices',verifyToken, invoiceRoutes); //Khai bao duong dan API cho Hoa don

app.get('/api/health', (req, res) => {
  res.json({ status: 'success', message: 'SmartClinic Backend đang chạy mượt mà!' });
});

app.listen(PORT, () => {
  console.log(`Server Backend đang chạy tại http://localhost:${PORT}`);
});