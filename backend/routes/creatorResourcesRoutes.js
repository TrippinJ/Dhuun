import express from 'express';
import { authenticateUser } from './auth.js';
import { upload } from '../utils/storageManger.js';
import {
  getCreatorResources,
  getCreatorResourceById,
  createCreatorResource,
  updateCreatorResource,
  deleteCreatorResource
} from '../controllers/creatorResourceController.js';

const router = express.Router();

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
  next();
};

// ✅ Public route: get all creator resources (with optional category/type filters)
router.get('/', getCreatorResources);

// ✅ Public route: get single resource by ID
router.get('/:id', getCreatorResourceById);

// ✅ Admin-only: create a new resource (with file uploads)
router.post('/', 
  authenticateUser, 
  isAdmin,
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'pdfFile', maxCount: 1 }
  ]),
  createCreatorResource
);

// ✅ Admin-only: update a resource by ID (with file uploads)
router.put('/:id', 
  authenticateUser, 
  isAdmin,
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'pdfFile', maxCount: 1 }
  ]),
  updateCreatorResource
);

// ✅ Admin-only: delete a resource by ID
router.delete('/:id', authenticateUser, isAdmin, deleteCreatorResource);

export default router;