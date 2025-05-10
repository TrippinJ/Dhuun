
import React, { useState, useEffect } from 'react';
import { FaCheck, FaTimes, FaEye } from 'react-icons/fa';
import API from '../../api/api';
import styles from '../../css/Admin/AdminDocumentVerification.module.css';

const AdminDocumentVerification = () => {
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPendingVerifications();
  }, []);

  const fetchPendingVerifications = async () => {
    try {
      setLoading(true);
      const response = await API.get('/api/admin/verification/pending');
      setVerifications(response.data.verifications);
    } catch (error) {
      console.error('Error fetching verifications:', error);
      setError('Failed to load verifications');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (verification) => {
    setSelectedVerification(verification);
    setShowModal(true);
  };

  const handleApproval = async (status) => {
    try {
      setProcessing(true);
      await API.post('/api/admin/verification/update', {
        verificationId: selectedVerification._id,
        status,
        adminNotes
      });
      
      // Remove from list
      setVerifications(verifications.filter(v => v._id !== selectedVerification._id));
      setShowModal(false);
      setAdminNotes('');
    } catch (error) {
      console.error('Error updating verification:', error);
      alert('Failed to update verification');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.container}>
      <h2>Pending Document Verifications</h2>
      
      {verifications.length === 0 ? (
        <p>No pending verifications</p>
      ) : (
        <div className={styles.table}>
          <div className={styles.tableHeader}>
            <div>User</div>
            <div>Submitted</div>
            <div>Documents</div>
            <div>Actions</div>
          </div>
          
          {verifications.map(verification => (
            <div key={verification._id} className={styles.tableRow}>
              <div>
                <div>{verification.user.name}</div>
                <div className={styles.email}>{verification.user.email}</div>
              </div>
              <div>{new Date(verification.submittedDate).toLocaleDateString()}</div>
              <div>{verification.documents.length} documents</div>
              <div>
                <button onClick={() => handleViewDetails(verification)}>
                  <FaEye /> View
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Verification Modal */}
      {showModal && selectedVerification && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Review Verification Documents</h3>
            
            <div className={styles.userInfo}>
              <p><strong>User:</strong> {selectedVerification.user.name}</p>
              <p><strong>Email:</strong> {selectedVerification.user.email}</p>
            </div>

            <div className={styles.documents}>
              {selectedVerification.documents.map((doc, index) => (
                <div key={index} className={styles.document}>
                  <h4>{doc.type} Document</h4>
                  <img src={doc.fileUrl} alt={doc.type} />
                  <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                    View Full Size
                  </a>
                </div>
              ))}
            </div>

            <div className={styles.adminNotes}>
              <label>Admin Notes:</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add any notes..."
              />
            </div>

            <div className={styles.actions}>
              <button onClick={() => setShowModal(false)}>Cancel</button>
              <button 
                onClick={() => handleApproval('rejected')}
                disabled={processing}
                className={styles.reject}
              >
                <FaTimes /> Reject
              </button>
              <button 
                onClick={() => handleApproval('approved')}
                disabled={processing}
                className={styles.approve}
              >
                <FaCheck /> Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDocumentVerification;