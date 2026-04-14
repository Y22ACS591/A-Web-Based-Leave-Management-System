const Leave = require('../models/Leave');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const { sendLeaveAppliedEmail, sendLeaveStatusEmail, sendApprovalRequestEmail } = require('../utils/emailService');
const Notification = require('../models/Notification');

// Helper: get next approver role based on applicant role
const getApprovalChain = (applicantRole) => {
  if (applicantRole === 'student') return ['faculty', 'hod', 'principal'];
  if (applicantRole === 'faculty') return ['hod', 'principal'];
  if (applicantRole === 'hod') return ['principal'];
  return [];
};

exports.applyLeave = async (req, res) => {
  try {
    const { leaveType, fromDate, toDate, reason, isHalfDay, halfDayType, emergencyContact, substituteName } = req.body;
    const applicant = req.user;

    // Check leave balance
    if (['casual', 'medical', 'od'].includes(leaveType)) {
      const diff = Math.ceil((new Date(toDate) - new Date(fromDate)) / (1000 * 60 * 60 * 24)) + 1;
      const days = isHalfDay ? 0.5 : diff;
      if (applicant.leaveBalance[leaveType] < days) {
        return res.status(400).json({ success: false, message: `Insufficient ${leaveType} leave balance` });
      }
    }

    const chain = getApprovalChain(applicant.role);
    const approvalChain = chain.map(role => ({ role, status: 'pending' }));
    const diff = Math.ceil((new Date(toDate) - new Date(fromDate)) / (1000 * 60 * 60 * 24)) + 1;
    const days = isHalfDay ? 0.5 : diff;

    const leave = await Leave.create({
      applicant: applicant._id,
      leaveType, fromDate, toDate, reason, isHalfDay, halfDayType,numberOfDays: days,
      emergencyContact, substituteName,
      department: applicant.department,
      approvalChain,
      document: req.file ? `/uploads/${req.file.filename}` : null, 
      status: chain.length === 0 ? 'approved' : 'pending'
    });

    // Notify applicant
    await sendLeaveAppliedEmail(applicant, leave);

    // Notify first approver
if (chain.length > 0) {
  const firstApprover = await User.findOne({ role: chain[0], department: applicant.department, isActive: true });
  if (firstApprover) {
    await Notification.create({
      recipient: firstApprover._id,
      message: `${applicant.name} applied for ${leaveType} leave from ${new Date(fromDate).toDateString()} to ${new Date(toDate).toDateString()}`,
      type: 'leave_applied',
      leaveId: leave._id
    });
  }
}


    res.status(201).json({ success: true, leave });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMyLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({ applicant: req.user._id })
      .populate('applicant', 'name email role')
      .populate('department', 'name')
      .populate('approvalChain.approver', 'name role')
      .sort({ createdAt: -1 });
    res.json({ success: true, leaves });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getPendingLeaves = async (req, res) => {
  try {
    const user = req.user;
    let query = { status: 'pending' };

    if (user.role === 'faculty') {
      query['approvalChain'] = { $elemMatch: { role: 'faculty', status: 'pending' } };
      query.currentApprovalLevel = 0;
      query.department = user.department._id;
    } else if (user.role === 'hod') {
      query.department = user.department._id;
    } else if (user.role === 'principal') {
      // Principal sees all pending at principal level
    }

    const leaves = await Leave.find(query)
      .populate('applicant', 'name email role rollNo employeeId')
      .populate('department', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, leaves });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAllLeaves = async (req, res) => {
  try {
    const { status, department, leaveType, fromDate, toDate } = req.query;
    const query = {};
    if (status) query.status = status;
    if (department) query.department = department;
    if (leaveType) query.leaveType = leaveType;
    if (fromDate && toDate) {
      query.fromDate = { $gte: new Date(fromDate) };
      query.toDate = { $lte: new Date(toDate) };
    }

    const leaves = await Leave.find(query)
      .populate('applicant', 'name email role rollNo employeeId')
      .populate('department', 'name')
      .populate('approvalChain.approver', 'name role')
      .sort({ createdAt: -1 });
    res.json({ success: true, leaves });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getLeaveById = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id)
      .populate('applicant', 'name email role rollNo employeeId phone department')
      .populate('department', 'name code')
      .populate('approvalChain.approver', 'name role');
    if (!leave) return res.status(404).json({ success: false, message: 'Leave not found' });
    res.json({ success: true, leave });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateLeaveStatus = async (req, res) => {
  try {
    const { status, comment } = req.body;
    const leave = await Leave.findById(req.params.id).populate('applicant');

    if (!leave) return res.status(404).json({ success: false, message: 'Leave not found' });
    if (leave.status !== 'pending') return res.status(400).json({ success: false, message: 'Leave already processed' });

    const approverRole = req.user.role;
    const chainEntry = leave.approvalChain.find(a => a.role === approverRole && a.status === 'pending');
    if (!chainEntry) return res.status(403).json({ success: false, message: 'Not authorized to approve this leave' });

    chainEntry.approver = req.user._id;
    chainEntry.status = status;
    chainEntry.comment = comment;
    chainEntry.actionDate = new Date();

    if (status === 'rejected') {
      leave.status = 'rejected';
    } else {
      const pendingChain = leave.approvalChain.filter(a => a.status === 'pending');
      if (pendingChain.length === 0) {
        leave.status = 'approved';
        // Deduct leave balance
        const applicant = await User.findById(leave.applicant._id);
        if (['casual', 'medical', 'earned'].includes(leave.leaveType)) {
          applicant.leaveBalance[leave.leaveType] = Math.max(0, applicant.leaveBalance[leave.leaveType] - leave.numberOfDays);
          await applicant.save();
        }
        // Mark attendance as on_leave
        const start = new Date(leave.fromDate);
        const end = new Date(leave.toDate);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          await Attendance.findOneAndUpdate(
            { student: leave.applicant._id, date: new Date(d) },
            { status: 'on_leave', leaveRef: leave._id },
            { upsert: true, new: true }
          );
        }
      } else {
        leave.currentApprovalLevel += 1;
        // Notify next approver
        const nextRole = pendingChain[0].role;
        const nextApprover = await User.findOne({ role: nextRole, department: leave.department, isActive: true });
        if (nextApprover) await sendApprovalRequestEmail(nextApprover, leave.applicant, leave);
      }
    }

    await leave.save();
    // Notify applicant
await Notification.create({
  recipient: leave.applicant._id,
  message: `Your ${leave.leaveType} leave has been ${status} by ${req.user.name}`,
  type: status === 'approved' ? 'leave_approved' : 'leave_rejected',
  leaveId: leave._id
});

// Notify next approver if pending
if (status === 'approved' && leave.approvalChain.some(a => a.status === 'pending')) {
  const nextRole = leave.approvalChain.find(a => a.status === 'pending').role;
  const nextApprover = await User.findOne({ role: nextRole, department: leave.department, isActive: true });
  if (nextApprover) {
    await Notification.create({
      recipient: nextApprover._id,
      message: `Leave request from ${leave.applicant.name} is waiting for your approval`,
      type: 'leave_applied',
      leaveId: leave._id
    });
  }
}
    
    await sendLeaveStatusEmail(leave.applicant, leave, leave.status, comment);
    res.json({ success: true, leave });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.cancelLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ success: false, message: 'Leave not found' });
    if (leave.applicant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (leave.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Can only cancel pending leaves' });
    }
    leave.status = 'cancelled';
    await leave.save();
    res.json({ success: true, message: 'Leave cancelled', leave });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getLeaveStats = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;
    const user = await User.findById(userId);
    const stats = {
      leaveBalance: user.leaveBalance,
      totalApplied: await Leave.countDocuments({ applicant: userId }),
      pending: await Leave.countDocuments({ applicant: userId, status: 'pending' }),
      approved: await Leave.countDocuments({ applicant: userId, status: 'approved' }),
      rejected: await Leave.countDocuments({ applicant: userId, status: 'rejected' }),
    };
    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
