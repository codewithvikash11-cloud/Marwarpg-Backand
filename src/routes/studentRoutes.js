const express = require('express');
const router = express.Router();
const { studentLogin, studentLogout, getStudentDashboard, applyLeave, fileComplaint } = require('../controllers/studentController');
const { protectStudent } = require('../middleware/authMiddleware');

router.post('/login', studentLogin);
router.post('/logout', studentLogout);

// Protected Routes
router.use(protectStudent);
router.get('/dashboard', getStudentDashboard);
router.post('/leaves', applyLeave);
router.post('/complaints', fileComplaint);

module.exports = router;
