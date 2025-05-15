import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { FaSave, FaTrash, FaPlus } from 'react-icons/fa';
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

  const cloudinaryUpload = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "your_upload_preset"); // change accordingly

    const res = await axios.post("https://api.cloudinary.com/v1_1/your_cloud_name/image/upload", formData);
    return res.data.secure_url;
  };

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [logoPreview, setLogoPreview] = useState('');
  const [about, setAbout] = useState({ title: '', description: '', image: '' });
  const [testimonials, setTestimonials] = useState([]);

  useEffect(() => {
    fetchSettings();
    fetchDynamicSections();
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

  const fetchDynamicSections = async () => {
    const res = await API.get('/api/admin/settings');
    setLogoPreview(res.data.settings.logoUrl);
    setAbout(res.data.settings.aboutSection || {});
    setTestimonials(res.data.settings.testimonials || []);
  };

  // Handle logo upload
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const url = await cloudinaryUpload(file);
    await API.put('/api/admin/settings/logo', { logo: url });
    setLogoPreview(url);
  };

  // Handle about update
  const saveAbout = async () => {
    await API.put('/api/admin/settings/about', about);
    alert('About section updated!');
  };

  // Handle testimonials update
  const saveTestimonials = async () => {
    await API.put('/api/admin/settings/testimonials', { testimonials });
    alert('Testimonials updated!');
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
        <div>
          <h2>Site Logo</h2>
          {logoPreview && <img src={logoPreview} alt="logo" style={{ height: 60 }} />}
          <input type="file" onChange={handleLogoUpload} />
        </div>

        <div>
          <h2>About Section</h2>
          <input
            type="text"
            value={about.title}
            placeholder="Title"
            onChange={(e) => setAbout({ ...about, title: e.target.value })}
          />
          <textarea
            value={about.description}
            placeholder="Description"
            onChange={(e) => setAbout({ ...about, description: e.target.value })}
          />
          <input
            type="file"
            onChange={async (e) => {
              const url = await cloudinaryUpload(e.target.files[0]);
              setAbout({ ...about, image: url });
            }}
          />
          <button onClick={saveAbout}>Save About Section</button>
        </div>

        <div>
          <h2>Testimonials</h2>
          {testimonials.map((t, idx) => (
            <div key={idx}>
              <input
                placeholder="Name"
                value={t.name}
                onChange={(e) => {
                  const copy = [...testimonials];
                  copy[idx].name = e.target.value;
                  setTestimonials(copy);
                }}
              />
              <textarea
                placeholder="Message"
                value={t.message}
                onChange={(e) => {
                  const copy = [...testimonials];
                  copy[idx].message = e.target.value;
                  setTestimonials(copy);
                }}
              />
              <input
                type="file"
                onChange={async (e) => {
                  const url = await cloudinaryUpload(e.target.files[0]);
                  const copy = [...testimonials];
                  copy[idx].avatar = url;
                  setTestimonials(copy);
                }}
              />
              <button onClick={() => {
                const copy = testimonials.filter((_, i) => i !== idx);
                setTestimonials(copy);
              }}>Remove</button>
            </div>
          ))}
          <button onClick={() => setTestimonials([...testimonials, { name: '', message: '', avatar: '' }])}>Add Testimonial</button>
          <button onClick={saveTestimonials}>Save Testimonials</button>
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