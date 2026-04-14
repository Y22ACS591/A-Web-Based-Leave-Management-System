const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getDashboardStats, getLeaveReport, getAttendanceReport } = require('../controllers/reportController');

router.use(protect);
router.get('/dashboard', getDashboardStats);
router.get('/leaves', authorize('admin', 'principal', 'hod'), getLeaveReport);
router.get('/attendance', authorize('admin', 'principal', 'hod', 'faculty'), getAttendanceReport);

module.exports = router;
