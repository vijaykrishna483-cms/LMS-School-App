import pool from '../config/db.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

// Create a new class (Teacher only)
export const createClass = asyncHandler(async (req, res, next) => {
  const { class_name, section_name, class_teacher_id } = req.body;

  if (!class_name || !section_name) {
    return next(new AppError('Class name and section are required', 400));
  }

  const result = await pool.query(
    'INSERT INTO classes (class_name, section_name, class_teacher_id) VALUES ($1, $2, $3) RETURNING *',
    [class_name, section_name, class_teacher_id || null]
  );

  res.status(201).json({
    status: 'success',
    message: 'Class created successfully',
    data: result.rows[0],
  });
});

// Get all classes
export const getAllClasses = asyncHandler(async (req, res, next) => {
  const result = await pool.query(`
    SELECT 
      c.*,
      t.full_name as class_teacher_name,
      COUNT(DISTINCT s.student_id) as student_count
    FROM classes c
    LEFT JOIN teachers t ON c.class_teacher_id = t.teacher_id
    LEFT JOIN students s ON c.class_id = s.class_id
    GROUP BY c.class_id, t.full_name
    ORDER BY c.class_name, c.section_name
  `);

  res.status(200).json({
    status: 'success',
    results: result.rows.length,
    data: result.rows,
  });
});

// Get class by ID with students
export const getClassById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const classResult = await pool.query(
    `SELECT 
      c.*,
      t.full_name as class_teacher_name
    FROM classes c
    LEFT JOIN teachers t ON c.class_teacher_id = t.teacher_id
    WHERE c.class_id = $1`,
    [id]
  );

  if (classResult.rows.length === 0) {
    return next(new AppError('Class not found', 404));
  }

  // Get students in this class
  const studentsResult = await pool.query(
    'SELECT student_id, username, full_name, roll_no FROM students WHERE class_id = $1 ORDER BY roll_no',
    [id]
  );

  res.status(200).json({
    status: 'success',
    data: {
      class: classResult.rows[0],
      students: studentsResult.rows,
    },
  });
});



export const updateClass = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { class_name, section_name, class_teacher_id } = req.body;

  const result = await pool.query(
    'UPDATE classes SET class_name = COALESCE($1, class_name), section_name = COALESCE($2, section_name), class_teacher_id = COALESCE($3, class_teacher_id) WHERE class_id = $4 RETURNING *',
    [class_name, section_name, class_teacher_id, id]
  );

  if (result.rows.length === 0) {
    return next(new AppError('Class not found', 404));
  }

  res.status(200).json({
    status: 'success',
    message: 'Class updated successfully',
    data: result.rows[0],
  });
});

// Delete class
export const deleteClass = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const result = await pool.query(
    'DELETE FROM classes WHERE class_id = $1 RETURNING *',
    [id]
  );

  if (result.rows.length === 0) {
    return next(new AppError('Class not found', 404));
  }

  res.status(200).json({
    status: 'success',
    message: 'Class deleted successfully',
  });
});

// Get classes taught by a specific teacher
export const getTeacherClasses = asyncHandler(async (req, res, next) => {
  const teacherId = req.user.userId; // From JWT token

  // Get class where teacher is class teacher
  const classTeacherResult = await pool.query(
    'SELECT * FROM classes WHERE class_teacher_id = $1',
    [teacherId]
  );

  // Get classes where teacher teaches subjects
  const subjectsResult = await pool.query(
    `SELECT DISTINCT 
      c.class_id, c.class_name, c.section_name,
      s.subject_id, s.subject_name
    FROM subjects s
    JOIN classes c ON s.class_id = c.class_id
    WHERE s.teacher_id = $1
    ORDER BY c.class_name, c.section_name`,
    [teacherId]
  );

  res.status(200).json({
    status: 'success',
    data: {
      classTeacher: classTeacherResult.rows,
      subjectTeacher: subjectsResult.rows,
    },
  });
});





export const assignStudentsToClass = asyncHandler(async (req, res, next) => {
  const { class_id, student_ids } = req.body;

  if (!class_id || !student_ids || !Array.isArray(student_ids) || student_ids.length === 0) {
    return next(new AppError('Class ID and student IDs array are required', 400));
  }

  // Check if class exists
  const classCheck = await pool.query(
    'SELECT class_id FROM classes WHERE class_id = $1',
    [class_id]
  );

  if (classCheck.rows.length === 0) {
    return next(new AppError('Class not found', 404));
  }

  // Assign students to class
  const result = await pool.query(
    'UPDATE students SET class_id = $1 WHERE student_id = ANY($2::int[]) RETURNING *',
    [class_id, student_ids]
  );

  res.status(200).json({
    status: 'success',
    message: `${result.rows.length} student(s) assigned to class`,
    data: result.rows,
  });
});
