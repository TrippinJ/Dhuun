import React, { useState, useEffect } from 'react';
import { FaCheck, FaTimes, FaEye, FaMoneyBillWave } from 'react-icons/fa';
import API from '../../api/api';
import styles from '../../css/Admin/AdminWithdrawals.module.css';


const AdminWithdrawals = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  const [payoutReference, setPayoutReference] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get authentication token
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication required");
        setLoading(false);
        return;
      }

      // Use the correct API endpoint with authentication token
      const response = await API.get('/api/admin/withdrawals/pending');


      if (response.data.success) {
        setWithdrawals(response.data.withdrawals);
      } else {
        throw new Error(response.data.message || 'Failed to fetch withdrawals');
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      console.error('Error details:', error.response?.data || error.message);
      setError('Failed to load withdrawal requests');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setShowDetailsModal(true);
    setPayoutReference('');
    setAdminNotes('');
  };

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedWithdrawal(null);
  };

  const handleProcessWithdrawal = async (status) => {
    if (!selectedWithdrawal) return;

    try {
      setProcessingAction(true);

      // Get authentication token
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Authentication required. Please log in again.");
        setProcessingAction(false);
        return;
      }

      // Use the correct API endpoint with authentication token
      const response = await API.post('/api/admin/withdrawals/process', {
        withdrawalId: selectedWithdrawal._id,
        status,
        payoutReference: status === 'paid' ? payoutReference : undefined,
        adminNotes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        // Remove processed withdrawal from the list
        setWithdrawals(withdrawals.filter(w => w._id !== selectedWithdrawal._id));
        handleCloseModal();

        // Show success message
        alert(`Withdrawal ${status} successfully`);
      } else {
        throw new Error(response.data.message || `Failed to ${status} withdrawal`);
      }
    } catch (error) {
      console.error(`Error ${status} withdrawal:`, error);
      console.error('Error details:', error.response?.data || error.message);
      alert(error.response?.data?.message || error.message || `Failed to ${status} withdrawal`);
    } finally {
      setProcessingAction(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading withdrawal requests...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.withdrawalsContainer}>
      <div className={styles.withdrawalsHeader}>
        <h2>Pending Withdrawal Requests</h2>
        <button
          className={styles.refreshButton}
          onClick={fetchWithdrawals}
        >
          Refresh
        </button>
      </div>

      {withdrawals.length === 0 ? (
        <div className={styles.noWithdrawals}>
          <p>No pending withdrawal requests</p>
        </div>
      ) : (
        <div className={styles.withdrawalsTable}>
          <div className={styles.tableHeader}>
            <div className={styles.sellerColumn}>Seller</div>
            <div className={styles.amountColumn}>Amount</div>
            <div className={styles.methodColumn}>Method</div>
            <div className={styles.dateColumn}>Requested</div>
            <div className={styles.actionsColumn}>Actions</div>
          </div>

          {withdrawals.map((withdrawal) => (
            <div key={withdrawal._id} className={styles.tableRow}>
              <div className={styles.sellerColumn}>
                <div className={styles.sellerInfo}>
                  <span className={styles.sellerName}>{withdrawal.user.name}</span>
                  <span className={styles.sellerEmail}>{withdrawal.user.email}</span>
                </div>
              </div>

              <div className={styles.amountColumn}>
                ${withdrawal.amount.toFixed(2)}
              </div>

              <div className={styles.methodColumn}>
                {withdrawal.paymentMethod}
              </div>

              <div className={styles.dateColumn}>
                {new Date(withdrawal.requestDate).toLocaleDateString()}
              </div>

              <div className={styles.actionsColumn}>
                <button
                  className={styles.actionButton}
                  onClick={() => handleViewDetails(withdrawal)}
                >
                  <FaEye /> View
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Withdrawal Details Modal */}
      {showDetailsModal && selectedWithdrawal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Withdrawal Request Details</h3>
              <button
                className={styles.closeButton}
                onClick={handleCloseModal}
              >
                &times;
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.detailsSection}>
                <h4>Seller Information</h4>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Name:</span>
                  <span className={styles.detailValue}>{selectedWithdrawal.user.name}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Email:</span>
                  <span className={styles.detailValue}>{selectedWithdrawal.user.email}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Username:</span>
                  <span className={styles.detailValue}>{selectedWithdrawal.user.username}</span>
                </div>
              </div>

              <div className={styles.detailsSection}>
                <h4>Withdrawal Details</h4>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Amount:</span>
                  <span className={styles.detailValue}>${selectedWithdrawal.amount.toFixed(2)}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Method:</span>
                  <span className={styles.detailValue}>{selectedWithdrawal.paymentMethod}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Requested:</span>
                  <span className={styles.detailValue}>
                    {new Date(selectedWithdrawal.requestDate).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className={styles.detailsSection}>
                <h4>Payment Details</h4>
                {selectedWithdrawal.paymentMethod === "bank" && (
                  <>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Bank Name:</span>
                      <span className={styles.detailValue}>{selectedWithdrawal.payoutDetails?.bankName || 'Not provided'}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Account Name:</span>
                      <span className={styles.detailValue}>{selectedWithdrawal.payoutDetails?.accountName || 'Not provided'}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Account Number:</span>
                      <span className={styles.detailValue}>{selectedWithdrawal.payoutDetails?.accountNumber || 'Not provided'}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Swift Code:</span>
                      <span className={styles.detailValue}>{selectedWithdrawal.payoutDetails?.swiftCode || 'Not provided'}</span>
                    </div>
                  </>
                )}

                {selectedWithdrawal.paymentMethod === "paypal" && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>PayPal Email:</span>
                    <span className={styles.detailValue}>{selectedWithdrawal.payoutDetails?.paypalEmail || 'Not provided'}</span>
                  </div>
                )}

                {selectedWithdrawal.paymentMethod === "khalti" && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Khalti ID:</span>
                    <span className={styles.detailValue}>{selectedWithdrawal.payoutDetails?.khaltiId || 'Not provided'}</span>
                  </div>
                )}
              </div>

                
              <div className={styles.actionSection}>
                <div className={styles.formField}>
                  <label>Admin Notes:</label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes (optional)"
                    rows={3}
                  />
                </div>

                <div className={styles.formField}>
                  <label>Payout Reference (for completed withdrawals):</label>
                  <input
                    type="text"
                    value={payoutReference}
                    onChange={(e) => setPayoutReference(e.target.value)}
                    placeholder="Enter transaction ID or reference"
                  />
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.rejectButton}
                onClick={() => handleProcessWithdrawal('rejected')}
                disabled={processingAction}
              >
                <FaTimes /> Reject
              </button>

              <button
                className={styles.approveButton}
                onClick={() => handleProcessWithdrawal('approved')}
                disabled={processingAction}
              >
                <FaCheck /> Approve
              </button>

              <button
                className={styles.completeButton}
                onClick={() => handleProcessWithdrawal('paid')}
                disabled={processingAction || !payoutReference}
              >
                <FaMoneyBillWave /> Mark as Paid
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWithdrawals;