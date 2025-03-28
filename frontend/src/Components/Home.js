import React from "react";
import { useNavigate } from "react-router-dom";
import BannerBackground from "../Assets/home-banner-background.png";
import BannerImage from "../Assets/tc.png";
import { FiArrowRight } from "react-icons/fi";
import TrendingBeats from "./TrendingBeats";
import ProducersCarousel from "./ProducersCarousel";

const Home = () => {
  const navigate = useNavigate();

  const handleExploreBtnClick = () => {
    navigate("/explore");
  };

  return (
    <div className="home-container">
      {/* Banner Section */}
      <div className="home-banner-container">
        <div className="home-bannerImage-container">
          <img src={BannerBackground} alt="Background pattern" />
        </div>
        <div className="left-bannerImage-container">
          <img src={BannerBackground} alt="Background pattern" />
        </div>
        <div className="home-text-section">
          <h1 className="primary-heading">
            Explore Beats For Your Taste
          </h1>
          <p className="primary-text">
            Big Beat libraries for you to create new Hits.
          </p>
          <button className="secondary-button" onClick={handleExploreBtnClick}>
            Explore Beats <FiArrowRight />{" "}
          </button>
        </div>
        <div className="home-image-section">
          <img src={BannerImage} alt="Music artist" />
        </div>
      </div>
      
      {/* Featured Producers Carousel */}
      <div className="TrendingBeats_trendingSection__v1AdW">
        <ProducersCarousel />
      </div>
      
      {/* Trending Beats Section (original component) */}
      <div className="FeaturedBeatsCarousel_carouselContainer__JQW43">
        <TrendingBeats />
      </div>
    </div>
  );
};

export default Home;