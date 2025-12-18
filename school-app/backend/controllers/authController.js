import bcrypt from 'bcrypt';
import pool from '../config/db.js';
import { generateToken } from '../utils/jwt.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

// Teacher Registration
export const registerTeacher = asyncHandler(async (req, res, next) => {
  const { username, password, full_name } = req.body;

  if (!username || !password || !full_name) {
    return next(new AppError('All fields are required', 400));
  }

  // Check if username already exists
  const existing = await pool.query(
    'SELECT * FROM teachers WHERE username = $1',
    [username]
  );

  if (existing.rows.length > 0) {
    return next(new AppError('Username already exists', 409));
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Insert teacher
  const result = await pool.query(
    'INSERT INTO teachers (username, password_hash, full_name) VALUES ($1, $2, $3) RETURNING teacher_id, username, full_name',
    [username, hashedPassword, full_name]
  );

  const teacher = result.rows[0];

  // Generate token
  const token = generateToken({
    userId: teacher.teacher_id,
    role: 'teacher',
    username: teacher.username,
  });

  res.status(201).json({
    status: 'success',
    message: 'Teacher registered successfully',
    data: {
      teacher,
      token,
    },
  });
});

// Teacher Login
export const loginTeacher = asyncHandler(async (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return next(new AppError('Username and password are required', 400));
  }

  // Find teacher
  const result = await pool.query(
    'SELECT * FROM teachers WHERE username = $1',
    [username]
  );

  if (result.rows.length === 0) {
    return next(new AppError('Invalid credentials', 401));
  }

  const teacher = result.rows[0];

  // Verify password
  const isValid = await bcrypt.compare(password, teacher.password_hash);

  if (!isValid) {
    return next(new AppError('Invalid credentials', 401));
  }

  // Generate token
  const token = generateToken({
    userId: teacher.teacher_id,
    role: 'teacher',
    username: teacher.username,
  });

  res.status(200).json({
    status: 'success',
    message: 'Login successful',
    data: {
      teacher: {
        teacher_id: teacher.teacher_id,
        username: teacher.username,
        full_name: teacher.full_name,
      },
      token,
    },
  });
});




export const getMe = asyncHandler(async (req, res, next) => {
  const { userId, role } = req.user; // From auth middleware

  if (role === 'teacher') {
    const result = await pool.query(
      'SELECT teacher_id, username, full_name FROM teachers WHERE teacher_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return next(new AppError('Teacher not found', 404));
    }

    return res.status(200).json({
      status: 'success',
      role: 'teacher',
      userName: result.rows[0].full_name,
      data: {
        user_id: result.rows[0].teacher_id,
        username: result.rows[0].username,
        full_name: result.rows[0].full_name,
        role: 'teacher',
      },
    });
  }

  if (role === 'student') {
    const result = await pool.query(
      `SELECT 
        s.student_id,
        s.username,
        s.full_name,
        s.roll_no,
        s.class_id,
        c.class_name,
        c.section_name
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.class_id
      WHERE s.student_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return next(new AppError('Student not found', 404));
    }

    const student = result.rows[0];

    return res.status(200).json({
      status: 'success',
      role: 'student',
      userName: student.full_name,
      data: {
        user_id: student.student_id,
        username: student.username,
        full_name: student.full_name,
        roll_no: student.roll_no,
        class_id: student.class_id,
        class_name: student.class_name,
        section_name: student.section_name,
        role: 'student',
      },
    });
  }

  return next(new AppError('Invalid user role', 400));
});

// Student Registration
export const registerStudent = asyncHandler(async (req, res, next) => {
  const { username, password, full_name, roll_no } = req.body;

  if (!username || !password || !full_name || !roll_no ) {
    return next(new AppError('All fields are required', 400));
  }

  // Check if username already exists
  const existing = await pool.query(
    'SELECT * FROM students WHERE username = $1',
    [username]
  );

  if (existing.rows.length > 0) {
    return next(new AppError('Username already exists', 409));
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Insert student
  const result = await pool.query(
    'INSERT INTO students (username, password_hash, full_name, roll_no) VALUES ($1, $2, $3, $4) RETURNING student_id, username, full_name, roll_no',
    [username, hashedPassword, full_name, roll_no]
  );

  const student = result.rows[0];

  // Generate token
  const token = generateToken({
    userId: student.student_id,
    role: 'student',
    username: student.username,
  });

  res.status(201).json({
    status: 'success',
    message: 'Student registered successfully',
    data: {
      student,
      token,
    },
  });
});

// Student Login
export const loginStudent = asyncHandler(async (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return next(new AppError('Username and password are required', 400));
  }

  // Find student
  const result = await pool.query(
    'SELECT * FROM students WHERE username = $1',
    [username]
  );

  if (result.rows.length === 0) {
    return next(new AppError('Invalid credentials', 401));
  }

  const student = result.rows[0];

  // Verify password
  const isValid = await bcrypt.compare(password, student.password_hash);

  if (!isValid) {
    return next(new AppError('Invalid credentials', 401));
  }

  // Generate token
  const token = generateToken({
    userId: student.student_id,
    role: 'student',
    username: student.username,
  });

  res.status(200).json({
    status: 'success',
    message: 'Login successful',
    data: {
      student: {
        student_id: student.student_id,
        username: student.username,
        full_name: student.full_name,
        roll_no: student.roll_no,
        class_id: student.class_id,
      },
      token,
    },
  });
});




// Add this to your classController.js file


