import React, { useState, useEffect } from 'react';
import { FaSave, FaTrash, FaPlus, FaImage, FaSpinner } from 'react-icons/fa';
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
  
  // Logo state
  const [logoPreview, setLogoPreview] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  
  // About section state
  const [aboutSection, setAboutSection] = useState({ 
    title: '', 
    description: '', 
    image: '' 
  });
  const [uploadingAboutImage, setUploadingAboutImage] = useState(false);
  const [savingAbout, setSavingAbout] = useState(false);
  
  // Testimonials state
  const [testimonials, setTestimonials] = useState([]);
  const [savingTestimonials, setSavingTestimonials] = useState(false);
  const [uploadingTestimonialImage, setUploadingTestimonialImage] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await API.get('/api/admin/settings');
      
      if (response.data && response.data.settings) {
        const { settings } = response.data;
        setSettings(settings);
        
        // Set logo preview if available
        if (settings.logoUrl) {
          setLogoPreview(settings.logoUrl);
        }
        
        // Set about section if available
        if (settings.aboutSection) {
          setAboutSection(settings.aboutSection);
        }
        
        // Set testimonials if available
        if (settings.testimonials) {
          setTestimonials(settings.testimonials);
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setError('Failed to load settings. Please try again.');
      setLoading(false);
    }
  };

  // Handle logo upload
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      setUploadingLogo(true);
      setError(null);
      
      const formData = new FormData();
      formData.append('logo', file);
      
      const response = await API.put('/api/admin/settings/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data && response.data.success && response.data.logoUrl) {
        setLogoPreview(response.data.logoUrl);
        setSuccessMessage('Logo updated successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        throw new Error('Failed to update logo');
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      setError('Failed to upload logo. Please try again.');
    } finally {
      setUploadingLogo(false);
    }
  };

  // Handle about section image upload
  const handleAboutImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      setUploadingAboutImage(true);
      setError(null);
      
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await API.post('/api/admin/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data && response.data.url) {
        setAboutSection({
          ...aboutSection,
          image: response.data.url
        });
      } else {
        throw new Error('Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading about image:', error);
      setError('Failed to upload about section image. Please try again.');
    } finally {
      setUploadingAboutImage(false);
    }
  };

  // Save about section
  const saveAboutSection = async () => {
    try {
      setSavingAbout(true);
      setError(null);
      
      const response = await API.put('/api/admin/settings/about', aboutSection);
      
      if (response.data && response.data.success) {
        setSuccessMessage('About section updated successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        throw new Error('Failed to update about section');
      }
    } catch (error) {
      console.error('Error saving about section:', error);
      setError('Failed to save about section. Please try again.');
    } finally {
      setSavingAbout(false);
    }
  };

  // Handle testimonial image upload
  const handleTestimonialImageUpload = async (e, index) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      setUploadingTestimonialImage(index);
      setError(null);
      
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await API.post('/api/admin/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data && response.data.url) {
        const updatedTestimonials = [...testimonials];
        updatedTestimonials[index].avatar = response.data.url;
        setTestimonials(updatedTestimonials);
      } else {
        throw new Error('Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading testimonial image:', error);
      setError('Failed to upload testimonial image. Please try again.');
    } finally {
      setUploadingTestimonialImage(null);
    }
  };

  // Save testimonials
  const saveTestimonials = async () => {
    try {
      setSavingTestimonials(true);
      setError(null);
      
      const response = await API.put('/api/admin/settings/testimonials', { testimonials });
      
      if (response.data && response.data.success) {
        setSuccessMessage('Testimonials updated successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        throw new Error('Failed to update testimonials');
      }
    } catch (error) {
      console.error('Error saving testimonials:', error);
      setError('Failed to save testimonials. Please try again.');
    } finally {
      setSavingTestimonials(false);
    }
  };

  // Add new testimonial
  const addTestimonial = () => {
    setTestimonials([...testimonials, { name: '', message: '', avatar: '' }]);
  };

  // Remove testimonial
  const removeTestimonial = (index) => {
    const updatedTestimonials = testimonials.filter((_, i) => i !== index);
    setTestimonials(updatedTestimonials);
  };

  // Handle input change for main settings
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

  // Handle about section input change
  const handleAboutInputChange = (e) => {
    const { name, value } = e.target;
    
    setAboutSection({
      ...aboutSection,
      [name]: value
    });
  };

  // Handle testimonial input change
  const handleTestimonialInputChange = (index, field, value) => {
    const updatedTestimonials = [...testimonials];
    updatedTestimonials[index][field] = value;
    setTestimonials(updatedTestimonials);
  };

  // Save main settings
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage('');
      
      const response = await API.put('/api/admin/settings', settings);
      
      if (response.data && response.data.success) {
        setSuccessMessage('Settings updated successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        throw new Error('Failed to update settings');
      }
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
        {/* General Settings Section */}
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

        {/* Content Settings Section */}
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

        {/* System Settings Section */}
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

        {/* Save Button for Main Settings */}
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
            onChange={handleLogoUpload}
            disabled={uploadingLogo}
            className={styles.fileInput}
          />
          
          {uploadingLogo && (
            <div className={styles.uploadingIndicator}>
              <FaSpinner className={styles.spinnerIcon} /> Uploading...
            </div>
          )}
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
            name="title"
            value={aboutSection.title}
            onChange={handleAboutInputChange}
            placeholder="About section title"
          />
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="aboutDescription">Description</label>
          <textarea
            id="aboutDescription"
            name="description"
            value={aboutSection.description}
            onChange={handleAboutInputChange}
            rows="4"
            placeholder="About section description"
          ></textarea>
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="aboutImage">Image</label>
          
          {aboutSection.image && (
            <div className={styles.imagePreview}>
              <img src={aboutSection.image} alt="About section" />
            </div>
          )}
          
          <input
            type="file"
            id="aboutImage"
            accept="image/*"
            onChange={handleAboutImageUpload}
            disabled={uploadingAboutImage}
            className={styles.fileInput}
          />
          
          {uploadingAboutImage && (
            <div className={styles.uploadingIndicator}>
              <FaSpinner className={styles.spinnerIcon} /> Uploading...
            </div>
          )}
        </div>
        
        <button
          type="button"
          onClick={saveAboutSection}
          disabled={savingAbout}
          className={styles.saveButton}
        >
          {savingAbout ? 'Saving...' : 'Save About Section'}
          {!savingAbout && <FaSave className={styles.saveIcon} />}
        </button>
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
                value={testimonial.name}
                onChange={(e) => handleTestimonialInputChange(index, 'name', e.target.value)}
                placeholder="Testimonial author"
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor={`testimonialMessage${index}`}>Message</label>
              <textarea
                id={`testimonialMessage${index}`}
                value={testimonial.message}
                onChange={(e) => handleTestimonialInputChange(index, 'message', e.target.value)}
                rows="3"
                placeholder="Testimonial message"
              ></textarea>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor={`testimonialAvatar${index}`}>Avatar</label>
              
              {testimonial.avatar && (
                <div className={styles.avatarPreview}>
                  <img src={testimonial.avatar} alt={`${testimonial.name}'s avatar`} />
                </div>
              )}
              
              <input
                type="file"
                id={`testimonialAvatar${index}`}
                accept="image/*"
                onChange={(e) => handleTestimonialImageUpload(e, index)}
                disabled={uploadingTestimonialImage === index}
                className={styles.fileInput}
              />
              
              {uploadingTestimonialImage === index && (
                <div className={styles.uploadingIndicator}>
                  <FaSpinner className={styles.spinnerIcon} /> Uploading...
                </div>
              )}
            </div>
          </div>
        ))}
        
        <div className={styles.testimonialActions}>
          <button
            type="button"
            onClick={addTestimonial}
            className={styles.addButton}
          >
            <FaPlus /> Add Testimonial
          </button>
          
          <button
            type="button"
            onClick={saveTestimonials}
            disabled={savingTestimonials}
            className={styles.saveButton}
          >
            {savingTestimonials ? 'Saving...' : 'Save Testimonials'}
            {!savingTestimonials && <FaSave className={styles.saveIcon} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;