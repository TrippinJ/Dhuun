import React from "react";
import { useSettings } from "../context/SettingsContext";
import AboutBackground from "../Assets/about-background.png";
import AboutBackgroundImage from "../Assets/utopiaposter.jpg";
import { BsFillPlayCircleFill } from "react-icons/bs";

const About = () => {
const { settings } = useSettings();

  return (
    <div className="about-section-container">
      <div className="about-background-image-container">
        <img src={AboutBackground} alt="" />
      </div>
      <div className="about-section-image-container">
        <img src={AboutBackgroundImage} alt="" />
      </div>
      <div className="about-section-text-container">
        <p className="primary-subheading">About</p>
        <h1 className="primary-heading">
          {settings.aboutSection?.title || "Explore The World wide Hits"}
        </h1>
        <p className="primary-text">
          {settings.aboutSection?.description ||
            "Lorem ipsum dolor sit amet consectetur. Non tincidunt magna non et elit. Dolor turpis molestie dui magnis facilisis at fringilla quam."}
        </p>
        
        <div className="about-buttons-container">
          <button className="secondary-button">Learn More</button>
          <button className="watch-video-button">
            <BsFillPlayCircleFill /> Watch Video
          </button>
        </div>
      </div>
    </div>
  );
};

export default About;