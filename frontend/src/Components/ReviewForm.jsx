
import React, { useState } from 'react';
import { FaStar, FaRegStar } from 'react-icons/fa';
import API from '../api/api';
import styles from '../css/ReviewForm.module.css';

const ReviewForm = ({ beat, orderId, onReviewSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRatingClick = (selectedRating) => {
    setRating(selectedRating);
  };

  const handleMouseEnter = (hoveredRating) => {
    setHoverRating(hoveredRating);
  };

  const handleMouseLeave = () => {
    setHoverRating(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate inputs
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }
    
    if (!text.trim()) {
      setError('Please provide review text');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      // Submit review to API
      const response = await API.post('/api/reviews', {
        beatId: beat._id,
        orderId,
        rating,
        title,
        text
      });
      
      if (response.data.success) {
        setSuccess('Your review has been submitted and is pending approval. Thank you!');
        setRating(0);
        setTitle('');
        setText('');
        
        // Call callback if provided
        if (onReviewSubmitted) {
          onReviewSubmitted(response.data.review);
        }
      } else {
        setError(response.data.message || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      setError(error.response?.data?.message || 'Failed to submit review. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.reviewFormContainer}>
      <h3 className={styles.reviewFormTitle}>Rate and Review Your Purchase</h3>
      
      {success ? (
        <div className={styles.successMessage}>{success}</div>
      ) : (
        <form onSubmit={handleSubmit} className={styles.reviewForm}>
          <div className={styles.beatInfo}>
            <img 
              src={beat.coverImage || "/default-cover.jpg"} 
              alt={beat.title} 
              className={styles.beatCover}
            />
            <div className={styles.beatDetails}>
              <h4>{beat.title}</h4>
              <p>by {beat.producer?.name || 'Unknown Producer'}</p>
            </div>
          </div>
          
          <div className={styles.ratingContainer}>
            <label>Your Rating:</label>
            <div className={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <span 
                  key={star}
                  onClick={() => handleRatingClick(star)}
                  onMouseEnter={() => handleMouseEnter(star)}
                  onMouseLeave={handleMouseLeave}
                  className={styles.starIcon}
                >
                  {star <= (hoverRating || rating) ? <FaStar /> : <FaRegStar />}
                </span>
              ))}
            </div>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="review-title">Title (optional):</label>
            <input
              type="text"
              id="review-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your review"
              className={styles.titleInput}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="review-text">Your Review:</label>
            <textarea
              id="review-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Share your experience with this beat"
              className={styles.reviewTextarea}
              rows={4}
              required
            />
          </div>
          
          {error && <div className={styles.errorMessage}>{error}</div>}
          
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      )}
    </div>
  );
};

export default ReviewForm;