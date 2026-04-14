const Attendance = require('../models/Attendance');
const User = require('../models/User');

exports.markAttendance = async (req, res) => {
  try {
    const { records, date } = req.body; // records: [{ student, status }]
    const results = [];
    for (const record of records) {
      const att = await Attendance.findOneAndUpdate(
        { student: record.student, date: new Date(date) },
        { status: record.status, markedBy: req.user._id, subject: record.subject },
        { upsert: true, new: true }
      );
      results.push(att);
    }
    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAttendanceByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { month, year } = req.query;
    const query = { student: studentId };
    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0);
      query.date = { $gte: start, $lte: end };
    }
    const records = await Attendance.find(query)
      .populate('markedBy', 'name')
      .sort({ date: 1 });

    const total = records.length;
    const present = records.filter(r => r.status === 'present').length;
    const onLeave = records.filter(r => r.status === 'on_leave').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const percentage = total > 0 ? ((present + onLeave) / total * 100).toFixed(2) : 0;

    res.json({ success: true, records, stats: { total, present, onLeave, absent, percentage } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getDepartmentAttendance = async (req, res) => {
  try {
    const { date } = req.query;
    const students = await User.find({ department: req.user.department._id, role: 'student' });
    const targetDate = new Date(date || Date.now());
    const records = await Attendance.find({
      student: { $in: students.map(s => s._id) },
      date: { $gte: new Date(targetDate.setHours(0,0,0,0)), $lte: new Date(targetDate.setHours(23,59,59,999)) }
    }).populate('student', 'name rollNo');
    res.json({ success: true, records, totalStudents: students.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMyAttendance = async (req, res) => {
  try {
    const { month, year } = req.query;
    const query = { student: req.user._id };
    if (month && year) {
      query.date = { $gte: new Date(year, month - 1, 1), $lte: new Date(year, month, 0) };
    }
    const records = await Attendance.find(query).sort({ date: 1 });
    const total = records.length;
    const present = records.filter(r => r.status === 'present').length;
    const onLeave = records.filter(r => r.status === 'on_leave').length;
    const percentage = total > 0 ? ((present + onLeave) / total * 100).toFixed(2) : 0;
    res.json({ success: true, records, stats: { total, present, onLeave, absent: total - present - onLeave, percentage } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
