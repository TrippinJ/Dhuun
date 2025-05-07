// backend/routes/verificationRoutes.js
import express from 'express';
import multer from 'multer';
import { authenticateUser } from './auth.js';
import * as verificationController from '../controllers/verificationController.js';

const router = express.Router();

// Configure multer for document uploads
const upload = multer({ dest: 'uploads/verification/' });

// Protect all routes with authentication
router.use(authenticateUser);

// Routes for sellers
router.post('/submit', 
  upload.fields([
    { name: 'idDocument', maxCount: 1 },
    { name: 'addressDocument', maxCount: 1 },
    { name: 'bankDocument', maxCount: 1 },
    { name: 'taxDocument', maxCount: 1 }
  ]),
  verificationController.submitDocuments
);

router.get('/status', verificationController.getVerificationStatus);

// Admin routes - need admin check middleware
router.get('/admin/pending', verificationController.getPendingVerifications);
router.post('/admin/update', verificationController.updateVerificationStatus);

export default router;