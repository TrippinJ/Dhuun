
import React, { createContext, useState, useContext, useEffect } from 'react';
import API from '../api/api';

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    logoUrl: '/DHUUN.png', // Default logo
    siteName: 'Dhuun',
    siteDescription: 'A marketplace for producers and artists to buy and sell beats',
    contactEmail: '',
    maxUploadSizeMB: 20,
    commissionRate: 10,
    featuredBeatsLimit: 8,
    maintenanceMode: false,
    aboutSection: {
      title: '',
      description: '',
      image: ''
    },
    testimonials: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch initial settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        console.log('Fetching settings from public endpoint...');
        // Use the public endpoint for initial load
        const response = await API.get('/api/settings/public');
        
        if (response.data && response.data.settings) {
          console.log('Settings loaded successfully:', response.data.settings);
          setSettings(prevSettings => ({
            ...prevSettings,  // Keep defaults for missing properties
            ...response.data.settings
          }));
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        setError('Failed to load settings');
        // Keep using default settings on error
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Function to update settings (for admin)
  const updateSettings = async (updatedSettings) => {
    try {
      setLoading(true);
      const response = await API.put('/api/admin/settings', updatedSettings);
      
      if (response.data && response.data.success) {
        console.log('Settings updated successfully:', response.data.settings);
        
        // Update local settings
        setSettings(prevSettings => ({
          ...prevSettings,
          ...response.data.settings
        }));
        
        return { success: true, message: 'Settings updated successfully' };
      } else {
        throw new Error(response.data?.message || 'Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      setError(error.message || 'Failed to update settings');
      return { success: false, message: error.message || 'Failed to update settings' };
    } finally {
      setLoading(false);
    }
  };

  return (
    <SettingsContext.Provider value={{ 
      settings, 
      setSettings, 
      updateSettings, 
      loading,
      error 
    }}>
      {children}
    </SettingsContext.Provider>
  );
};