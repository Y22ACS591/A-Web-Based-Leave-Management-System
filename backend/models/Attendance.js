const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ['present', 'absent', 'on_leave', 'holiday'], default: 'absent' },
  subject: { type: String },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  leaveRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Leave' },
  remarks: { type: String }
}, { timestamps: true });

attendanceSchema.index({ student: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
