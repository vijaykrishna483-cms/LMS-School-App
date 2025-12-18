import express from 'express';
import {
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  deleteClass,
  getTeacherClasses,
  assignStudentsToClass,
} from '../controllers/classController.js';
import { authenticateToken, isTeacher } from '../middleware/auth.js';

const router = express.Router();

// ✅ SPECIFIC ROUTES FIRST (before /:id)
router.post('/', authenticateToken, isTeacher, createClass);
router.get('/my-classes', authenticateToken, isTeacher, getTeacherClasses);
router.put('/assign-class', authenticateToken, isTeacher, assignStudentsToClass);

// ✅ GENERAL ROUTES
router.get('/', authenticateToken, getAllClasses);

// ✅ PARAMETERIZED ROUTES LAST
router.get('/:id', authenticateToken, getClassById);
router.put('/:id', authenticateToken, isTeacher, updateClass);
router.delete('/:id', authenticateToken, isTeacher, deleteClass);

export default router;