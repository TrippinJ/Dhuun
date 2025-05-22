import React, { useState, useEffect } from 'react';
import { FaCheck, FaTimes, FaEye, FaStar, FaRegStar } from 'react-icons/fa';
import API from '../../api/api';
import styles from '../../css/Admin/AdminReviews.module.css';

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [processing, setProcessing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('pending');

  useEffect(() => {
    fetchReviews();
  }, [statusFilter]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await API.get(`/api/reviews/admin?status=${statusFilter}`);
      setReviews(response.data.reviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setError('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (review) => {
    setSelectedReview(review);
    setShowModal(true);
    setAdminNote('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedReview(null);
    setAdminNote('');
  };

  const handleApproval = async (status) => {
    try {
      setProcessing(true);
      await API.patch(`/api/reviews/admin/${selectedReview._id}`, {
        status,
        adminNote
      });
      
      // Remove from current list
      setReviews(reviews.filter(r => r._id !== selectedReview._id));
      setShowModal(false);
      setAdminNote('');
      
      // Show success message
      alert(`Review ${status} successfully`);
    } catch (error) {
      console.error('Error updating review:', error);
      alert('Failed to update review');
    } finally {
      setProcessing(false);
    }
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <span key={index} className={styles.star}>
        {index < rating ? <FaStar /> : <FaRegStar />}
      </span>
    ));
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'approved': return styles.approved;
      case 'rejected': return styles.rejected;
      default: return styles.pending;
    }
  };

  if (loading) return <div className={styles.loading}>Loading reviews...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.reviewsContainer}>
      <div className={styles.reviewsHeader}>
        <h2>Reviews Management</h2>
        <div className={styles.filterContainer}>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className={styles.statusFilter}
          >
            <option value="pending">Pending Reviews</option>
            <option value="approved">Approved Reviews</option>
            <option value="rejected">Rejected Reviews</option>
          </select>
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className={styles.noReviews}>
          <p>No {statusFilter} reviews found</p>
        </div>
      ) : (
        <div className={styles.reviewsTable}>
          <div className={styles.tableHeader}>
            <div className={styles.userColumn}>User</div>
            <div className={styles.beatColumn}>Beat</div>
            <div className={styles.ratingColumn}>Rating</div>
            <div className={styles.dateColumn}>Date</div>
            <div className={styles.statusColumn}>Status</div>
            <div className={styles.actionsColumn}>Actions</div>
          </div>

          {reviews.map((review) => (
            <div key={review._id} className={styles.tableRow}>
              <div className={styles.userColumn}>
                <div className={styles.userInfo}>
                  <span className={styles.userName}>{review.user.name}</span>
                  <span className={styles.userEmail}>{review.user.email}</span>
                </div>
              </div>

              <div className={styles.beatColumn}>
                <span className={styles.beatTitle}>{review.beat?.title || 'Unknown Beat'}</span>
              </div>

              <div className={styles.ratingColumn}>
                <div className={styles.starsContainer}>
                  {renderStars(review.rating)}
                  <span className={styles.ratingNumber}>({review.rating})</span>
                </div>
              </div>

              <div className={styles.dateColumn}>
                {new Date(review.createdAt).toLocaleDateString()}
              </div>

              <div className={styles.statusColumn}>
                <span className={`${styles.statusTag} ${getStatusColor(review.status)}`}>
                  {review.status}
                </span>
              </div>

              <div className={styles.actionsColumn}>
                <button
                  className={styles.actionButton}
                  onClick={() => handleViewDetails(review)}
                >
                  <FaEye /> View
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Details Modal */}
      {showModal && selectedReview && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Review Details</h3>
              <button
                className={styles.closeButton}
                onClick={handleCloseModal}
              >
                &times;
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.reviewInfo}>
                <div className={styles.infoRow}>
                  <strong>User:</strong> {selectedReview.user.name} ({selectedReview.user.email})
                </div>
                <div className={styles.infoRow}>
                  <strong>Beat:</strong> {selectedReview.beat?.title || 'Unknown Beat'}
                </div>
                <div className={styles.infoRow}>
                  <strong>Rating:</strong> 
                  <div className={styles.starsContainer}>
                    {renderStars(selectedReview.rating)}
                    <span>({selectedReview.rating}/5)</span>
                  </div>
                </div>
                <div className={styles.infoRow}>
                  <strong>Date:</strong> {new Date(selectedReview.createdAt).toLocaleString()}
                </div>
                {selectedReview.title && (
                  <div className={styles.infoRow}>
                    <strong>Title:</strong> {selectedReview.title}
                  </div>
                )}
                <div className={styles.reviewTextContainer}>
                  <strong>Review:</strong>
                  <p className={styles.reviewText}>{selectedReview.text}</p>
                </div>
              </div>

              {selectedReview.status === 'pending' && (
                <div className={styles.adminActions}>
                  <div className={styles.adminNoteContainer}>
                    <label htmlFor="adminNote">Admin Note (optional):</label>
                    <textarea
                      id="adminNote"
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="Add any notes about this review..."
                      className={styles.adminNoteInput}
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {selectedReview.adminNote && (
                <div className={styles.existingAdminNote}>
                  <strong>Admin Note:</strong>
                  <p>{selectedReview.adminNote}</p>
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              {selectedReview.status === 'pending' ? (
                <>
                  <button
                    className={styles.rejectButton}
                    onClick={() => handleApproval('rejected')}
                    disabled={processing}
                  >
                    <FaTimes /> Reject
                  </button>
                  <button
                    className={styles.approveButton}
                    onClick={() => handleApproval('approved')}
                    disabled={processing}
                  >
                    <FaCheck /> Approve
                  </button>
                </>
              ) : (
                <button
                  className={styles.closeModalButton}
                  onClick={handleCloseModal}
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReviews;