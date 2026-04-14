const User = require('../models/User');

exports.getAllUsers = async (req, res) => {
  try {
    const { role, department, isActive } = req.query;
    const query = {};
    if (role) query.role = role;
    if (department) query.department = department;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const users = await User.find(query).populate('department', 'name code').sort({ name: 1 });
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('department', 'name code');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const data = { ...req.body };
    if (!data.department) delete data.department;
    if (!data.rollNo) delete data.rollNo;
    if (!data.employeeId) delete data.employeeId;
    if (!data.semester) delete data.semester;
    const user = await User.create(data);
    const populated = await User.findById(user._id).populate('department', 'name code');
    res.status(201).json({ success: true, user: populated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { password, ...rest } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, rest, { new: true }).populate('department', 'name code');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, user, message: `User ${user.isActive ? 'activated' : 'deactivated'}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.resetLeaveBalance = async (req, res) => {
  try {
    await User.updateMany({}, { leaveBalance: { casual: 12, medical: 6, earned: 15 } });
    res.json({ success: true, message: 'Leave balances reset for all users' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
