import React, { useState, useEffect } from "react";
import '../css/Landingpage.css';
import ProfilePic from "../Assets/john-doe-image.png";
import { AiFillStar, AiOutlineStar } from "react-icons/ai";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import API from "../api/api";

const Testimonial = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fallback testimonials when no reviews exist yet
  const fallbackTestimonials = [
    {
      _id: "fallback1",
      user: { name: "John Doe", avatar: null },
      rating: 5,
      text: "Amazing beats! The quality is top-notch and exactly what I was looking for. Highly recommend this platform for any producer or artist.",
      beat: { title: "Summer Vibes" }
    },
    {
      _id: "fallback2", 
      user: { name: "Sarah Johnson", avatar: null },
      rating: 5,
      text: "Found the perfect beat for my track. The licensing process was smooth and the customer service was excellent!",
      beat: { title: "Midnight Dreams" }
    },
    {
      _id: "fallback3",
      user: { name: "Mike Producer", avatar: null },
      rating: 4,
      text: "Great selection of beats from talented producers. The platform is easy to use and the quality is consistent.",
      beat: { title: "Trap Nation" }
    }
  ];

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        setLoading(true);
        const response = await API.get('/api/reviews/testimonials');
        
        if (response.data.success && response.data.testimonials.length > 0) {
          setTestimonials(response.data.testimonials);
        } else {
          // Use fallback testimonials if no approved reviews exist
          setTestimonials(fallbackTestimonials);
        }
      } catch (error) {
        console.error('Error fetching testimonials:', error);
        // Use fallback testimonials on error
        setTestimonials(fallbackTestimonials);
      } finally {
        setLoading(false);
      }
    };

    fetchTestimonials();
  }, []);

  // Auto-advance testimonials every 5 seconds
  useEffect(() => {
    if (testimonials.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => 
          prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1
        );
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [testimonials.length]);

  const nextTestimonial = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevTestimonial = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? testimonials.length - 1 : prevIndex - 1
    );
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <span key={index}>
        {index < rating ? <AiFillStar /> : <AiOutlineStar />}
      </span>
    ));
  };

  if (loading) {
    return (
      <div className="work-section-wrapper">
        <div className="work-section-top">
          <p className="primary-subheading">Testimonial</p>
          <h1 className="primary-heading">What They Are Saying</h1>
          <p className="primary-text">
            Real reviews from real customers who found their perfect beats on our platform.
          </p>
        </div>
        <div className="testimonial-section-bottom">
          <p>Loading testimonials...</p>
        </div>
      </div>
    );
  }

  const currentTestimonial = testimonials[currentIndex];

  return (
    <div className="work-section-wrapper">
      <div className="work-section-top">
        <p className="primary-subheading">Testimonial</p>
        <h1 className="primary-heading">What They Are Saying</h1>
        <p className="primary-text">
          Reviews from customers who found their perfect beats on our platform.
        </p>
      </div>
      
      <div className="testimonial-section-bottom">
        {/* Navigation Arrows */}
        {testimonials.length > 1 && (
          <>
            <button 
              className="testimonial-nav-button testimonial-prev"
              onClick={prevTestimonial}
              aria-label="Previous testimonial"
            >
              <FaChevronLeft />
            </button>
            <button 
              className="testimonial-nav-button testimonial-next"
              onClick={nextTestimonial}
              aria-label="Next testimonial"
            >
              <FaChevronRight />
            </button>
          </>
        )}

        {/* User Avatar */}
        <img 
          src={currentTestimonial.user?.avatar || ProfilePic} 
          alt={currentTestimonial.user?.name || "Customer"}
          onError={(e) => {
            e.target.src = ProfilePic;
          }}
        />
        
        {/* Review Text */}
        <p>"{currentTestimonial.text}"</p>
        
        {/* Star Rating */}
        <div className="testimonials-stars-container">
          {renderStars(currentTestimonial.rating)}
        </div>
        
        {/* User Name */}
        <h2>{currentTestimonial.user?.name || "Anonymous"}</h2>
        
        {/* Beat Information (optional) */}
        {currentTestimonial.beat?.title && (
          <p className="testimonial-beat-info">
            Review for: "{currentTestimonial.beat.title}"
          </p>
        )}

        {/* Indicators */}
        {testimonials.length > 1 && (
          <div className="testimonial-indicators">
            {testimonials.map((_, index) => (
              <button
                key={index}
                className={`testimonial-indicator ${index === currentIndex ? 'active' : ''}`}
                onClick={() => setCurrentIndex(index)}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Testimonial;