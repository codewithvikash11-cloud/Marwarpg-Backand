const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { applyForAdmission } = require('../controllers/admissionController');

router.post(
  '/apply',
  upload.fields([
    { name: 'aadhaarFront', maxCount: 1 },
    { name: 'aadhaarBack', maxCount: 1 },
    { name: 'photo', maxCount: 1 },
    { name: 'signature', maxCount: 1 },
    { name: 'collegeId', maxCount: 1 },
    { name: 'panCard', maxCount: 1 }
  ]),
  applyForAdmission
);

module.exports = router;
