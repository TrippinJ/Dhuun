// CreatorCommunity.jsx - Fixed version with proper key props
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaPlay, FaDownload, FaExternalLinkAlt, FaGraduationCap, FaUser, FaClock } from 'react-icons/fa';
import API from '../api/api';
import styles from '../css/CreatorCommunity.module.css';

const CreatorCommunity = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All Courses');

  const categories = [
    'All Courses',
    'Beat Making',
    'Mixing & Mastering',
    'Music Theory',
    'Vocal Production',
    'Music Business'
  ];

  useEffect(() => {
    fetchResources();
  }, [selectedCategory]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const params = selectedCategory !== 'All Courses' ? `?category=${selectedCategory}` : '';
      const response = await API.get(`/api/creator-resources${params}`);
      
      if (response.data.success) {
        setResources(response.data.resources);
      } else {
        setError('Failed to load resources');
      }
    } catch (error) {
      console.error('Error fetching creator resources:', error);
      setError('Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'pdf':
        return <FaDownload />;
      case 'video':
        return <FaPlay />;
      case 'blog':
        return <FaExternalLinkAlt />;
      default:
        return <FaGraduationCap />;
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'Beginner':
        return '#1DB954';
      case 'Intermediate':
        return '#FFBA00';
      case 'Advanced':
        return '#FF1A1A';
      default:
        return '#7B2CBF';
    }
  };

  const handleResourceClick = (resource) => {
    if (resource.type === 'pdf' && resource.downloadUrl) {
      window.open(resource.downloadUrl, '_blank');
    } else if (resource.type === 'blog' && resource.blogUrl) {
      window.open(resource.blogUrl, '_blank');
    } else if (resource.type === 'video' && resource.videoUrl) {
      window.open(resource.videoUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading educational resources...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h3>Oops! Something went wrong</h3>
          <p>{error}</p>
          <button onClick={fetchResources} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header Section */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <FaGraduationCap className={styles.headerIcon} />
          <div>
            <h1>Creator Community</h1>
            <p>Level up your music production skills with our educational resources</p>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className={styles.categoryFilter}>
        <div className={styles.categoryTabs}>
          {categories.map((category) => (
            <button
              key={category} // ✅ FIXED: Added unique key prop
              className={`${styles.categoryTab} ${
                selectedCategory === category ? styles.activeCategory : ''
              }`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Resources Grid */}
      <div className={styles.resourcesSection}>
        {resources.length === 0 ? (
          <div className={styles.emptyState}>
            <FaGraduationCap className={styles.emptyIcon} />
            <h3>No resources found</h3>
            <p>
              {selectedCategory === 'All Courses'
                ? 'No educational resources are currently available.'
                : `No resources found for ${selectedCategory}.`}
            </p>
          </div>
        ) : (
          <div className={styles.resourcesGrid}>
            {resources.map((resource) => (
              <div
                key={resource._id} // ✅ FIXED: Added unique key prop
                className={styles.resourceCard}
                onClick={() => handleResourceClick(resource)}
              >
                <div className={styles.resourceImage}>
                  <img
                    src={resource.image}
                    alt={resource.title}
                    onError={(e) => {
                      e.target.src = '/default-resource.jpg';
                    }}
                  />
                  <div className={styles.resourceType}>
                    {getTypeIcon(resource.type)}
                    <span>{resource.type.toUpperCase()}</span>
                  </div>
                </div>

                <div className={styles.resourceContent}>
                  <div className={styles.resourceHeader}>
                    <h3 className={styles.resourceTitle}>{resource.title}</h3>
                    <div className={styles.resourceMeta}>
                      <span className={styles.instructor}>
                        <FaUser /> {resource.instructor}
                      </span>
                      <span className={styles.duration}>
                        <FaClock /> {resource.duration}
                      </span>
                    </div>
                  </div>

                  <p className={styles.resourceDescription}>
                    {resource.description}
                  </p>

                  <div className={styles.resourceFooter}>
                    <span className={styles.category}>{resource.category}</span>
                    <span
                      className={styles.level}
                      style={{ backgroundColor: getLevelColor(resource.level) }}
                    >
                      {resource.level}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Call to Action */}
      <div className={styles.ctaSection}>
        <div className={styles.ctaContent}>
          <h2>Ready to Create Your Next Hit?</h2>
          <p>Apply what you've learned and start making beats on Dhuun</p>
          <div className={styles.ctaButtons}>
            <Link to="/BeatExplorePage" className={styles.primaryButton}>
              Explore Beats
            </Link>
            <Link to="/dashboard" className={styles.secondaryButton}>
              Start Creating
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorCommunity;