const Student = require('../models/Student');
const Payment = require('../models/Payment');
const Leave = require('../models/Leave');
const Complaint = require('../models/Complaint');
const AuditLog = require('../models/AuditLog');
const jwt = require('jsonwebtoken');

const studentLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    const student = await Student.findOne({ username });
    if (!student) return res.status(401).json({ success: false, message: 'Invalid username or password' });

    if (student.lockUntil && student.lockUntil > Date.now()) {
      return res.status(403).json({ success: false, message: 'Account locked. Try again later.' });
    }

    if (await student.matchPassword(password)) {
      student.loginAttempts = 0;
      student.lockUntil = undefined;
      await student.save();

      await AuditLog.create({
        action: 'STUDENT_LOGIN',
        performedBy: student._id,
        role: 'Student',
        ipAddress: req.ip
      });

      const token = jwt.sign({ id: student._id, role: 'student' }, process.env.JWT_SECRET, { expiresIn: '7d' });
      
      res.cookie('student_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.json({ success: true, token });
    } else {
      student.loginAttempts += 1;
      if (student.loginAttempts >= 5) {
        student.lockUntil = Date.now() + 15 * 60 * 1000; // 15 mins
      }
      await student.save();
      res.status(401).json({ success: false, message: 'Invalid username or password' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getStudentDashboard = async (req, res) => {
  try {
    const studentId = req.student._id;
    const student = await Student.findById(studentId).populate('room');
    
    const payments = await Payment.find({ student: studentId }).sort({ date: -1 });
    const leaves = await Leave.find({ student: studentId }).sort({ createdAt: -1 });
    const complaints = await Complaint.find({ student: studentId }).sort({ createdAt: -1 });

    const totalPaid = payments.filter(p => p.status === 'Success').reduce((acc, curr) => acc + curr.amount, 0);

    res.json({
      success: true,
      data: {
        profile: student,
        payments,
        leaves,
        complaints,
        stats: {
          totalPaid,
          rentAmount: student.room?.rent || 0,
          depositAmount: student.room?.deposit || 0,
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const applyLeave = async (req, res) => {
  try {
    const { leaveDate, returnDate, reason } = req.body;
    const leave = await Leave.create({
      student: req.student._id,
      leaveDate,
      returnDate,
      reason
    });

    await AuditLog.create({
      action: 'STUDENT_LEAVE_REQUEST',
      performedBy: req.student._id,
      role: 'Student',
      details: { leaveId: leave._id },
      ipAddress: req.ip
    });

    res.status(201).json({ success: true, data: leave });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const fileComplaint = async (req, res) => {
  try {
    const { category, description } = req.body;
    const complaint = await Complaint.create({
      student: req.student._id,
      category,
      description
    });

    await AuditLog.create({
      action: 'STUDENT_COMPLAINT',
      performedBy: req.student._id,
      role: 'Student',
      details: { complaintId: complaint._id, category },
      ipAddress: req.ip
    });

    res.status(201).json({ success: true, data: complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const studentLogout = (req, res) => {
  res.clearCookie('student_token');
  res.json({ success: true, message: 'Logged out successfully' });
};

module.exports = { studentLogin, studentLogout, getStudentDashboard, applyLeave, fileComplaint };
