
import React, { createContext, useState, useContext, useEffect } from 'react';
import API from '../api/api';

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    logoUrl: '/DHUUN.png', // Default logo
    siteName: 'Dhuun',
    // other settings
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await API.get('/api/admin/settings');
        if (response.data && response.data.settings) {
          setSettings(response.data.settings);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
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