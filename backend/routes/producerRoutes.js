// In backend/routes/producerRoutes.js

import express from 'express';
import * as producerController from '../controllers/producerController.js';

const router = express.Router();

// Get featured producers
router.get('/featured', producerController.getFeaturedProducers);

export default router;