import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavbarBeatExplore from '../Components/NavbarBeatExplore';
import styles from "../css/CreatorCommunity.module.css";
import { FaPlay, FaPause, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import API from "../api/api";

const CreatorCommunity = () => {
  const navigate = useNavigate();
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [audioPlayer, setAudioPlayer] = useState(new Audio());

  // Define course categories - add "All Courses" as the first option
  const categories = [
    "All Courses", // Added this option
    "Mixing & Mastering",
    "Beat Making",
    "Music Theory",
    "Vocal Production",
    "Music Business"
  ];

  useEffect(() => {
    // Simulated courses data
    // In a real app, you would fetch this from your API
    const sampleCourses = [
      {
        id: "course1",
        title: "Mixing Vocals Like a Pro",
        instructor: "DJ Mixer",
        category: "Mixing & Mastering",
        image: "https://via.placeholder.com/300x200",
        previewAudio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        duration: "1h 45m",
        level: "Intermediate"
      },
      {
        id: "course2",
        title: "Beat Production Fundamentals",
        instructor: "Beat Master",
        category: "Beat Making",
        image: "https://via.placeholder.com/300x200",
        previewAudio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        duration: "2h 30m",
        level: "Beginner"
      },
      {
        id: "course3",
        title: "Music Theory for Producers",
        instructor: "Theory Expert",
        category: "Music Theory",
        image: "https://via.placeholder.com/300x200",
        previewAudio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
        duration: "3h 15m",
        level: "Intermediate"
      },
      {
        id: "course4",
        title: "Trap Beat Mastery",
        instructor: "Trap King",
        category: "Beat Making",
        image: "https://via.placeholder.com/300x200",
        previewAudio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
        duration: "2h 10m",
        level: "Advanced"
      },
      {
        id: "course5",
        title: "Auto-Tune & Vocal Effects",
        instructor: "Voice Master",
        category: "Vocal Production",
        image: "https://via.placeholder.com/300x200",
        previewAudio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
        duration: "1h 30m",
        level: "Intermediate"
      },
      {
        id: "course6",
        title: "Music Licensing 101",
        instructor: "Legal Eagle",
        category: "Music Business",
        image: "https://via.placeholder.com/300x200",
        previewAudio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
        duration: "1h 15m",
        level: "Beginner"
      }
    ];

    // Simulate API fetch delay
    setTimeout(() => {
      setCourses(sampleCourses);
      setLoading(false);
    }, 1000);

    // Cleanup audio when component unmounts
    return () => {
      if (audioPlayer) {
        audioPlayer.pause();
        audioPlayer.src = "";
      }
    };
  }, []);

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

  // Get courses for the current category or all courses if "All Courses" is selected
  const currentCategoryCourses = categories[currentCategoryIndex] === "All Courses" 
    ? courses 
    : courses.filter(course => course.category === categories[currentCategoryIndex]);

  // Handle audio playback
  const handlePlayPreview = (courseId, audioUrl) => {
    if (currentlyPlaying === courseId) {
      // If already playing this course, pause it
      audioPlayer.pause();
      setCurrentlyPlaying(null);
    } else {
      // If playing something else, stop that and play this
      audioPlayer.pause();
      audioPlayer.src = audioUrl;
      audioPlayer.play()
        .then(() => {
          setCurrentlyPlaying(courseId);
        })
        .catch(error => {
          console.error("Error playing audio:", error);
        });
    }

    // Add ended event listener to reset the currently playing state
    audioPlayer.onended = () => {
      setCurrentlyPlaying(null);
    };
  };

  // Handle course selection
  const handleCourseSelect = (courseId) => {
    // Navigate to course detail page (to be implemented)
    console.log(`Navigating to course ${courseId}`);
    // navigate(`/course/${courseId}`);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <NavbarBeatExplore />
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading courses...</p>
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
        <p>Learn, collaborate, and grow with our community of music producers and artists</p>
      </div>
      
      <div className={styles.categorySection}>
        <div className={styles.categoryNavigation}>
          <h2>Explore Courses</h2>
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
        
        {/* Add category tabs for quick selection */}
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
        
        <div className={styles.coursesGrid}>
          {currentCategoryCourses.length > 0 ? (
            currentCategoryCourses.map((course) => (
              <div 
                key={course.id} 
                className={styles.courseCard}
                onClick={() => handleCourseSelect(course.id)}
              >
                <div className={styles.courseImageContainer}>
                  <img 
                    src={course.image} 
                    alt={course.title} 
                    className={styles.courseImage} 
                  />
                  <div className={styles.courseOverlay}>
                    <button
                      className={styles.playButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayPreview(course.id, course.previewAudio);
                      }}
                    >
                      {currentlyPlaying === course.id ? <FaPause /> : <FaPlay />}
                    </button>
                  </div>
                </div>
                <div className={styles.courseInfo}>
                  <h3 className={styles.courseTitle}>{course.title}</h3>
                  <p className={styles.instructorName}>by {course.instructor}</p>
                  <div className={styles.courseMetadata}>
                    <span className={styles.duration}>{course.duration}</span>
                    <span className={`${styles.level} ${styles[course.level.toLowerCase()]}`}>
                      {course.level}
                    </span>
                  </div>
                  <span className={styles.courseCategory}>{course.category}</span>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.noCoursesMessage}>
              <p>No courses available in this category yet.</p>
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
        <h2>Join Our Community</h2>
        <p>Connect with like-minded creators, share your work, and get feedback</p>
        <div className={styles.featureCards}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🎓</div>
            <h3>Learn</h3>
            <p>Access courses from industry professionals</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>👥</div>
            <h3>Collaborate</h3>
            <p>Find partners for your next hit track</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🚀</div>
            <h3>Grow</h3>
            <p>Build your skills and your audience</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorCommunity;