const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../models/User');
const Department = require('../models/Department');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  // Departments - already exists 
const existingDepts = await Department.countDocuments();
if (existingDepts > 0) {
  console.log('Data already exists, skipping seed!');
  process.exit();
}

const depts = await Department.insertMany([
  { name: 'Computer Science', code: 'CSE' },
  { name: 'Electronics', code: 'ECE' },
  { name: 'Mechanical', code: 'MECH' },
  { name: 'Civil', code: 'CIVIL' },
]);
  const cse = depts[0]._id;

  // Admin
  await User.create({ name: 'Admin User', email: 'admin@college.edu', password: 'admin123', role: 'admin' });

  // Principal
  await User.create({ name: 'Dr. Principal', email: 'principal@college.edu', password: 'principal123', role: 'principal', employeeId: 'PRIN001' });

  // HOD
  const hod = await User.create({ name: 'Dr. HOD CSE', email: 'hod.cse@college.edu', password: 'hod123', role: 'hod', department: cse, employeeId: 'HOD001' });
  await Department.findByIdAndUpdate(cse, { hod: hod._id });

  // Faculty
  await User.create({ name: 'Prof. Faculty', email: 'faculty@college.edu', password: 'faculty123', role: 'faculty', department: cse, employeeId: 'FAC001' });

  // Students
  await User.create({ name: 'Student One', email: 'student1@college.edu', password: 'student123', role: 'student', department: cse, rollNo: 'CS001', semester: 4, year: 2 });
  await User.create({ name: 'Student Two', email: 'student2@college.edu', password: 'student123', role: 'student', department: cse, rollNo: 'CS002', semester: 4, year: 2 });

  console.log('Seed complete!');
  console.log('----------------------------');
  console.log('Admin:     admin@college.edu     / admin123');
  console.log('Principal: principal@college.edu / principal123');
  console.log('HOD:       hod.cse@college.edu   / hod123');
  console.log('Faculty:   faculty@college.edu   / faculty123');
  console.log('Student1:  student1@college.edu  / student123');
  console.log('----------------------------');
  process.exit();
};

seed().catch(err => { console.error(err); process.exit(1); });
