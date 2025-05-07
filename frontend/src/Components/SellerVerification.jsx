import React, { useState, useEffect } from "react";
import { FaIdCard, FaHome, FaUniversity, FaFileInvoiceDollar, FaUpload, FaCheck, FaTimes } from "react-icons/fa";
import API from "../api/api";
import styles from "../css/SellerVerification.module.css";

const SellerVerification = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState("not_submitted");
  const [documents, setDocuments] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState({
    idDocument: null,
    addressDocument: null,
    bankDocument: null,
    taxDocument: null
  });
  const [paymentDetails, setPaymentDetails] = useState({
    paymentMethod: "bank",
    bankName: "",
    accountNumber: "",
    accountName: "",
    paypalEmail: "",
    khaltiId: ""
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fetch verification status
  useEffect(() => {
    const fetchVerificationStatus = async () => {
      try {
        setLoading(true);
        const response = await API.get("/api/verification/status");
        
        setVerificationStatus(response.data.status);
        if (response.data.documents) {
          setDocuments(response.data.documents);
        }
        if (response.data.payoutDetails) {
          setPaymentDetails(prev => ({
            ...prev,
            ...response.data.payoutDetails
          }));
        }
      } catch (error) {
        console.error("Error fetching verification status:", error);
        setError("Failed to load verification status. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchVerificationStatus();
  }, []);

  // Handle file selection
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setSelectedFiles({
        ...selectedFiles,
        [name]: files[0]
      });
    }
  };

  // Handle payment details change
  const handlePaymentDetailsChange = (e) => {
    const { name, value } = e.target;
    setPaymentDetails({
      ...paymentDetails,
      [name]: value
    });
  };

  // Submit verification documents
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required files
    if (!selectedFiles.idDocument && !documents.some(doc => doc.type === 'id')) {
      setError("ID document is required");
      return;
    }
    
    // Validate payment details
    if (paymentDetails.paymentMethod === 'bank') {
      if (!paymentDetails.bankName || !paymentDetails.accountNumber || !paymentDetails.accountName) {
        setError("Bank details are required for bank transfers");
        return;
      }
    } else if (paymentDetails.paymentMethod === 'paypal' && !paymentDetails.paypalEmail) {
      setError("PayPal email is required for PayPal withdrawals");
      return;
    } else if (paymentDetails.paymentMethod === 'khalti' && !paymentDetails.khaltiId) {
      setError("Khalti ID is required for Khalti withdrawals");
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);
      
      // Create form data
      const formData = new FormData();
      
      // Add selected files
      Object.entries(selectedFiles).forEach(([key, file]) => {
        if (file) formData.append(key, file);
      });
      
      // Add payment details
      Object.entries(paymentDetails).forEach(([key, value]) => {
        formData.append(key, value);
      });
      
      // Submit verification
      const response = await API.post("/api/verification/submit", formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setSuccess("Verification documents submitted successfully");
      setVerificationStatus("pending");
      
      // Reset file selections
      setSelectedFiles({
        idDocument: null,
        addressDocument: null,
        bankDocument: null,
        taxDocument: null
      });
      
      // Update documents list
      if (response.data.verification && response.data.verification.documents) {
        setDocuments(response.data.verification.documents);
      }
    } catch (error) {
      console.error("Error submitting verification:", error);
      setError(error.response?.data?.message || "Failed to submit verification documents");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading verification status...</div>;
  }

  return (
    <div className={styles.verificationContainer}>
      <h2 className={styles.sectionTitle}>Account Verification</h2>
      
      {/* Status Banner */}
      <div className={`${styles.statusBanner} ${styles[verificationStatus]}`}>
        {verificationStatus === "approved" && (
          <>
            <FaCheck className={styles.statusIcon} />
            <span>Your account is verified! You can now request withdrawals.</span>
          </>
        )}
        {verificationStatus === "pending" && (
          <>
            <div className={styles.pendingIcon}></div>
            <span>Your verification is pending review. This usually takes 1-2 business days.</span>
          </>
        )}
        {verificationStatus === "rejected" && (
          <>
            <FaTimes className={styles.statusIcon} />
            <span>Your verification was rejected. Please review the requirements and try again.</span>
          </>
        )}
        {verificationStatus === "not_submitted" && (
          <>
            <FaIdCard className={styles.statusIcon} />
            <span>Please submit your verification documents to enable withdrawals.</span>
          </>
        )}
      </div>
      
      {error && <div className={styles.errorMessage}>{error}</div>}
      {success && <div className={styles.successMessage}>{success}</div>}
      
      {/* Verification Form */}
      {verificationStatus !== "approved" && (
        <form onSubmit={handleSubmit} className={styles.verificationForm}>
          <div className={styles.formSection}>
            <h3>Identity Documents</h3>
            <p className={styles.sectionDescription}>
              Please provide clear, legible documents that match your account details.
            </p>
            
            <div className={styles.documentUploads}>
              {/* ID Document */}
              <div className={styles.documentUpload}>
                <div className={styles.documentHeader}>
                  <FaIdCard className={styles.documentIcon} />
                  <h4>ID Document</h4>
                  <span className={styles.requiredBadge}>Required</span>
                </div>
                
                {documents.some(doc => doc.type === 'id') ? (
                  <div className={styles.uploadedDocument}>
                    <FaCheck className={styles.uploadedIcon} />
                    <span>ID Document uploaded</span>
                  </div>
                ) : (
                  <div className={styles.uploadControl}>
                    <label className={styles.fileInput}>
                      <input
                        type="file"
                        name="idDocument"
                        onChange={handleFileChange}
                        accept="image/*, application/pdf"
                      />
                      <FaUpload /> Select File
                    </label>
                    {selectedFiles.idDocument && (
                      <span className={styles.selectedFile}>
                        {selectedFiles.idDocument.name}
                      </span>
                    )}
                  </div>
                )}
                <p className={styles.documentHelper}>
                  Passport, Driver's License, or National ID
                </p>
              </div>
              
              {/* Address Document */}
              <div className={styles.documentUpload}>
                <div className={styles.documentHeader}>
                  <FaHome className={styles.documentIcon} />
                  <h4>Proof of Address</h4>
                </div>
                
                {documents.some(doc => doc.type === 'address') ? (
                  <div className={styles.uploadedDocument}>
                    <FaCheck className={styles.uploadedIcon} />
                    <span>Address document uploaded</span>
                  </div>
                ) : (
                  <div className={styles.uploadControl}>
                    <label className={styles.fileInput}>
                      <input
                        type="file"
                        name="addressDocument"
                        onChange={handleFileChange}
                        accept="image/*, application/pdf"
                      />
                      <FaUpload /> Select File
                    </label>
                    {selectedFiles.addressDocument && (
                      <span className={styles.selectedFile}>
                        {selectedFiles.addressDocument.name}
                      </span>
                    )}
                  </div>
                )}
                <p className={styles.documentHelper}>
                  Utility bill, bank statement (less than 3 months old)
                </p>
              </div>
              
              {/* Bank Document */}
              <div className={styles.documentUpload}>
                <div className={styles.documentHeader}>
                  <FaUniversity className={styles.documentIcon} />
                  <h4>Bank Statement</h4>
                </div>
                
                {documents.some(doc => doc.type === 'bank') ? (
                  <div className={styles.uploadedDocument}>
                    <FaCheck className={styles.uploadedIcon} />
                    <span>Bank document uploaded</span>
                  </div>
                ) : (
                  <div className={styles.uploadControl}>
                    <label className={styles.fileInput}>
                      <input
                        type="file"
                        name="bankDocument"
                        onChange={handleFileChange}
                        accept="image/*, application/pdf"
                      />
                      <FaUpload /> Select File
                    </label>
                    {selectedFiles.bankDocument && (
                      <span className={styles.selectedFile}>
                        {selectedFiles.bankDocument.name}
                      </span>
                    )}
                  </div>
                )}
                <p className={styles.documentHelper}>
                  Recent bank statement showing your name and account details
                </p>
              </div>
            </div>
          </div>
          
          <div className={styles.formSection}>
            <h3>Payment Details</h3>
            <p className={styles.sectionDescription}>
              Provide your preferred payment method for withdrawals
            </p>
            
            <div className={styles.paymentMethodSelection}>
              <div className={styles.radioGroup}>
                <label>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="bank"
                    checked={paymentDetails.paymentMethod === "bank"}
                    onChange={handlePaymentDetailsChange}
                  />
                  <span>Bank Transfer</span>
                </label>
                
                <label>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="paypal"
                    checked={paymentDetails.paymentMethod === "paypal"}
                    onChange={handlePaymentDetailsChange}
                  />
                  <span>PayPal</span>
                </label>
                
                <label>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="khalti"
                    checked={paymentDetails.paymentMethod === "khalti"}
                    onChange={handlePaymentDetailsChange}
                  />
                  <span>Khalti</span>
                </label>
              </div>
              
              {/* Bank Transfer Details */}
              {paymentDetails.paymentMethod === "bank" && (
                <div className={styles.paymentDetailsFields}>
                  <div className={styles.formField}>
                    <label>Bank Name</label>
                    <input
                      type="text"
                      name="bankName"
                      value={paymentDetails.bankName}
                      onChange={handlePaymentDetailsChange}
                      placeholder="Enter your bank name"
                    />
                  </div>
                  
                  <div className={styles.formField}>
                    <label>Account Name</label>
                    <input
                      type="text"
                      name="accountName"
                      value={paymentDetails.accountName}
                      onChange={handlePaymentDetailsChange}
                      placeholder="Enter account holder name"
                    />
                  </div>
                  
                  <div className={styles.formField}>
                    <label>Account Number</label>
                    <input
                      type="text"
                      name="accountNumber"
                      value={paymentDetails.accountNumber}
                      onChange={handlePaymentDetailsChange}
                      placeholder="Enter account number"
                    />
                  </div>
                  
                  <div className={styles.formField}>
                    <label>Swift Code (Optional for international transfers)</label>
                    <input
                      type="text"
                      name="swiftCode"
                      value={paymentDetails.swiftCode}
                      onChange={handlePaymentDetailsChange}
                      placeholder="Enter SWIFT/BIC code"
                    />
                  </div>
                </div>
              )}
              
              {/* PayPal Details */}
              {paymentDetails.paymentMethod === "paypal" && (
                <div className={styles.paymentDetailsFields}>
                  <div className={styles.formField}>
                    <label>PayPal Email</label>
                    <input
                      type="email"
                      name="paypalEmail"
                      value={paymentDetails.paypalEmail}
                      onChange={handlePaymentDetailsChange}
                      placeholder="Enter your PayPal email"
                    />
                  </div>
                </div>
              )}
              
              {/* Khalti Details */}
              {paymentDetails.paymentMethod === "khalti" && (
                <div className={styles.paymentDetailsFields}>
                  <div className={styles.formField}>
                    <label>Khalti ID</label>
                    <input
                      type="text"
                      name="khaltiId"
                      value={paymentDetails.khaltiId}
                      onChange={handlePaymentDetailsChange}
                      placeholder="Enter your Khalti ID"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className={styles.formActions}>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={submitting || verificationStatus === "approved"}
            >
              {submitting ? "Submitting..." : "Submit Verification"}
            </button>
          </div>
        </form>
      )}
      
      {/* Verification Guidelines */}
      <div className={styles.guidelinesSection}>
        <h3>Verification Guidelines</h3>
        <ul className={styles.guidelines}>
          <li>All documents must be valid and not expired</li>
          <li>Documents must clearly show your name, which matches your account</li>
          <li>Address documents must be less than 3 months old</li>
          <li>Files should be in JPG, PNG, or PDF format and less than 5MB</li>
          <li>Verification typically takes 1-2 business days to process</li>
          <li>You must be verified to request withdrawals</li>
        </ul>
      </div>
    </div>
  );
};

export default SellerVerification;