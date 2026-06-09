const Student = require('../models/Student');
const { uploadToCloudinary } = require('../utils/cloudinary');

const applyForAdmission = async (req, res) => {
  try {
    const data = req.body;

    // Handle Uploads if any
    const documents = {};
    if (req.files) {
      for (const field of ['aadhaarFront', 'aadhaarBack', 'photo', 'signature', 'collegeId', 'panCard']) {
        if (req.files[field]) {
          const file = req.files[field][0];
          const result = await uploadToCloudinary(file.buffer, 'marwar-pg');
          documents[field] = result.secure_url;
        }
      }
    }

    // Merge existing string URLs from body if they didn't upload files directly (fallback logic)
    if (data.documents) {
      const parsedDocs = typeof data.documents === 'string' ? JSON.parse(data.documents) : data.documents;
      Object.assign(documents, parsedDocs);
    }

    // Generate Application ID (RM-2026-XXXX)
    const count = await Student.countDocuments();
    const applicationId = `RM-2026-${(count + 1).toString().padStart(4, '0')}`;

    const parsedAddress = typeof data.permanentAddress === 'string' ? JSON.parse(data.permanentAddress) : data.permanentAddress;
    const parsedCurrentAddress = typeof data.currentAddress === 'string' ? JSON.parse(data.currentAddress) : data.currentAddress;
    const parsedEducation = typeof data.education === 'string' ? JSON.parse(data.education) : data.education;
    const parsedEmergency = typeof data.emergencyContact === 'string' ? JSON.parse(data.emergencyContact) : data.emergencyContact;
    const parsedPrefs = typeof data.preferences === 'string' ? JSON.parse(data.preferences) : data.preferences;

    const student = new Student({
      name: data.name,
      fatherName: data.fatherName,
      motherName: data.motherName,
      dob: data.dob,
      gender: data.gender,
      phone: data.phone,
      altPhone: data.altPhone,
      email: data.email,
      aadhaarNumber: data.aadhaarNumber,
      permanentAddress: parsedAddress,
      currentAddress: parsedCurrentAddress,
      education: parsedEducation,
      emergencyContact: parsedEmergency,
      preferences: parsedPrefs,
      tiffinPlan: data.tiffinPlan,
      documents,
      applicationId,
      status: 'Pending Verification'
    });

    await student.save();

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      applicationId
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { applyForAdmission };
