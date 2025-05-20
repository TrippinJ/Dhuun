// src/Components/Admin/AdminSettings.jsx
import React, { useState, useEffect } from 'react';
import { FaSave, FaTrash, FaPlus, FaImage, FaSpinner } from 'react-icons/fa';
import API from '../../api/api';
import styles from '../../css/Admin/AdminSettings.module.css';
import { useSettings } from '../../context/SettingsContext';

const AdminSettings = () => {
  const { settings: globalSettings, setSettings: setGlobalSettings } = useSettings();

  // Main form state
  const [formData, setFormData] = useState({
    siteName: globalSettings.siteName || 'Dhuun',
    siteDescription: globalSettings.siteDescription || '',
    contactEmail: globalSettings.contactEmail || '',
    maxUploadSizeMB: globalSettings.maxUploadSizeMB || 20,
    commissionRate: globalSettings.commissionRate || 10,
    featuredBeatsLimit: globalSettings.featuredBeatsLimit || 8,
    maintenanceMode: globalSettings.maintenanceMode || false,

    // About section
    aboutTitle: globalSettings.aboutSection?.title || '',
    aboutDescription: globalSettings.aboutSection?.description || '',
    aboutImage: globalSettings.aboutSection?.image || '',
  });

  // Separate state for testimonials as it's an array
  const [testimonials, setTestimonials] = useState(globalSettings.testimonials || []);

  // File upload states
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(globalSettings.logoUrl || '');
  const [aboutImageFile, setAboutImageFile] = useState(null);

  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Update form data when global settings change
  useEffect(() => {
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

    setTestimonials(globalSettings.testimonials || []);
    setLogoPreview(globalSettings.logoUrl || '');
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

  // Handle testimonial input change
  const handleTestimonialChange = (index, field, value) => {
    const updatedTestimonials = [...testimonials];
    updatedTestimonials[index] = {
      ...updatedTestimonials[index],
      [field]: value
    };
    setTestimonials(updatedTestimonials);
  };

  // Add new testimonial
  const addTestimonial = () => {
    setTestimonials([...testimonials, { name: '', message: '', avatar: '' }]);
  };

  // Remove testimonial
  const removeTestimonial = (index) => {
    setTestimonials(testimonials.filter((_, i) => i !== index));
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

        const logoResponse = await API.put('/api/admin/settings/logo', logoFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (logoResponse.data && logoResponse.data.success) {
          logoUrl = logoResponse.data.logoUrl;

          // Update the logoUrl in global settings immediately
          setGlobalSettings({
            ...globalSettings,
            logoUrl: logoResponse.data.logoUrl
          });

        } else {
          throw new Error('Failed to upload logo');
        }
      }

      // Upload about image if a new one was selected
      if (aboutImageFile) {
        const imageFormData = new FormData();
        imageFormData.append('image', aboutImageFile);

        const imageResponse = await API.post('/api/admin/upload', imageFormData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (imageResponse.data && imageResponse.data.url) {
          aboutImageUrl = imageResponse.data.url;
        } else {
          throw new Error('Failed to upload about image');
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
        testimonials: testimonials
      };

      // Make API call to save all settings at once
      const response = await API.put('/api/admin/settings', updatedSettings);

      if (response.data && response.data.success) {
        // Update global settings
        setGlobalSettings({
          ...globalSettings,
          ...updatedSettings
        });

        // Clear file states
        setLogoFile(null);
        setAboutImageFile(null);

        // Show success message
        setSuccessMessage('All settings updated successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        throw new Error('Failed to update settings');
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

      <form onSubmit={handleSubmit} className={styles.settingsForm}>
        {/* General Settings Section */}
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
              required
            />
          </div>

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

        {/* Logo Section */}
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

        {/* Testimonials Section */}
        <div className={styles.formSection}>
          <h3>Testimonials</h3>

          {testimonials.map((testimonial, index) => (
            <div key={index} className={styles.testimonialItem}>
              <div className={styles.testimonialHeader}>
                <h4>Testimonial #{index + 1}</h4>
                <button
                  type="button"
                  className={styles.deleteButton}
                  onClick={() => removeTestimonial(index)}
                >
                  <FaTrash /> Remove
                </button>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor={`testimonialName${index}`}>Name</label>
                <input
                  type="text"
                  id={`testimonialName${index}`}
                  value={testimonial.name || ''}
                  onChange={(e) => handleTestimonialChange(index, 'name', e.target.value)}
                  placeholder="Testimonial author"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor={`testimonialMessage${index}`}>Message</label>
                <textarea
                  id={`testimonialMessage${index}`}
                  value={testimonial.message || ''}
                  onChange={(e) => handleTestimonialChange(index, 'message', e.target.value)}
                  rows="3"
                  placeholder="Testimonial message"
                ></textarea>
              </div>

              {/* Add avatar upload functionality if needed */}
            </div>
          ))}

          <button
            type="button"
            onClick={addTestimonial}
            className={styles.addButton}
          >
            <FaPlus /> Add Testimonial
          </button>
        </div>

        {/* Single Save Button for all settings */}
        <div className={styles.formActions}>
          <button
            type="submit"
            className={styles.saveButton}
            disabled={loading}
          >
            {loading ? (
              <>
                <FaSpinner className={styles.spinnerIcon} /> Saving All Settings...
              </>
            ) : (
              <>
                <FaSave className={styles.saveIcon} /> Save All Settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettings;