const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({ from: process.env.EMAIL_FROM, to, subject, html });
    console.log(`Email sent to ${to}`);
  } catch (err) {
    console.error('Email send error:', err.message);
  }
};

exports.sendLeaveAppliedEmail = async (user, leave) => {
  await sendEmail({
    to: user.email,
    subject: 'Leave Application Submitted',
    html: `<h2>Leave Application Received</h2>
      <p>Dear ${user.name},</p>
      <p>Your <strong>${leave.leaveType}</strong> leave from <strong>${new Date(leave.fromDate).toDateString()}</strong> to <strong>${new Date(leave.toDate).toDateString()}</strong> has been submitted successfully.</p>
      <p>Status: <strong>Pending</strong></p>
      <p>Reason: ${leave.reason}</p>
      <br><p>College Leave Management System</p>`
  });
};

exports.sendLeaveStatusEmail = async (user, leave, status, comment) => {
  const color = status === 'approved' ? '#22c55e' : '#ef4444';
  await sendEmail({
    to: user.email,
    subject: `Leave Application ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    html: `<h2>Leave Application Update</h2>
      <p>Dear ${user.name},</p>
      <p>Your <strong>${leave.leaveType}</strong> leave has been <strong style="color:${color}">${status.toUpperCase()}</strong>.</p>
      <p>Dates: ${new Date(leave.fromDate).toDateString()} to ${new Date(leave.toDate).toDateString()}</p>
      ${comment ? `<p>Remarks: ${comment}</p>` : ''}
      <br><p>College Leave Management System</p>`
  });
};

exports.sendApprovalRequestEmail = async (approver, applicant, leave) => {
  await sendEmail({
    to: approver.email,
    subject: `Leave Approval Required - ${applicant.name}`,
    html: `<h2>Leave Approval Required</h2>
      <p>Dear ${approver.name},</p>
      <p><strong>${applicant.name}</strong> has applied for <strong>${leave.leaveType}</strong> leave.</p>
      <p>Dates: ${new Date(leave.fromDate).toDateString()} to ${new Date(leave.toDate).toDateString()} (${leave.numberOfDays} day(s))</p>
      <p>Reason: ${leave.reason}</p>
      <p>Please login to the system to approve or reject.</p>
      <br><p>College Leave Management System</p>`
  });
};
