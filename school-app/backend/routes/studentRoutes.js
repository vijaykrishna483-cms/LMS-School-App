import express from 'express';
import {
  getAllStudents,
  getStudentsByClass,
  getStudentProfile,
  getStudentById,
  updateStudent,
  deleteStudent,
  getStudentDashboard,
  getFullStudents
} from '../controllers/studentController.js';
import { authenticateToken, isTeacher, isStudent } from '../middleware/auth.js';

const router = express.Router();

// ✅ STUDENT-SPECIFIC ROUTES FIRST
router.get('/profile', authenticateToken, isStudent, getStudentProfile);
router.get('/dashboard', authenticateToken, isStudent, getStudentDashboard);

// ✅ TEACHER-SPECIFIC ROUTES (class before root)
router.get('/class/:classId', authenticateToken, isTeacher, getStudentsByClass);

// ✅ ROOT ROUTE - Choose ONE based on your needs:
// Option A: If teachers need ALL students (including unassigned)
router.get('/', authenticateToken, isTeacher, getFullStudents);

// Option B: If teachers only need students WITH classes
// router.get('/', authenticateToken, isTeacher, getAllStudents);

// ✅ PARAMETERIZED ROUTES LAST
router.get('/:id', authenticateToken, isTeacher, getStudentById);
router.put('/:id', authenticateToken, isTeacher, updateStudent);
router.delete('/:id', authenticateToken, isTeacher, deleteStudent);

export default router;