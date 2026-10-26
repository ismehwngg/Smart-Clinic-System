import { readData, writeData, generateAppointmentId } from '../utils/fileHelper.js';

// [GET] /api/appointments - Lấy danh sách lịch hẹn (kèm tìm kiếm)
export const getAppointments = async (req, res) => {
  try {
    const db = await readData();
    let appointments = db.appointments || [];
    const { search, status } = req.query;

    //Loc theo trang thai
    if (status && status !== 'All') {
      appointments = appointments.filter(app => app.status === status);
    }

    //Loc theo tu khoa tim kiem
    if (search) {
      const keyword = search.toLowerCase();
      appointments = appointments.filter(app =>
        app.patientName.toLowerCase().includes(keyword) ||
        app.doctorName.toLowerCase().includes(keyword) ||
        app.id.toLowerCase().includes(keyword) ||
        app.date.includes(keyword)
      );
    }

    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi tải danh sách lịch hẹn!' });
  }
};

// [GET] /api/appointments/:id - Lấy chi tiết 1 lịch hẹn
export const getAppointmentById = async (req, res) => {
  try {
    const db = await readData();
    const appointment = (db.appointments || []).find(a => String(a.id) === String(req.params.id));

    if (!appointment) {
      return res.status(404).json({ message: 'Không tìm thấy lịch hẹn!' });
    }
    res.status(200).json(appointment);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server!' });
  }
};

// [POST] /api/appointments - Tạo mới lịch hẹn
export const createAppointment = async (req, res) => {
  try {
    // Đã bổ sung hứng đủ các trường mới
    const { patientId, patientName, patientGender, doctorId, doctorName, date, time, status, reason, notes, prescription } = req.body;

    if (!patientId || !doctorId || !date || !time) {
      return res.status(400).json({ message: 'Vui lòng chọn đầy đủ Bệnh nhân, Bác sĩ, Ngày và Giờ khám!' });
    }

    const db = await readData();
    if (!db.appointments) db.appointments = [];

    // 1. Kiểm tra Bác sĩ trùng lịch
    const isDoctorConflict = db.appointments.some(
      app =>
        String(app.doctorId) === String(doctorId) &&
        app.date === date &&
        app.time === time &&
        app.status !== 'Cancelled'
    );

    if (isDoctorConflict) {
      return res.status(400).json({
        message: `Bác sĩ ${doctorName} đã có lịch hẹn vào lúc ${time} ngày ${date}. Vui lòng chọn khung giờ khác!`
      });
    }

    // 2. Kiểm tra Bệnh nhân trùng lịch
    const isPatientConflict = db.appointments.some(
      app =>
        String(app.patientId) === String(patientId) &&
        app.date === date &&
        app.time === time &&
        app.status !== 'Cancelled'
    );

    if (isPatientConflict) {
      return res.status(400).json({
        message: `Bệnh nhân ${patientName} đã có lịch khám khác vào đúng ${time} ngày ${date}. Vui lòng chọn giờ khác!`
      });
    }

    // Nhét ĐẦY ĐỦ dữ liệu vào object mới
    const newAppointment = {
      id: generateAppointmentId(db.appointments, date), // VD: LH_261017_001
      patientId,
      patientName,
      patientGender,
      doctorId,
      doctorName,
      date,
      time,
      status: status || 'Scheduled',
      reason: reason || '',
      notes: notes || ''
    };

    db.appointments.push(newAppointment);
    await writeData(db);

    res.status(201).json(newAppointment);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi tạo lịch hẹn mới!' });
  }
};

// [PUT] /api/appointments/:id - Cập nhật lịch hẹn
export const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    // Hứng thêm prescription và notes từ Frontend gửi xuống
    const {
      patientId, patientName, patientGender,
      doctorId, doctorName, date, time,
      status, reason, notes,
      prescription
    } = req.body;

    // 1. Đọc dữ liệu từ db.json
    const db = await readData();
    if (!db.appointments) db.appointments = [];

    const index = db.appointments.findIndex(app => String(app.id) === String(id));

    if (index === -1) {
      return res.status(404).json({ message: 'Không tìm thấy lịch hẹn!' });
    }

    // 2. LOGIC KIỂM TRA TRÙNG LỊCH (Đã ép kiểu String an toàn tuyệt đối)
    if (status !== 'Cancelled') {
      const checkDoctorId = doctorId || db.appointments[index].doctorId;
      const checkPatientId = patientId || db.appointments[index].patientId;
      const checkDate = date || db.appointments[index].date;
      const checkTime = time || db.appointments[index].time;

      // Check Bác sĩ
      const isDoctorConflict = db.appointments.some(
        app =>
          String(app.id) !== String(id) &&
          String(app.doctorId) === String(checkDoctorId) &&
          app.date === checkDate &&
          app.time === checkTime &&
          app.status !== 'Cancelled'
      );

      if (isDoctorConflict) {
        return res.status(400).json({
          message: `Bác sĩ đã có ca khám khác vào lúc ${checkTime} ngày ${checkDate}.`
        });
      }

      // Check Bệnh nhân
      const isPatientConflict = db.appointments.some(
        app =>
          String(app.id) !== String(id) &&
          String(app.patientId) === String(checkPatientId) &&
          app.date === checkDate &&
          app.time === checkTime &&
          app.status !== 'Cancelled'
      );

      if (isPatientConflict) {
        return res.status(400).json({
          message: `Bệnh nhân này đã có lịch khám khác vào lúc ${checkTime} ngày ${checkDate}.`
        });
      }
    }

    // 3. TIẾN HÀNH CẬP NHẬT DỮ LIỆU
    db.appointments[index] = {
      ...db.appointments[index],
      patientId: patientId || db.appointments[index].patientId,
      patientName: patientName || db.appointments[index].patientName,
      patientGender: patientGender || db.appointments[index].patientGender,
      doctorId: doctorId || db.appointments[index].doctorId,
      doctorName: doctorName || db.appointments[index].doctorName,
      date: date || db.appointments[index].date,
      time: time || db.appointments[index].time,
      status: status || db.appointments[index].status,
      reason: reason !== undefined ? reason : db.appointments[index].reason,
      notes: notes !== undefined ? notes : db.appointments[index].notes,
      prescription: prescription !== undefined ? prescription : (db.appointments[index].prescription || [])
    };

    // 4. Ghi dữ liệu mới xuống db.json
    await writeData(db);

    res.status(200).json(db.appointments[index]);
  } catch (error) {
    console.error('Lỗi khi cập nhật lịch hẹn:', error);
    res.status(500).json({ message: 'Lỗi khi cập nhật lịch hẹn!' });
  }
};

// [DELETE] /api/appointments/:id - Xóa lịch hẹn
export const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readData();
    const initialLength = (db.appointments || []).length;

    db.appointments = (db.appointments || []).filter(a => String(a.id) !== String(id));

    if (db.appointments.length === initialLength) {
      return res.status(404).json({ message: 'Không tìm thấy lịch hẹn để xóa!' });
    }

    await writeData(db);
    res.status(200).json({ message: 'Xóa lịch hẹn thành công!' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi xóa lịch hẹn!' });
  }
};