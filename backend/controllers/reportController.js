const Leave = require('../models/Leave');
const User = require('../models/User');
const Attendance = require('../models/Attendance');

exports.getDashboardStats = async (req, res) => {
  try {
    const [totalUsers, totalLeaves, pendingLeaves, approvedLeaves, rejectedLeaves,
      students, faculty] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Leave.countDocuments(),
      Leave.countDocuments({ status: 'pending' }),
      Leave.countDocuments({ status: 'approved' }),
      Leave.countDocuments({ status: 'rejected' }),
      User.countDocuments({ role: 'student', isActive: true }),
      User.countDocuments({ role: 'faculty', isActive: true }),
    ]);

    const leavesByType = await Leave.aggregate([
      { $group: { _id: '$leaveType', count: { $sum: 1 } } }
    ]);

    const monthlyLeaves = await Leave.aggregate([
      {
        $group: {
          _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);

    res.json({
      success: true,
      stats: { totalUsers, totalLeaves, pendingLeaves, approvedLeaves, rejectedLeaves, students, faculty },
      leavesByType,
      monthlyLeaves
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getLeaveReport = async (req, res) => {
  try {
    const { fromDate, toDate, department, role } = req.query;
    const query = {};
    if (fromDate && toDate) {
      query.fromDate = { $gte: new Date(fromDate) };
      query.toDate = { $lte: new Date(toDate) };
    }
    if (department) query.department = department;

    const leaves = await Leave.find(query)
      .populate('applicant', 'name email role rollNo employeeId')
      .populate('department', 'name')
      .sort({ createdAt: -1 });

    const filtered = role ? leaves.filter(l => l.applicant?.role === role) : leaves;
    res.json({ success: true, leaves: filtered, total: filtered.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAttendanceReport = async (req, res) => {
  try {
    const { department, month, year } = req.query;
    const students = await User.find({ role: 'student', ...(department && { department }) });
    const query = { student: { $in: students.map(s => s._id) } };
    if (month && year) {
      query.date = { $gte: new Date(year, month - 1, 1), $lte: new Date(year, month, 0) };
    }
    const attendance = await Attendance.find(query).populate('student', 'name rollNo department');
    res.json({ success: true, attendance });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
