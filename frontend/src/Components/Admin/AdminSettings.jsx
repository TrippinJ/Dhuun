import React, { useState, useEffect } from 'react';
import { FaSave, FaTrash, FaPlus, FaImage, FaSpinner, FaCog, FaPalette, FaHome, FaUsers, FaServer, FaQuestion } from 'react-icons/fa';
import API from '../../api/api';
import styles from '../../css/Admin/AdminSettings.module.css';
import { useSettings } from '../../context/SettingsContext';

const AdminSettings = () => {
  const { settings: globalSettings, updateSettings } = useSettings();
  const [activeTab, setActiveTab] = useState('general');

  const [formData, setFormData] = useState({
    // Site fields
    siteName: '',
    siteDescription: '',
    contactEmail: '',
    maxUploadSizeMB: 20,
    commissionRate: 10,
    featuredBeatsLimit: 8,
    maintenanceMode: false,

    // About section
    aboutTitle: '',
    aboutDescription: '',
    aboutImage: '',

    // New fields for other landing page sections
    heroTitle: '',
    contactPhone: '',
    websiteURL: '',
    shortURL: '',
    workTitle: '',
    workDescription: '',
  });


  // File upload states
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [aboutImageFile, setAboutImageFile] = useState(null);

  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Update form data when global settings change
  useEffect(() => {
    if (globalSettings) {
      setFormData({
        siteName: globalSettings.siteName || 'Dhuun',
        siteDescription: globalSettings.siteDescription || '',
        contactEmail: globalSettings.contactEmail || '',
        maxUploadSizeMB: globalSettings.maxUploadSizeMB || 20,
        commissionRate: globalSettings.commissionRate || 10,
        featuredBeatsLimit: globalSettings.featuredBeatsLimit || 8,
        maintenanceMode: globalSettings.maintenanceMode || false,

        aboutTitle: globalSettings.aboutSection?.title || '',
        aboutDescription: globalSettings.aboutSection?.description || '',
        aboutImage: globalSettings.aboutSection?.image || '',
      });


      setLogoPreview(globalSettings.logoUrl || '');
    }
  }, [globalSettings]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Handle logo file selection
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  // Handle about image file selection
  const handleAboutImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAboutImageFile(file);
      // Create a preview URL
      setFormData({
        ...formData,
        aboutImage: URL.createObjectURL(file)
      });
    }
  };



  // Main form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage('');

    try {
      // First, handle file uploads if needed
      let logoUrl = globalSettings.logoUrl;
      let aboutImageUrl = formData.aboutImage;

      // Upload logo if a new one was selected
      if (logoFile) {
        const logoFormData = new FormData();
        logoFormData.append('logo', logoFile);

        try {
          const logoResponse = await API.put('/api/admin/settings/logo', logoFormData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });

          if (logoResponse.data && logoResponse.data.success) {
            logoUrl = logoResponse.data.logoUrl;
          } else {
            throw new Error('Failed to upload logo');
          }
        } catch (logoError) {
          console.error('Logo upload error:', logoError);
          throw new Error('Failed to upload logo: ' + (logoError.message || 'Unknown error'));
        }
      }

      // Upload about image if a new one was selected
      if (aboutImageFile) {
        const imageFormData = new FormData();
        imageFormData.append('image', aboutImageFile);

        try {
          const imageResponse = await API.post('/api/admin/upload', imageFormData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });

          if (imageResponse.data && imageResponse.data.url) {
            aboutImageUrl = imageResponse.data.url;
          } else {
            throw new Error('Failed to upload about image');
          }
        } catch (imageError) {
          console.error('Image upload error:', imageError);
          // Don't block the form submission if image upload fails
          console.warn('Continuing with settings update despite image upload failure');
        }
      }

      // Prepare complete settings object
      const updatedSettings = {
        siteName: formData.siteName,
        siteDescription: formData.siteDescription,
        contactEmail: formData.contactEmail,
        maxUploadSizeMB: parseFloat(formData.maxUploadSizeMB),
        commissionRate: parseFloat(formData.commissionRate),
        featuredBeatsLimit: parseInt(formData.featuredBeatsLimit),
        maintenanceMode: formData.maintenanceMode,
        logoUrl: logoUrl,
        aboutSection: {
          title: formData.aboutTitle,
          description: formData.aboutDescription,
          image: aboutImageUrl
        },
      };

      // Use the context function to update settings
      const result = await updateSettings(updatedSettings);

      if (result.success) {
        // Clear file states
        setLogoFile(null);
        setAboutImageFile(null);

        // Show success message
        setSuccessMessage('All settings updated successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        throw new Error(result.message || 'Failed to update settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setError(`Failed to save settings: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.settingsContainer}>
      <div className={styles.settingsHeader}>
        <h2>Platform Settings</h2>
      </div>

      {error && <div className={styles.errorMessage}>{error}</div>}
      {successMessage && <div className={styles.successMessage}>{successMessage}</div>}

      <div className={styles.tabsContainer}>
        <div className={styles.tabsNav}>
          <button
            className={`${styles.tabButton} ${activeTab === 'general' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('general')}
          >
            <FaCog /> General
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'appearance' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('appearance')}
          >
            <FaPalette /> Appearance
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'homepage' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('homepage')}
          >
            <FaHome /> Homepage
          </button>

          <button
            className={`${styles.tabButton} ${activeTab === 'advanced' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('advanced')}
          >
            <FaServer /> Advanced
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.settingsForm}>
          {/* General Settings Tab */}
          {activeTab === 'general' && (
            <div className={styles.tabContent}>
              <div className={styles.formSection}>
                <h3>General Settings</h3>

                <div className={styles.formGroup}>
                  <label htmlFor="siteName">Site Name</label>
                  <input
                    type="text"
                    id="siteName"
                    name="siteName"
                    value={formData.siteName}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="siteDescription">Site Description</label>
                  <textarea
                    id="siteDescription"
                    name="siteDescription"
                    value={formData.siteDescription}
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
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className={styles.formSection}>
                <h3>Contact Information</h3>

                <div className={styles.formGroup}>
                  <label htmlFor="contactPhone">Phone Number</label>
                  <input
                    type="text"
                    id="contactPhone"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleInputChange}
                    placeholder="9823******"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="websiteURL">Website URL</label>
                  <input
                    type="text"
                    id="websiteURL"
                    name="websiteURL"
                    value={formData.websiteURL}
                    onChange={handleInputChange}
                    placeholder="trippinjbeatz.com"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="shortURL">Short URL</label>
                  <input
                    type="text"
                    id="shortURL"
                    name="shortURL"
                    value={formData.shortURL}
                    onChange={handleInputChange}
                    placeholder="tj.com"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className={styles.tabContent}>
              <div className={styles.formSection}>
                <h3>Site Logo</h3>

                <div className={styles.logoPreviewContainer}>
                  {logoPreview && (
                    <img
                      src={logoPreview}
                      alt="Site Logo"
                      className={styles.logoPreview}
                    />
                  )}

                  {!logoPreview && (
                    <div className={styles.noLogo}>
                      <FaImage /> No logo uploaded
                    </div>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="logoUpload">Upload Logo</label>
                  <input
                    type="file"
                    id="logoUpload"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className={styles.fileInput}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Homepage Content Tab */}
          {activeTab === 'homepage' && (
            <div className={styles.tabContent}>
              {/* Hero Section */}
              <div className={styles.formSection}>
                <h3>Hero Section</h3>

                <div className={styles.formGroup}>
                  <label htmlFor="heroTitle">Hero Title</label>
                  <input
                    type="text"
                    id="heroTitle"
                    name="heroTitle"
                    value={formData.heroTitle}
                    onChange={handleInputChange}
                    placeholder="YOUR FIRST HIT STARTS HERE"
                  />
                </div>
              </div>

              {/* About Section */}
              <div className={styles.formSection}>
                <h3>About Section</h3>

                <div className={styles.formGroup}>
                  <label htmlFor="aboutTitle">Title</label>
                  <input
                    type="text"
                    id="aboutTitle"
                    name="aboutTitle"
                    value={formData.aboutTitle}
                    onChange={handleInputChange}
                    placeholder="About section title"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="aboutDescription">Description</label>
                  <textarea
                    id="aboutDescription"
                    name="aboutDescription"
                    value={formData.aboutDescription}
                    onChange={handleInputChange}
                    rows="4"
                    placeholder="About section description"
                  ></textarea>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="aboutImage">Image</label>

                  {formData.aboutImage && (
                    <div className={styles.imagePreview}>
                      <img src={formData.aboutImage} alt="About section" />
                    </div>
                  )}

                  <input
                    type="file"
                    id="aboutImage"
                    accept="image/*"
                    onChange={handleAboutImageChange}
                    className={styles.fileInput}
                  />
                </div>
              </div>

              {/* How It Works Section */}
              <div className={styles.formSection}>
                <h3>How It Works Section</h3>

                <div className={styles.formGroup}>
                  <label htmlFor="workTitle">Section Title</label>
                  <input
                    type="text"
                    id="workTitle"
                    name="workTitle"
                    value={formData.workTitle}
                    onChange={handleInputChange}
                    placeholder="How It Works"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="workDescription">Section Description</label>
                  <textarea
                    id="workDescription"
                    name="workDescription"
                    value={formData.workDescription}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Describe how your platform works"
                  ></textarea>
                </div>
              </div>
            </div>
          )}

          {/* Advanced Settings Tab */}
          {activeTab === 'advanced' && (
            <div className={styles.tabContent}>
              <div className={styles.formSection}>
                <h3>Advanced Settings</h3>

                <div className={styles.formGroup}>
                  <label htmlFor="maxUploadSizeMB">Max Upload Size (MB)</label>
                  <input
                    type="number"
                    id="maxUploadSizeMB"
                    name="maxUploadSizeMB"
                    min="1"
                    max="100"
                    value={formData.maxUploadSizeMB}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="commissionRate">Commission Rate (%)</label>
                  <div className={styles.inputWithAddon}>
                  <input
                    type="number"
                    id="commissionRate"
                    name="commissionRate"
                    min="0"
                    max="100"
                    value={formData.commissionRate}
                    onChange={handleInputChange}
                    required
                  />
                  <button type="button" className={styles.inputAddonBtn} title="Help">
                    <FaQuestion />
                  </button>
                </div>
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
                  value={formData.featuredBeatsLimit}
                  onChange={handleInputChange}
                  required
                />
                <p className={styles.fieldHelp}>
                  Maximum number of beats to show in featured sections
                </p>
              </div>

              <div className={styles.formGroup}>
                <div className={styles.checkboxControl}>
                  <input
                    type="checkbox"
                    id="maintenanceMode"
                    name="maintenanceMode"
                    checked={formData.maintenanceMode}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="maintenanceMode">Enable Maintenance Mode</label>
                </div>
                <p className={styles.fieldHelp}>
                  When enabled, only administrators can access the site
                </p>
              </div>
            </div>
            </div>
          )}

      {/* Save Button - Always visible at bottom */}
      <div className={styles.formActions}>
        <button
          type="submit"
          className={styles.saveButton}
          disabled={loading}
        >
          {loading ? (
            <>
              <FaSpinner className={styles.spinnerIcon} /> Saving 
            </>
          ) : (
            <>
              <FaSave className={styles.saveIcon} /> Save
            </>
          )}
        </button>
      </div>
    </form>
      </div >
    </div >
  );
};

export default AdminSettings;
