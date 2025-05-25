import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavbarBeatExplore from '../Components/NavbarBeatExplore';
import styles from "../css/CreatorCommunity.module.css";
import { FaDownload, FaEye, FaChevronLeft, FaChevronRight, FaFileAlt, FaBook } from "react-icons/fa";
import API from "../api/api";

const CreatorCommunity = () => {
  const navigate = useNavigate();
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Define resource categories
  const categories = [
    "All Courses",
    "Mixing & Mastering",
    "Beat Making",
    "Music Theory",
    "Vocal Production",
    "Music Business"
  ];

  useEffect(() => {
    fetchResources();
  }, [currentCategoryIndex]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const category = categories[currentCategoryIndex];
      const response = await API.get(`/api/creator-resources?category=${encodeURIComponent(category)}`);
      
      if (response.data.success) {
        setResources(response.data.resources);
      } else {
        throw new Error('Failed to fetch resources');
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
      setError('Failed to load educational resources');
    } finally {
      setLoading(false);
    }
  };

  // Functions to navigate carousel
  const nextCategory = () => {
    setCurrentCategoryIndex((prevIndex) => 
      prevIndex === categories.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevCategory = () => {
    setCurrentCategoryIndex((prevIndex) => 
      prevIndex === 0 ? categories.length - 1 : prevIndex - 1
    );
  };

  // Handle resource selection
  const handleResourceSelect = (resource) => {
    if (resource.type === 'pdf') {
      // Open PDF in new tab or download
      window.open(resource.downloadUrl, '_blank');
    } else if (resource.type === 'blog') {
      // Navigate to blog post or open URL
      if (resource.blogUrl.startsWith('http')) {
        window.open(resource.blogUrl, '_blank');
      } else {
        navigate(resource.blogUrl);
      }
    }
  };

  // Get icon based on resource type
  const getResourceIcon = (type) => {
    switch (type) {
      case 'pdf':
        return <FaFileAlt />;
      case 'blog':
        return <FaBook />;
      default:
        return <FaEye />;
    }
  };

  // Get action button based on resource type
  const getActionButton = (resource) => {
    if (resource.type === 'pdf') {
      return (
        <button
          className={styles.actionButton}
          onClick={(e) => {
            e.stopPropagation();
            handleResourceSelect(resource);
          }}
        >
          <FaDownload /> Download
        </button>
      );
    } else {
      return (
        <button
          className={styles.actionButton}
          onClick={(e) => {
            e.stopPropagation();
            handleResourceSelect(resource);
          }}
        >
          <FaEye /> Read
        </button>
      );
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <NavbarBeatExplore />
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading educational resources...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <NavbarBeatExplore />
        <div className={styles.errorContainer}>
          <p className={styles.errorMessage}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <NavbarBeatExplore />
      
      <div className={styles.heroSection}>
        <h1>Creator Community</h1>
        <p>Learn essential music production skills with our curated educational resources</p>
      </div>
      
      <div className={styles.categorySection}>
        <div className={styles.categoryNavigation}>
          <h2>Educational Resources</h2>
          <div className={styles.categoryButtons}>
            <button 
              className={styles.navButton} 
              onClick={prevCategory}
            >
              <FaChevronLeft />
            </button>
            <span className={styles.categoryName}>{categories[currentCategoryIndex]}</span>
            <button 
              className={styles.navButton} 
              onClick={nextCategory}
            >
              <FaChevronRight />
            </button>
          </div>
        </div>
        
        {/* Category tabs for quick selection */}
        <div className={styles.categoryTabs}>
          {categories.map((category, index) => (
            <button
              key={category}
              className={`${styles.categoryTab} ${index === currentCategoryIndex ? styles.activeTab : ''}`}
              onClick={() => setCurrentCategoryIndex(index)}
            >
              {category}
            </button>
          ))}
        </div>
        
        <div className={styles.resourcesGrid}>
          {resources.length > 0 ? (
            resources.map((resource) => (
              <div 
                key={resource.id} 
                className={styles.resourceCard}
                onClick={() => handleResourceSelect(resource)}
              >
                <div className={styles.resourceImageContainer}>
                  <img 
                    src={resource.image} 
                    alt={resource.title} 
                    className={styles.resourceImage}
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop';
                    }}
                  />
                  <div className={styles.resourceOverlay}>
                    <div className={styles.resourceType}>
                      {getResourceIcon(resource.type)}
                      <span>{resource.type.toUpperCase()}</span>
                    </div>
                  </div>
                </div>
                <div className={styles.resourceInfo}>
                  <h3 className={styles.resourceTitle}>{resource.title}</h3>
                  <p className={styles.instructorName}>by {resource.instructor}</p>
                  <p className={styles.resourceDescription}>{resource.description}</p>
                  <div className={styles.resourceMetadata}>
                    <span className={styles.duration}>{resource.duration}</span>
                    <span className={`${styles.level} ${styles[resource.level.toLowerCase()]}`}>
                      {resource.level}
                    </span>
                  </div>
                  <div className={styles.resourceActions}>
                    {getActionButton(resource)}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.noResourcesMessage}>
              <p>No resources available in this category yet.</p>
              <button 
                className={styles.browseButton}
                onClick={nextCategory}
              >
                Browse other categories
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className={styles.communitySection}>
        <h2>Learn & Grow</h2>
        <p>Access professional knowledge to elevate your music production skills</p>
        <div className={styles.featureCards}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>📚</div>
            <h3>Learn</h3>
            <p>Access guides and tutorials from industry professionals</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🎛️</div>
            <h3>Practice</h3>
            <p>Apply techniques with hands-on exercises and examples</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🚀</div>
            <h3>Master</h3>
            <p>Build expertise through comprehensive learning resources</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorCommunity;