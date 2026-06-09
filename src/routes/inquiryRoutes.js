const express = require('express');
const router = express.Router();
const { submitInquiry, getAllInquiries, updateInquiryStatus, deleteInquiry } = require('../controllers/inquiryController');
const { protectAdmin } = require('../middleware/authMiddleware');

router.post('/submit', submitInquiry);
router.get('/', protectAdmin, getAllInquiries);
router.put('/:id/status', protectAdmin, updateInquiryStatus);
router.delete('/:id', protectAdmin, deleteInquiry);

module.exports = router;
