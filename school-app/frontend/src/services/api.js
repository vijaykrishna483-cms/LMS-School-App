// src/services/api.js
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** CONFIG — change PC_IP / PORT if needed while on device */
const PORT = '8000';
const PC_IP = '10.89.108.237';
export const BASE_URL = Platform.OS === 'android'
  ? `https://lms-school-app.onrender.com/api/v1`
  : `https://lms-school-app.onrender.com/api/v1`;

// Debug toggle
const logBase = true;

/** -------------------------
 *  Storage helpers
 *  ------------------------*/
export const getAuthToken = async () => {
  try {
    return await AsyncStorage.getItem('userToken');
  } catch (err) {
    console.error('getAuthToken error', err);
    return null;
  }
};
// alias for convenience
export const getToken = getAuthToken;

/** -------------------------
 *  Core API caller (fetch wrapper)
 *  ------------------------*/
const safeJson = async (res) => {
  try {
    return await res.json();
  } catch (e) {
    if (logBase) console.warn('safeJson: response not json', e);
    return null;
  }
};

const apiCall = async (endpoint, options = {}) => {
  try {
    const token = await getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (token && !options.skipAuth) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${BASE_URL}${endpoint}`;
    if (logBase) console.log('[apiCall]', options.method || 'GET', url, headers, options.body);

    const res = await fetch(url, {
      ...options,
      headers,
    });

    const data = await safeJson(res);

    if (!res.ok) {
      const errMsg = (data && (data.message || data.error)) || res.statusText || 'API Error';
      const err = new Error(errMsg);
      err.status = res.status;
      err.body = data;
      throw err;
    }

    return data ?? null;
  } catch (err) {
    if (logBase) console.error('[apiCall error]', err);
    throw err;
  }
};

/** -------------------------
 *  apiClient (axios-like) — many existing screens expect api.get/post style
 *  returns { data }
 *  ------------------------*/
export const apiClient = {
  get: async (endpoint, options = {}) => {
    const data = await apiCall(endpoint, { method: 'GET', ...options });
    return { data };
  },
  post: async (endpoint, body, options = {}) => {
    const opts = { method: 'POST', body: JSON.stringify(body), ...options };
    const data = await apiCall(endpoint, opts);
    return { data };
  },
  put: async (endpoint, body, options = {}) => {
    const opts = { method: 'PUT', body: JSON.stringify(body), ...options };
    const data = await apiCall(endpoint, opts);
    return { data };
  },
  delete: async (endpoint, options = {}) => {
    const data = await apiCall(endpoint, { method: 'DELETE', ...options });
    return { data };
  },
};

/** ===========================
 *  AUTH API
 *  ==========================*/
export const authAPI = {
  registerTeacher: async (userData) => {
    return apiCall('/auth/teacher/register', {
      method: 'POST',
      body: JSON.stringify(userData),
      skipAuth: true,
    });
  },

  registerStudent: async (userData) => {
    return apiCall('/auth/student/register', {
      method: 'POST',
      body: JSON.stringify(userData),
      skipAuth: true,
    });
  },

  // Teacher Login — robust: handles { token, teacher } shape or { data: {...} }
  loginTeacher: async (credentials) => {
    const response = await apiCall('/auth/teacher/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
      skipAuth: true,
    });

    const body = response?.data ?? response ?? {};

    if (logBase) console.log('[loginTeacher response body]', body);

    if (body?.token) {
      await AsyncStorage.setItem('userToken', String(body.token));
      await AsyncStorage.setItem('userRole', 'teacher');

      const teacherId = body.teacher?.teacher_id ?? body.teacher?.id ?? body.user?.id ?? body.id;
      if (teacherId !== undefined && teacherId !== null) {
        await AsyncStorage.setItem('userId', String(teacherId));
      }

      const teacherName = body.teacher?.full_name ?? body.teacher?.name ?? body.user?.full_name ?? body.name;
      if (teacherName) await AsyncStorage.setItem('userName', String(teacherName));
    } else {
      if (logBase) console.warn('loginTeacher: no token in response', body);
    }

    return body;
  },

  // Student Login
  loginStudent: async (credentials) => {
    const response = await apiCall('/auth/student/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
      skipAuth: true,
    });

    const body = response?.data ?? response ?? {};

    if (logBase) console.log('[loginStudent response body]', body);

    if (body?.token) {
      await AsyncStorage.setItem('userToken', String(body.token));
      await AsyncStorage.setItem('userRole', 'student');

      const studentId = body.student?.id ?? body.user?.id ?? body.id;
      if (studentId !== undefined && studentId !== null) {
        await AsyncStorage.setItem('userId', String(studentId));
      }

      const studentName = body.student?.full_name ?? body.student?.name ?? body.user?.full_name ?? body.name;
      if (studentName) await AsyncStorage.setItem('userName', String(studentName));
    } else {
      if (logBase) console.warn('loginStudent: no token in response', body);
    }

    return body;
  },

  logout: async () => {
    await AsyncStorage.multiRemove(['userToken', 'userRole', 'userId', 'userName']);
  },


  getMe: async () => {
  return apiCall('/auth/me');
},




  getCurrentUser: async () => {
    const role = await AsyncStorage.getItem('userRole');
    const userId = await AsyncStorage.getItem('userId');
    const userName = await AsyncStorage.getItem('userName');
    const token = await AsyncStorage.getItem('userToken');
    return { role, userId, userName, token };
  }
};

/** ===========================
 *  TEACHER API
 *  ==========================*/
export const teacherAPI = {
  // Get today's classes for teacher (maps to your backend)
  getTeacherClasses: async () => {
    // returns raw body from apiCall
    return apiCall('/classes/teacher/my-classes');
  },

  getTodaySchedule: async () => {
    return apiCall('/teachers/today-schedule');
  },

  getAllTeachers: async () => {
    return apiCall('/teachers');
  },

  getTeacherById: async (teacherId) => {
    return apiCall(`/teachers/${teacherId}`);
  }
};

/** ===========================
 *  STUDENT / CLASS / OTHER APIs
 *  (keep the structure you already had)
 *  ==========================*/
export const classAPI = {
  createClass: async (classData) => apiCall('/classes', { method: 'POST', body: JSON.stringify(classData) }),
  getAllClasses: async () => apiCall('/classes'),
  getClassById: async (classId) => apiCall(`/classes/${classId}`),
  updateClass: async (classId, classData) => apiCall(`/classes/${classId}`, { method: 'PUT', body: JSON.stringify(classData) }),
  getClassStudents: async (classId) => apiCall(`/classes/${classId}/students`),
};

export const studentAPI = {
  getDashboard: async () => apiCall('/students/dashboard'),
  getAllStudents: async () => apiCall('/students'),
  getStudentById: async (studentId) => apiCall(`/students/${studentId}`),
  updateStudent: async (studentId, studentData) => apiCall(`/students/${studentId}`, { method: 'PUT', body: JSON.stringify(studentData) }),
  deleteStudent: async (studentId) => apiCall(`/students/${studentId}`, { method: 'DELETE' }),
};

export const subjectAPI = {
  createSubject: async (subjectData) => apiCall('/subjects', { method: 'POST', body: JSON.stringify(subjectData) }),
  getAllSubjects: async () => apiCall('/subjects'),
  getSubjectsByClass: async (classId) => apiCall(`/subjects/class/${classId}`),
  updateSubject: async (subjectId, subjectData) => apiCall(`/subjects/${subjectId}`, { method: 'PUT', body: JSON.stringify(subjectData) }),
};

export const timetableAPI = {
  createEntry: async (entryData) => apiCall('/timetable', { method: 'POST', body: JSON.stringify(entryData) }),
  getByClass: async (classId) => apiCall(`/timetable/class/${classId}`),
  getTodayTimetable: async (classId) => apiCall(`/timetable/today/${classId}`),
  updateEntry: async (entryId, entryData) => apiCall(`/timetable/${entryId}`, { method: 'PUT', body: JSON.stringify(entryData) }),
  deleteEntry: async (entryId) => apiCall(`/timetable/${entryId}`, { method: 'DELETE' }),
};

export const attendanceAPI = {
  markAttendance: async (attendanceData) => apiCall('/attendance/mark', { method: 'POST', body: JSON.stringify(attendanceData) }),
  getByClassAndDate: async (classId, date) => apiCall(`/attendance/class/${classId}?date=${date}`),
  getStudentAttendance: async (studentId, startDate, endDate) => apiCall(`/attendance/student/${studentId}?start_date=${startDate}&end_date=${endDate}`),
  getStatistics: async (classId, startDate, endDate) => apiCall(`/attendance/statistics/${classId}?start_date=${startDate}&end_date=${endDate}`)
};

export const examAPI = {
  createExam: async (examData) => apiCall('/exams', { method: 'POST', body: JSON.stringify(examData) }),
  getAllExams: async () => apiCall('/exams'),
  getByClass: async (classId) => apiCall(`/exams/class/${classId}`),
  getExamById: async (examId) => apiCall(`/exams/${examId}`),
  updateExam: async (examId, examData) => apiCall(`/exams/${examId}`, { method: 'PUT', body: JSON.stringify(examData) }),
  deleteExam: async (examId) => apiCall(`/exams/${examId}`, { method: 'DELETE' }),
};

export const marksAPI = {
  addMarks: async (marksData) => apiCall('/marks', { method: 'POST', body: JSON.stringify(marksData) }),
  getByExam: async (examId) => apiCall(`/marks/exam/${examId}`),
  getStudentMarks: async (studentId, examId) => apiCall(`/marks/student/${studentId}?exam_id=${examId}`),
  getAllStudentMarks: async (studentId) => apiCall(`/marks/student/${studentId}`),
  updateMarks: async (marksId, marksData) => apiCall(`/marks/${marksId}`, { method: 'PUT', body: JSON.stringify(marksData) }),
  getClassPerformance: async (examId) => apiCall(`/marks/performance/${examId}`)
};

export const notificationAPI = {
  createAnnouncement: async (announcementData) => apiCall('/notifications/announcement', { method: 'POST', body: JSON.stringify(announcementData) }),
  createLeaveRequest: async (leaveData) => apiCall('/notifications/leave-request', { method: 'POST', body: JSON.stringify(leaveData) }),
  getNotifications: async () => apiCall('/notifications'),
  getLeaveRequests: async (status) => apiCall(`/notifications/leave-requests${status ? `?status=${status}` : ''}`),
  updateLeaveStatus: async (notificationId, status) => apiCall(`/notifications/leave-request/${notificationId}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  markAsRead: async (notificationId) => apiCall(`/notifications/${notificationId}/read`, { method: 'PUT' }),
  deleteNotification: async (notificationId) => apiCall(`/notifications/${notificationId}`, { method: 'DELETE' }),
};

export const healthCheck = async () => {
  try {
    const res = await fetch(`${BASE_URL}/health`);
    return res.ok;
  } catch (err) {
    console.error('healthCheck error', err);
    return false;
  }
};

// default export for convenience (also include apiClient & helpers)
export default {
  apiClient,
  authAPI,
  teacherAPI,
  classAPI,
  studentAPI,
  subjectAPI,
  timetableAPI,
  attendanceAPI,
  examAPI,
  marksAPI,
  notificationAPI,
  healthCheck,
};
