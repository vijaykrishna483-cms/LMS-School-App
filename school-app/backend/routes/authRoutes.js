import express from 'express';
import {
  registerTeacher,
  loginTeacher,
  registerStudent,
  loginStudent,
  getMe,
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Teacher routes
router.post('/teacher/register', registerTeacher);
router.post('/teacher/login', loginTeacher);

// Student routes
router.post('/student/register', registerStudent);
router.post('/student/login', loginStudent);


// Get current user (protected route)
router.get('/me', authenticateToken, getMe);

export default router;