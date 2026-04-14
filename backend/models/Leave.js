const mongoose = require('mongoose');

const approvalSchema = new mongoose.Schema({
  approver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  role: { type: String, enum: ['faculty', 'hod', 'principal', 'admin'] },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  comment: { type: String },
  actionDate: { type: Date }
});

const leaveSchema = new mongoose.Schema({
  applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  leaveType: {
    type: String,
    enum: ['casual', 'medical', 'od'],
    required: true
  },
  fromDate: { type: Date, required: true },
  toDate: { type: Date, required: true },
  numberOfDays: { type: Number, required: true },
  reason: { type: String, required: true },
  document: { type: String }, // URL to uploaded doc
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  },
  approvalChain: [approvalSchema],
  currentApprovalLevel: { type: Number, default: 0 },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  isHalfDay: { type: Boolean, default: false },
  halfDayType: { type: String, enum: ['morning', 'afternoon'] },
  emergencyContact: { type: String },
  substituteArranged: { type: Boolean, default: false },
  substituteName: { type: String }
}, { timestamps: true });

// Calculate number of days
leaveSchema.pre('save', function (next) {
  if (this.fromDate && this.toDate) {
    const diff = Math.ceil((this.toDate - this.fromDate) / (1000 * 60 * 60 * 24)) + 1;
    this.numberOfDays = this.isHalfDay ? 0.5 : diff;
  }
  next();
});

module.exports = mongoose.model('Leave', leaveSchema);
