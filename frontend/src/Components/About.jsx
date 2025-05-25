import React from "react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../context/SettingsContext";
import AboutBackground from "../Assets/about-background.png";
import AboutBackgroundImage from "../Assets/utopiaposter.jpg";
import { BsFillPlayCircleFill } from "react-icons/bs";

const About = () => {
  const { settings, loading } = useSettings();
  const navigate = useNavigate();

  // Debug logging
  console.log("About component - Settings:", settings);
  console.log("About section image URL:", settings?.aboutSection?.image);

  const handleLearnMoreClick = () => {
    // Navigate to creator community page
    navigate("/creator-community");
  };

  // Show loading state if settings are still loading
  if (loading) {
    return (
      <div className="about-section-container">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Determine which image to use
  const aboutImage = settings?.aboutSection?.image && settings.aboutSection.image.trim() !== "" 
    ? settings.aboutSection.image 
    : AboutBackgroundImage;

  console.log("Final image URL to use:", aboutImage);

  return (
    <div className="about-section-container">
      
      <div className="about-section-image-container">
        <img 
          src={aboutImage}
          alt="About section background" 
          onError={(e) => {
            console.error("Error loading about image:", e.target.src);
            // Fallback to default image on error
            e.target.src = AboutBackgroundImage;
          }}
          onLoad={() => {
            console.log("About image loaded successfully:", aboutImage);
          }}
        />
      </div>
      <div className="about-section-text-container">
        {/* <p className="primary-subheading">About</p> */}
        <h1 className="primary-heading">
          {settings?.aboutSection?.title || "Explore The World wide Hits"}
        </h1>
        <p className="primary-text">
          {settings?.aboutSection?.description ||
            "Lorem ipsum dolor sit amet consectetur. Non tincidunt magna non et elit. Dolor turpis molestie dui magnis facilisis at fringilla quam."}
        </p>
        
        <div className="about-buttons-container">
          <button 
            className="secondary-button"
            onClick={handleLearnMoreClick}
          >
            Learn More
          </button>
          <button className="watch-video-button">
            <BsFillPlayCircleFill /> Watch Video
          </button>
        </div>
      </div>
    </div>
  );
};

export default About;