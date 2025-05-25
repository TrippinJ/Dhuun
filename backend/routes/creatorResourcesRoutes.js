import express from 'express';
import {
  getCreatorResources,
  getCreatorResourceById,
  createCreatorResource,
  updateCreatorResource,
  deleteCreatorResource
} from '../controllers/creatorResourceController.js';

const router = express.Router();

// ✅ Public route: get all creator resources (with optional category/type filters)
router.get('/', getCreatorResources);

// ✅ Public route: get single resource by ID
router.get('/:id', getCreatorResourceById);

// ✅ Admin-only: create a new resource
router.post('/', createCreatorResource);

// ✅ Admin-only: update a resource by ID
router.put('/:id', updateCreatorResource);

// ✅ Admin-only: delete a resource by ID
router.delete('/:id', deleteCreatorResource);

// ✅ Required for ESM default import in server.js
export default router;
