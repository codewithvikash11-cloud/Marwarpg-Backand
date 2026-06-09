const express = require('express');
const router = express.Router();
const { 
  adminLogin, 
  getDashboardStats, 
  getPendingAdmissions, 
  approveStudent,
  getAllStudents,
  getAllRooms,
  getAllPayments,
  getAllComplaints,
  getAllLeaves,
  getAuditLogs,
  adminLogout
} = require('../controllers/adminController');
const { protectAdmin } = require('../middleware/authMiddleware');

router.post('/login', adminLogin);
router.post('/logout', adminLogout);

// Protected Routes
router.use(protectAdmin);
router.get('/dashboard/stats', getDashboardStats);
router.get('/admissions', getPendingAdmissions);
router.post('/admissions/:id/approve', approveStudent);

router.get('/students', getAllStudents);
router.get('/rooms', getAllRooms);
router.get('/payments', getAllPayments);
router.get('/complaints', getAllComplaints);
router.get('/leaves', getAllLeaves);
router.get('/audit-logs', getAuditLogs);

module.exports = router;
