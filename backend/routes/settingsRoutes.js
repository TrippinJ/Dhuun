import express from 'express';
import Settings from '../models/settings.js';

const router = express.Router();

// Public endpoint - no authentication required
router.get('/public', async (req, res) => {
  try {
    // Find settings but only return non-sensitive fields
    const settings = await Settings.findOne();
    
    // If no settings exist, return defaults
    if (!settings) {
      return res.json({ 
        settings: {
          siteName: 'Dhuun', 
          logoUrl: '/DHUUN.png'
        }
      });
    }
    
    // Return only safe fields
    const publicSettings = {
      siteName: settings.siteName,
      logoUrl: settings.logoUrl,
      siteDescription: settings.siteDescription
    };
    
    res.json({ settings: publicSettings });
  } catch (error) {
    console.error('Error fetching public settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;