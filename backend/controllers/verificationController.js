import Verification from '../models/verification.js';
import User from '../models/user.js';
import { uploadFileToCloudinary, deleteFile } from '../utils/storageManger.js';

// Submit verification documents
export const submitDocuments = async (req, res) => {
  try {
    // Check if user already has a verification record
    let verification = await Verification.findOne({ user: req.user.id });
    
    // If not, create a new one
    if (!verification) {
      verification = new Verification({
        user: req.user.id,
        documents: [],
        status: 'pending'
      });
    } else if (verification.status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Your account is already verified'
      });
    }
    
    // Process document uploads
    const uploadedDocs = [];
    
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }
    
    // Handle each document type
    for (const [key, files] of Object.entries(req.files)) {
      if (!files || files.length === 0) continue;
      
      const file = files[0];
      const documentType = key.replace('Document', ''); // e.g., 'idDocument' -> 'id'
      
      // Upload to Cloudinary
      const result = await uploadFileToCloudinary(
        file.path,
        false, // Not audio
        { folder: `dhuun/verification/${req.user.id}` }
      );
      
      // Add document to the array
      uploadedDocs.push({
        type: documentType,
        fileUrl: result.url,
        filePublicId: result.publicId,
        uploadDate: new Date()
      });
    }
    
    // Process payment details if provided
    if (req.body.paymentMethod) {
      verification.payoutDetails = {
        paymentMethod: req.body.paymentMethod,
        ...req.body
      };
    }
    
    // Add new documents to the verification record
    verification.documents.push(...uploadedDocs);
    verification.status = 'pending';
    verification.lastUpdated = new Date();
    
    await verification.save();
    
    // Update user's verification status
    await User.findByIdAndUpdate(req.user.id, { 
      verificationStatus: 'pending' 
    });
    
    res.json({
      success: true,
      message: 'Verification documents submitted successfully',
      verification
    });
  } catch (error) {
    console.error('Error submitting verification documents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit verification documents'
    });
  }
};

// Get verification status
export const getVerificationStatus = async (req, res) => {
  try {
    const verification = await Verification.findOne({ user: req.user.id });
    
    if (!verification) {
      return res.json({
        success: true,
        status: 'not_submitted',
        message: 'Verification documents not yet submitted'
      });
    }
    
    res.json({
      success: true,
      status: verification.status,
      documents: verification.documents.map(doc => ({
        type: doc.type,
        uploadDate: doc.uploadDate,
        verifiedDate: doc.verifiedDate
      })),
      payoutDetails: verification.payoutDetails,
      lastUpdated: verification.lastUpdated
    });
  } catch (error) {
    console.error('Error getting verification status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get verification status'
    });
  }
};

// Admin: Get pending verifications
export const getPendingVerifications = async (req, res) => {
  try {
    const verifications = await Verification.find({ status: 'pending' })
      .populate('user', 'name email username')
      .sort({ submittedDate: 1 });
    
    res.json({
      success: true,
      count: verifications.length,
      verifications
    });
  } catch (error) {
    console.error('Error getting pending verifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pending verifications'
    });
  }
};

// Admin: Update verification status
export const updateVerificationStatus = async (req, res) => {
  try {
    const { verificationId, status, adminNotes } = req.body;
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }
    
    const verification = await Verification.findById(verificationId);
    
    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'Verification record not found'
      });
    }
    
    verification.status = status;
    if (adminNotes) verification.adminNotes = adminNotes;
    verification.lastUpdated = new Date();
    
    // Update document verified dates if approved
    if (status === 'approved') {
      verification.documents.forEach(doc => {
        doc.verifiedDate = new Date();
      });
    }
    
    await verification.save();
    
    // Update user verification status
    await User.findByIdAndUpdate(verification.user, {
      verificationStatus: status
    });
    
    res.json({
      success: true,
      message: `Verification ${status}`,
      verification
    });
  } catch (error) {
    console.error('Error updating verification status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update verification status'
    });
  }
};