import express from 'express';
import Settings from '../models/settings.js';

const router = express.Router();

// Public endpoint - no authentication required
router.get('/public', async (req, res) => {
  try {
    const settings = await Settings.findOne();
    
    if (!settings) {
      // Return comprehensive default settings
      return res.json({ 
        settings: {
          siteName: 'Dhuun',
          logoUrl: '/DHUUN.png',
          siteDescription: 'A marketplace for producers and artists to buy and sell beats',
          contactEmail: 'admin@dhuun.com',
          contactPhone: '',
          websiteURL: '',
          shortURL: '',
          heroTitle: '',
          aboutSection: {
            title: '',
            description: '',
            image: ''
          }
        }
      });
    }
    
    // Return ALL settings for public use
    return res.json({ 
      settings: {
        siteName: settings.siteName || 'Dhuun',
        logoUrl: settings.logoUrl || '/DHUUN.png',
        siteDescription: settings.siteDescription || 'A marketplace for producers and artists',
        contactEmail: settings.contactEmail || 'admin@dhuun.com',
        contactPhone: settings.contactPhone || '',
        websiteURL: settings.websiteURL || '',
        shortURL: settings.shortURL || '',
        heroTitle: settings.heroTitle || '',
        aboutSection: settings.aboutSection || {
          title: '',
          description: '',
          image: ''
        },
        testimonials: settings.testimonials || []
      }
    });
    
  } catch (error) {
    console.error('Error fetching public settings:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;