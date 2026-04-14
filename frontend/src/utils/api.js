import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
  localStorage.removeItem('token');
  if (!window.location.pathname.includes('/register')) {
  window.location.href = '/login';
}
}
    return Promise.reject(err);
  }
);

// Auth
export const login = (data) => API.post('/auth/login', data);
export const register = (data) => API.post('/auth/register', data);
export const getMe = () => API.get('/auth/me');
export const updateProfile = (data) => API.put('/auth/profile', data);
export const changePassword = (data) => API.put('/auth/change-password', data);

// Leaves
//export const applyLeave = (data) => API.post('/leaves', data);
export const applyLeave = (data) => API.post('/leaves', data, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const getMyLeaves = () => API.get('/leaves/my');
export const getPendingLeaves = () => API.get('/leaves/pending');
export const getAllLeaves = (params) => API.get('/leaves', { params });
export const getLeaveById = (id) => API.get(`/leaves/${id}`);
export const updateLeaveStatus = (id, data) => API.put(`/leaves/${id}/status`, data);
export const cancelLeave = (id) => API.put(`/leaves/${id}/cancel`);
export const getLeaveStats = (userId) => API.get(`/leaves/stats${userId ? '/' + userId : ''}`);

// Users
export const getAllUsers = (params) => API.get('/users', { params });
export const getUserById = (id) => API.get(`/users/${id}`);
export const createUser = (data) => API.post('/users', data);
export const updateUser = (id, data) => API.put(`/users/${id}`, data);
export const toggleUserStatus = (id) => API.patch(`/users/${id}/toggle`);
export const resetLeaveBalance = () => API.put('/users/reset-balance');

// Attendance
export const markAttendance = (data) => API.post('/attendance/mark', data);
export const getMyAttendance = (params) => API.get('/attendance/my', { params });
export const getStudentAttendance = (id, params) => API.get(`/attendance/student/${id}`, { params });
export const getDeptAttendance = (params) => API.get('/attendance/department', { params });

// Departments
export const getDepartments = () => API.get('/departments');
export const createDepartment = (data) => API.post('/departments', data);
export const updateDepartment = (id, data) => API.put(`/departments/${id}`, data);
export const deleteDepartment = (id) => API.delete(`/departments/${id}`);

// Reports
export const getDashboardStats = () => API.get('/reports/dashboard');
export const getLeaveReport = (params) => API.get('/reports/leaves', { params });
export const getAttendanceReport = (params) => API.get('/reports/attendance', { params });

// Notifications
export const getNotifications = () => API.get('/notifications');
export const markAllRead = () => API.put('/notifications/read-all');

export default API;
