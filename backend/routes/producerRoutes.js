// In backend/routes/producerRoutes.js

const express = require('express');
const router = express.Router();
const producerController = require('../controllers/producerController');

// Get featured producers
router.get('/featured', producerController.getFeaturedProducers);

module.exports = router;