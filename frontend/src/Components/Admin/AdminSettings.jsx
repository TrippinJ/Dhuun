import React, { useState, useEffect } from 'react';
import { FaSave } from 'react-icons/fa';
import API from '../../api/api';
import styles from '../../css/Admin/AdminSettings.module.css';

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    siteName: 'Dhuun',
    siteDescription: 'A marketplace for producers and artists to buy and sell beats',
    contactEmail: 'admin@dhuun.com',
    maxUploadSizeMB: 20,
    commissionRate: 10,
    featuredBeatsLimit: 8,
    maintenanceMode: false
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await API.get('/api/admin/settings');
      setSettings(response.data.settings);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setError('Failed to load settings. Please try again.');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle different input types
    const newValue = type === 'checkbox' ? checked : 
                   (type === 'number' ? parseFloat(value) : value);
    
    setSettings({
      ...settings,
      [name]: newValue
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage('');
      
      const response = await API.put('/api/admin/settings', settings);
      
      setSuccessMessage('Settings updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setError('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading settings...</div>;
  }

  return (
    <div className={styles.settingsContainer}>
      <div className={styles.settingsHeader}>
        <h2>Platform Settings</h2>
      </div>

      {error && <div className={styles.errorMessage}>{error}</div>}
      {successMessage && <div className={styles.successMessage}>{successMessage}</div>}

      <form onSubmit={handleSubmit} className={styles.settingsForm}>
        <div className={styles.formSection}>
          <h3>General Settings</h3>
          
          <div className={styles.formGroup}>
            <label htmlFor="siteName">Site Name</label>
            <input
              type="text"
              id="siteName"
              name="siteName"
              value={settings.siteName}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="siteDescription">Site Description</label>
            <textarea
              id="siteDescription"
              name="siteDescription"
              value={settings.siteDescription}
              onChange={handleInputChange}
              rows="3"
            ></textarea>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="contactEmail">Contact Email</label>
            <input
              type="email"
              id="contactEmail"
              name="contactEmail"
              value={settings.contactEmail}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>

        <div className={styles.formSection}>
          <h3>Content Settings</h3>
          
          <div className={styles.formGroup}>
            <label htmlFor="maxUploadSizeMB">Max Upload Size (MB)</label>
            <input
              type="number"
              id="maxUploadSizeMB"
              name="maxUploadSizeMB"
              min="1"
              max="100"
              value={settings.maxUploadSizeMB}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="commissionRate">Commission Rate (%)</label>
            <input
              type="number"
              id="commissionRate"
              name="commissionRate"
              min="0"
              max="100"
              value={settings.commissionRate}
              onChange={handleInputChange}
              required
            />
            <p className={styles.fieldHelp}>
              Percentage of each sale that goes to the platform
            </p>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="featuredBeatsLimit">Featured Beats Limit</label>
            <input
              type="number"
              id="featuredBeatsLimit"
              name="featuredBeatsLimit"
              min="1"
              max="20"
              value={settings.featuredBeatsLimit}
              onChange={handleInputChange}
              required
            />
            <p className={styles.fieldHelp}>
              Maximum number of beats to show in featured sections
            </p>
          </div>
        </div>

        <div className={styles.formSection}>
          <h3>System Settings</h3>
          
          <div className={styles.formGroup}>
            <div className={styles.checkboxControl}>
              <input
                type="checkbox"
                id="maintenanceMode"
                name="maintenanceMode"
                checked={settings.maintenanceMode}
                onChange={handleInputChange}
              />
              <label htmlFor="maintenanceMode">Enable Maintenance Mode</label>
            </div>
            <p className={styles.fieldHelp}>
              When enabled, only administrators can access the site
            </p>
          </div>
        </div>

        <div className={styles.formActions}>
          <button
            type="submit"
            className={styles.saveButton}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Settings'}
            {!saving && <FaSave className={styles.saveIcon} />}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettings;