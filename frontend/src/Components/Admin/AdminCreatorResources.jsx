// frontend/src/Components/Admin/AdminCreatorResources.jsx
import React, { useState, useEffect } from 'react';

const AdminCreatorResources = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    instructor: '',
    category: 'Beat Making',
    type: 'blog',
    description: '',
    duration: '',
    level: 'Beginner',
    blogUrl: '',
    videoUrl: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const categories = ['Beat Making', 'Mixing & Mastering', 'Music Theory', 'Vocal Production', 'Music Business'];
  const levels = ['Beginner', 'Intermediate', 'Advanced'];
  const types = ['blog', 'pdf', 'video'];

  useEffect(() => {
    fetchResources();
  }, []);

  // API functions
  const apiRequest = async (url, options = {}) => {
    const token = localStorage.getItem('token');
    const headers = {
      'Authorization': `Bearer ${token}`,
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  };

  const fetchResources = async () => {
    try {
      const data = await apiRequest('/api/creator-resources');
      setResources(data.resources || []);
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handlePdfChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPdfFile(file);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      instructor: '',
      category: 'Beat Making',
      type: 'blog',
      description: '',
      duration: '',
      level: 'Beginner',
      blogUrl: '',
      videoUrl: ''
    });
    setImageFile(null);
    setPdfFile(null);
    setImagePreview('');
    setEditingResource(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const submitFormData = new FormData();
    
    // Add text fields
    Object.keys(formData).forEach(key => {
      if (formData[key]) {
        submitFormData.append(key, formData[key]);
      }
    });
    
    // Add files
    if (imageFile) {
      submitFormData.append('image', imageFile);
    }
    if (pdfFile) {
      submitFormData.append('pdfFile', pdfFile);
    }

    try {
      if (editingResource) {
        // Update existing resource
        await apiRequest(`/api/creator-resources/${editingResource._id}`, {
          method: 'PUT',
          body: submitFormData
        });
      } else {
        // Create new resource
        await apiRequest('/api/creator-resources', {
          method: 'POST',
          body: submitFormData
        });
      }
      
      fetchResources();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving resource:', error);
      alert('Error saving resource: ' + error.message);
    }
  };

  const handleEdit = (resource) => {
    setEditingResource(resource);
    setFormData({
      title: resource.title,
      instructor: resource.instructor,
      category: resource.category,
      type: resource.type,
      description: resource.description,
      duration: resource.duration,
      level: resource.level,
      blogUrl: resource.blogUrl || '',
      videoUrl: resource.videoUrl || ''
    });
    setImagePreview(resource.image);
    setShowModal(true);
  };

  const handleDelete = async (resourceId) => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
      try {
        await apiRequest(`/api/creator-resources/${resourceId}`, {
          method: 'DELETE'
        });
        fetchResources();
      } catch (error) {
        console.error('Error deleting resource:', error);
        alert('Error deleting resource');
      }
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'pdf': return '📄';
      case 'blog': return '📖';
      case 'video': return '🎥';
      default: return '👁️';
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        color: 'white',
        fontSize: '18px'
      }}>
        Loading resources...
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', backgroundColor: '#1a1a1a', minHeight: '100vh' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px' 
      }}>
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          color: 'white',
          margin: 0 
        }}>
          Creator Resources Management
        </h2>
        <button
          onClick={() => setShowModal(true)}
          style={{
            backgroundColor: '#7B2CBF',
            color: 'white',
            padding: '12px 16px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: '500'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#8E44AD'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#7B2CBF'}
        >
          <span>➕</span> Add Resource
        </button>
      </div>

      {/* Resources Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '24px'
      }}>
        {resources.map(resource => (
          <div key={resource._id} style={{
            backgroundColor: '#2a2a2a',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid #333'
          }}>
            <div style={{ position: 'relative', height: '192px' }}>
              <img 
                src={resource.image} 
                alt={resource.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
              <div style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                borderRadius: '4px',
                padding: '4px 8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                color: 'white',
                fontSize: '12px'
              }}>
                <span>{getTypeIcon(resource.type)}</span>
                {resource.type.toUpperCase()}
              </div>
            </div>
            <div style={{ padding: '16px' }}>
              <h3 style={{ 
                color: 'white', 
                fontWeight: '600', 
                marginBottom: '8px',
                fontSize: '16px',
                margin: '0 0 8px 0'
              }}>
                {resource.title}
              </h3>
              <p style={{ 
                color: '#7B2CBF', 
                fontSize: '14px', 
                margin: '0 0 4px 0' 
              }}>
                by {resource.instructor}
              </p>
              <p style={{ 
                color: '#999', 
                fontSize: '14px', 
                margin: '0 0 8px 0' 
              }}>
                {resource.category}
              </p>
              <p style={{ 
                color: '#ccc', 
                fontSize: '14px', 
                margin: '0 0 12px 0',
                lineHeight: '1.4'
              }}>
                {resource.description}
              </p>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '12px',
                color: '#999',
                marginBottom: '12px'
              }}>
                <span>{resource.duration}</span>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: '600',
                  backgroundColor: 
                    resource.level === 'Beginner' ? 'rgba(29, 185, 84, 0.2)' :
                    resource.level === 'Intermediate' ? 'rgba(255, 186, 0, 0.2)' :
                    'rgba(255, 26, 26, 0.2)',
                  color:
                    resource.level === 'Beginner' ? '#1DB954' :
                    resource.level === 'Intermediate' ? '#FFBA00' :
                    '#FF1A1A'
                }}>
                  {resource.level}
                </span>
              </div>
              <div style={{ display: 'inline-flex', gap: '8px' }}>
                <button
                  onClick={() => handleEdit(resource)}
                  style={{
                    backgroundColor: '#2563eb',
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#1d4ed8'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#2563eb'}
                >
                  <span>✏️</span> Edit
                </button>
                <button
                  onClick={() => handleDelete(resource._id)}
                  style={{
                    backgroundColor: '#dc2626',
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#b91c1c'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#dc2626'}
                >
                  <span>🗑️</span> Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50
        }}>
          <div style={{
            backgroundColor: '#2a2a2a',
            borderRadius: '12px',
            padding: '24px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto',
            margin: '20px'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: 'white',
              marginBottom: '16px',
              margin: '0 0 16px 0'
            }}>
              {editingResource ? 'Edit Resource' : 'Add New Resource'}
            </h3>
            
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ 
                  display: 'block', 
                  color: 'white', 
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    backgroundColor: '#404040',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #555',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ 
                  display: 'block', 
                  color: 'white', 
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Instructor
                </label>
                <input
                  type="text"
                  name="instructor"
                  value={formData.instructor}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    backgroundColor: '#404040',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #555',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '16px',
                marginBottom: '16px'
              }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    color: 'white', 
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      backgroundColor: '#404040',
                      color: 'white',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #555',
                      fontSize: '14px'
                    }}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    color: 'white', 
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    Type
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      backgroundColor: '#404040',
                      color: 'white',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #555',
                      fontSize: '14px'
                    }}
                  >
                    {types.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ 
                  display: 'block', 
                  color: 'white', 
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    backgroundColor: '#404040',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #555',
                    fontSize: '14px',
                    height: '80px',
                    resize: 'vertical'
                  }}
                  required
                />
              </div>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '16px',
                marginBottom: '16px'
              }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    color: 'white', 
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    Duration
                  </label>
                  <input
                    type="text"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    placeholder="e.g., 30 min read"
                    style={{
                      width: '100%',
                      backgroundColor: '#404040',
                      color: 'white',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #555',
                      fontSize: '14px'
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    color: 'white', 
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    Level
                  </label>
                  <select
                    name="level"
                    value={formData.level}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      backgroundColor: '#404040',
                      color: 'white',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #555',
                      fontSize: '14px'
                    }}
                  >
                    {levels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Type-specific fields */}
              {formData.type === 'blog' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ 
                    display: 'block', 
                    color: 'white', 
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    Blog URL
                  </label>
                  <input
                    type="url"
                    name="blogUrl"
                    value={formData.blogUrl}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      backgroundColor: '#404040',
                      color: 'white',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #555',
                      fontSize: '14px'
                    }}
                    placeholder="https://example.com/blog-post"
                  />
                </div>
              )}

              {formData.type === 'video' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ 
                    display: 'block', 
                    color: 'white', 
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    Video URL
                  </label>
                  <input
                    type="url"
                    name="videoUrl"
                    value={formData.videoUrl}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      backgroundColor: '#404040',
                      color: 'white',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #555',
                      fontSize: '14px'
                    }}
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>
              )}

              {/* Image Upload */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ 
                  display: 'block', 
                  color: 'white', 
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Resource Image
                </label>
                {imagePreview && (
                  <div style={{ marginBottom: '8px' }}>
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      style={{
                        width: '128px',
                        height: '96px',
                        objectFit: 'cover',
                        borderRadius: '6px'
                      }}
                    />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{
                    width: '100%',
                    backgroundColor: '#404040',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #555',
                    fontSize: '14px'
                  }}
                  required={!editingResource}
                />
              </div>

              {/* PDF Upload for PDF type */}
              {formData.type === 'pdf' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ 
                    display: 'block', 
                    color: 'white', 
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    PDF File
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handlePdfChange}
                    style={{
                      width: '100%',
                      backgroundColor: '#404040',
                      color: 'white',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #555',
                      fontSize: '14px'
                    }}
                    required={!editingResource}
                  />
                  {pdfFile && (
                    <p style={{
                      color: '#10b981',
                      fontSize: '14px',
                      marginTop: '4px',
                      margin: '4px 0 0 0'
                    }}>
                      Selected: {pdfFile.name}
                    </p>
                  )}
                </div>
              )}

              <div style={{ 
                display: 'inline-flex', 
                gap: '16px', 
                paddingTop: '16px',
                marginTop: '16px',
                borderTop: '1px solid #555'
              }}>
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#7B2CBF',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#8E44AD'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#7B2CBF'}
                >
                  {editingResource ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  style={{
                    backgroundColor: '#6b7280',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#4b5563'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#6b7280'}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCreatorResources;