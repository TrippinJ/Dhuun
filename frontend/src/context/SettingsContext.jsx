
import React, { createContext, useState, useContext, useEffect } from 'react';
import API from '../api/api';
import LogoImage from '../Assets/DHUUN.png';

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    logoUrl: LogoImage, // Default logo
    siteName: 'Dhuun',
    
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const fetchSettings = async () => {
    try {
      console.log('Fetching settings from public endpoint...');
      // Use the public endpoint instead of admin endpoint
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
      // Keep using default settings on error
    } finally {
      setLoading(false);
    }
  };

  fetchSettings();
}, []);

  return (
    <SettingsContext.Provider value={{ settings, setSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};