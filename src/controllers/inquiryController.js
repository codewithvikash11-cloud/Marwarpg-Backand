const Inquiry = require('../models/Inquiry');
const AuditLog = require('../models/AuditLog');

const submitInquiry = async (req, res) => {
  try {
    const { fullName, mobileNumber, email, interestedRoomType, message, sourcePage } = req.body;
    const inquiry = await Inquiry.create({
      fullName,
      mobileNumber,
      email,
      interestedRoomType,
      message,
      sourcePage
    });
    res.status(201).json({ success: true, message: 'Inquiry submitted successfully', data: inquiry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllInquiries = async (req, res) => {
  try {
    const inquiries = await Inquiry.find().sort({ createdAt: -1 });
    res.json({ success: true, data: inquiries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateInquiryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const inquiry = await Inquiry.findById(id);
    if (!inquiry) return res.status(404).json({ success: false, message: 'Inquiry not found' });
    
    inquiry.status = status;
    await inquiry.save();

    await AuditLog.create({
      action: 'UPDATE_INQUIRY',
      performedBy: req.admin._id,
      role: 'Admin',
      details: { inquiryId: inquiry._id, newStatus: status },
      ipAddress: req.ip
    });

    res.json({ success: true, message: 'Inquiry status updated', data: inquiry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteInquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const inquiry = await Inquiry.findByIdAndDelete(id);
    if (!inquiry) return res.status(404).json({ success: false, message: 'Inquiry not found' });

    await AuditLog.create({
      action: 'DELETE_INQUIRY',
      performedBy: req.admin._id,
      role: 'Admin',
      details: { inquiryId: id },
      ipAddress: req.ip
    });

    res.json({ success: true, message: 'Inquiry deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { submitInquiry, getAllInquiries, updateInquiryStatus, deleteInquiry };
