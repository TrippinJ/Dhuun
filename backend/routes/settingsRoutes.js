import express from 'express';
import Settings from '../models/settings.js';

const router = express.Router();

// Public endpoint - no authentication required
router.get('/public', async (req, res) => {
  try {
    // Simple approach that avoids using any variables before they're defined
    const settings = await Settings.findOne();
    
    if (!settings) {
      // Return default settings if none are found
      return res.json({ 
        settings: {
          siteName: 'Dhuun',
          logoUrl: '/DHUUN.png',
          siteDescription: 'A marketplace for producers and artists to buy and sell beats'
        }
      });
    }
    
    // Return filtered settings
    return res.json({ 
      settings: {
        siteName: settings.siteName || 'Dhuun',
        logoUrl: settings.logoUrl || '/DHUUN.png',
        siteDescription: settings.siteDescription || 'A marketplace for producers and artists'
      }
    });
    
  } catch (error) {
    console.error('Error fetching public settings:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;