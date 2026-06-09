const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { uploadToCloudinary } = require('../utils/cloudinary');

router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const result = await uploadToCloudinary(req.file.buffer, 'marwar-pg');
    res.json({ success: true, url: result.secure_url });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
