const Admin = require('../models/Admin');
const Student = require('../models/Student');
const Room = require('../models/Room');
const Payment = require('../models/Payment');
const Complaint = require('../models/Complaint');
const Leave = require('../models/Leave');
const AuditLog = require('../models/AuditLog');
const jwt = require('jsonwebtoken');

// 1. Auth
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    if (admin.lockUntil && admin.lockUntil > Date.now()) {
      return res.status(403).json({ success: false, message: 'Account locked. Try again later.' });
    }

    if (await admin.matchPassword(password)) {
      admin.loginAttempts = 0;
      admin.lockUntil = undefined;
      await admin.save();

      await AuditLog.create({
        action: 'ADMIN_LOGIN',
        performedBy: admin._id,
        role: 'Admin',
        ipAddress: req.ip
      });

      const token = jwt.sign({ id: admin._id, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1d' });
      
      res.cookie('admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 1 day
      });

      return res.json({ 
        success: true, 
        token, // Optionally keep token in JSON for frontend Axios if needed, but cookie is primary
        forcePasswordChange: admin.forcePasswordChange 
      });
    } else {
      admin.loginAttempts += 1;
      if (admin.loginAttempts >= 5) {
        admin.lockUntil = Date.now() + 15 * 60 * 1000; // 15 mins
      }
      await admin.save();
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Dashboard Stats
const getDashboardStats = async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const activeStudents = await Student.countDocuments({ status: 'Active' });
    
    const rooms = await Room.find();
    const vacantBeds = rooms.reduce((acc, room) => acc + (room.capacity - room.occupiedBeds), 0);
    
    const payments = await Payment.find({ month: new Date().toLocaleString('default', { month: 'long' }), year: new Date().getFullYear() });
    const monthlyCollection = payments.filter(p => p.status === 'Success').reduce((acc, curr) => acc + curr.amount, 0);

    const pendingRent = await Student.countDocuments({ status: 'Active' }) * 5000 - monthlyCollection; // Rough mock logic

    const activeComplaints = await Complaint.countDocuments({ status: 'Open' });
    const pendingLeaves = await Leave.countDocuments({ status: 'Pending' });

    res.json({
      success: true,
      data: {
        totalStudents,
        activeStudents,
        vacantBeds,
        monthlyCollection,
        pendingRent: pendingRent > 0 ? pendingRent : 0,
        activeComplaints,
        pendingLeaves
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Manage Admissions
const getPendingAdmissions = async (req, res) => {
  try {
    const students = await Student.find({ status: 'Pending Verification' }).sort({ createdAt: -1 });
    res.json({ success: true, data: students });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const approveStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { roomId, bedNumber, rent, deposit } = req.body;

    const student = await Student.findById(id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

    room.occupiedBeds += 1;
    if (room.occupiedBeds >= room.capacity) room.status = 'Full';
    await room.save();

    const count = await Student.countDocuments({ status: 'Active' });
    const sequence = (count + 1).toString().padStart(4, '0');
    const studentId = `RM2026${sequence}`;
    const username = `RM${sequence}`;
    const rawPassword = `RM@1234${Math.floor(10 + Math.random() * 90)}`;

    student.status = 'Active';
    student.room = room._id;
    student.bedNumber = bedNumber;
    student.joinedAt = new Date();
    student.studentId = studentId;
    student.username = username;
    student.password = rawPassword; 

    await student.save();

    await student.save();

    if (deposit) {
      await Payment.create({
        student: student._id,
        amount: deposit,
        month: new Date().toLocaleString('default', { month: 'long' }),
        year: new Date().getFullYear(),
        date: new Date(),
        paymentMode: 'Cash',
        type: 'Deposit'
      });
    }

    await AuditLog.create({
      action: 'ADMISSION_APPROVAL',
      performedBy: req.admin._id,
      role: 'Admin',
      details: { studentId: student._id, roomAllocated: room.roomNumber },
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Student approved successfully',
      credentials: { username, password: rawPassword } // Sending raw only once on approval
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Get Data Lists
const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find({ status: { $ne: 'Pending Verification' } }).populate('room').sort({ createdAt: -1 });
    res.json({ success: true, data: students });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find().sort({ roomNumber: 1 });
    res.json({ success: true, data: rooms });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find().populate('student').sort({ date: -1 });
    res.json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find().populate('student').sort({ createdAt: -1 });
    res.json({ success: true, data: complaints });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find().populate('student').sort({ createdAt: -1 });
    res.json({ success: true, data: leaves });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find().populate('performedBy', 'email name').sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const adminLogout = (req, res) => {
  res.clearCookie('admin_token');
  res.json({ success: true, message: 'Logged out successfully' });
};

module.exports = { 
  adminLogin, 
  adminLogout,
  getDashboardStats, 
  getPendingAdmissions, 
  approveStudent,
  getAllStudents,
  getAllRooms,
  getAllPayments,
  getAllComplaints,
  getAllLeaves,
  getAuditLogs
};
