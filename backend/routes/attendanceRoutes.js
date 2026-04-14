const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { markAttendance, getAttendanceByStudent, getDepartmentAttendance, getMyAttendance } = require('../controllers/attendanceController');

router.use(protect);
router.post('/mark', authorize('faculty', 'hod', 'admin'), markAttendance);
router.get('/my', getMyAttendance);
router.get('/department', authorize('faculty', 'hod', 'admin'), getDepartmentAttendance);
router.get('/student/:studentId', authorize('faculty', 'hod', 'principal', 'admin'), getAttendanceByStudent);

module.exports = router;
