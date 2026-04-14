const Department = require('../models/Department');

exports.getDepartments = async (req, res) => {
  try {
    const depts = await Department.find().populate('hod', 'name email');
    res.json({ success: true, departments: depts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createDepartment = async (req, res) => {
  try {
    const dept = await Department.create(req.body);
    res.status(201).json({ success: true, department: dept });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateDepartment = async (req, res) => {
  try {
    const dept = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('hod', 'name email');
    if (!dept) return res.status(404).json({ success: false, message: 'Department not found' });
    res.json({ success: true, department: dept });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteDepartment = async (req, res) => {
  try {
    await Department.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Department deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
