import express from 'express';
import { getPatients, getPatientById, createPatient, updatePatient, deletePatient } from '../controllers/patientController.js';
import { requireAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Định nghĩa các phương thức cho đường dẫn gốc của patient
router.get('/', getPatients);
router.get('/:id', getPatientById);
router.post('/', createPatient);
router.put('/:id', updatePatient); 
router.delete('/:id', requireAdmin, deletePatient);

export default router;