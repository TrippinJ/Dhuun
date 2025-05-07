import React, { useState, useEffect } from "react";
import { FaIdCard, FaFileUpload, FaCheckCircle, FaTimesCircle, FaSpinner, FaUpload } from "react-icons/fa";
import API from "../api/api";
import styles from "../css/DocumentVerification.module.css";

const DocumentVerification = () => {
  const [verificationStatus, setVerificationStatus] = useState("not_submitted");
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState({
    idDocument: null,
    addressDocument: null,
    bankDocument: null
  });
  const [paymentMethod, setPaymentMethod] = useState("bank");
  const [paymentDetails, setPaymentDetails] = useState({
    bankName: "",
    accountNumber: "",
    accountName: "",
    khaltiId: "",
    paypalEmail: ""
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch verification status on component mount
  useEffect(() => {
    fetchVerificationStatus();
  }, []);

  const fetchVerificationStatus = async () => {
    try {
      setLoading(true);
      const response = await API.get("/api/verification/status");
      
      if (response.data.success) {
        setVerificationStatus(response.data.status);
        setDocuments(response.data.documents || []);
        
        // If payout details exist, populate the form
        if (response.data.payoutDetails) {
          setPaymentMethod(response.data.payoutDetails.paymentMethod || "bank");
          setPaymentDetails({
            bankName: response.data.payoutDetails.bankName || "",
            accountNumber: response.data.payoutDetails.accountNumber || "",
            accountName: response.data.payoutDetails.accountName || "",
            khaltiId: response.data.payoutDetails.khaltiId || "",
            paypalEmail: response.data.payoutDetails.paypalEmail || ""
          });
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching verification status:", error);
      setError("Failed to load verification status");
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files.length > 0) {
      setUploadedFiles({
        ...uploadedFiles,
        [name]: files[0]
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentDetails({
      ...paymentDetails,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate inputs before submission
    if (paymentMethod === "bank" && (!paymentDetails.bankName || !paymentDetails.accountNumber)) {
      setError("Please fill in all required bank details");
      return;
    }
    
    if (paymentMethod === "khalti" && !paymentDetails.khaltiId) {
      setError("Please enter your Khalti ID");
      return;
    }
    
    if (paymentMethod === "paypal" && !paymentDetails.paypalEmail) {
      setError("Please enter your PayPal email");
      return;
    }
    
    try {
      setSubmitLoading(true);
      setError(null);
      
      // Create form data for file uploads
      const formData = new FormData();
      
      // Add files if selected
      if (uploadedFiles.idDocument) {
        formData.append("idDocument", uploadedFiles.idDocument);
      }
      
      if (uploadedFiles.addressDocument) {
        formData.append("addressDocument", uploadedFiles.addressDocument);
      }
      
      if (uploadedFiles.bankDocument) {
        formData.append("bankDocument", uploadedFiles.bankDocument);
      }
      
      // Add payment details
      formData.append("paymentMethod", paymentMethod);
      
      if (paymentMethod === "bank") {
        formData.append("bankName", paymentDetails.bankName);
        formData.append("accountNumber", paymentDetails.accountNumber);
        formData.append("accountName", paymentDetails.accountName);
      } else if (paymentMethod === "khalti") {
        formData.append("khaltiId", paymentDetails.khaltiId);
      } else if (paymentMethod === "paypal") {
        formData.append("paypalEmail", paymentDetails.paypalEmail);
      }
      
      // Submit verification documents
      const response = await API.post("/api/verification/submit", formData);
      
      if (response.data.success) {
        setSuccessMessage("Verification documents submitted successfully!");
        fetchVerificationStatus(); // Refresh status
      }
    } catch (error) {
      console.error("Error submitting verification:", error);
      setError(error.response?.data?.message || "Failed to submit verification documents");
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading verification status...</div>;
  }

  return (
    <div className={styles.verificationContainer}>
      {error && <div className={styles.errorMessage}>{error}</div>}
      {successMessage && <div className={styles.successMessage}>{successMessage}</div>}
      
      <div className={styles.statusCard}>
        <h2>Verification Status</h2>
        
        {verificationStatus === "pending" && (
          <div className={styles.statusPending}>
            <FaSpinner className={styles.spinnerIcon} />
            <p>Your verification is pending review</p>
            <span>We'll notify you once your documents are verified</span>
          </div>
        )}
        
        {verificationStatus === "approved" && (
          <div className={styles.statusApproved}>
            <FaCheckCircle className={styles.checkIcon} />
            <p>Your account is verified!</p>
            <span>You can now request withdrawals</span>
          </div>
        )}
        
        {verificationStatus === "rejected" && (
          <div className={styles.statusRejected}>
            <FaTimesCircle className={styles.timesIcon} />
            <p>Verification rejected</p>
            <span>Please submit new documents</span>
          </div>
        )}
        
        {(verificationStatus === "not_submitted" || verificationStatus === "rejected") && (
          <form onSubmit={handleSubmit} className={styles.verificationForm}>
            <h3>Submit Verification Documents</h3>
            
            <div className={styles.documentSection}>
              <div className={styles.documentUpload}>
                <label>
                  <span>ID Document (Passport/Driver's License)</span>
                  <div className={styles.uploadBox}>
                    <FaIdCard className={styles.idIcon} />
                    <span>{uploadedFiles.idDocument ? uploadedFiles.idDocument.name : "Upload ID"}</span>
                    <input
                      type="file"
                      name="idDocument"
                      onChange={handleFileChange}
                      accept="image/*,.pdf"
                    />
                  </div>
                </label>
              </div>
              
              <div className={styles.documentUpload}>
                <label>
                  <span>Proof of Address (Utility Bill)</span>
                  <div className={styles.uploadBox}>
                    <FaFileUpload className={styles.fileIcon} />
                    <span>{uploadedFiles.addressDocument ? uploadedFiles.addressDocument.name : "Upload Document"}</span>
                    <input
                      type="file"
                      name="addressDocument"
                      onChange={handleFileChange}
                      accept="image/*,.pdf"
                    />
                  </div>
                </label>
              </div>
              
              <div className={styles.documentUpload}>
                <label>
                  <span>Bank Statement (Optional)</span>
                  <div className={styles.uploadBox}>
                    <FaFileUpload className={styles.fileIcon} />
                    <span>{uploadedFiles.bankDocument ? uploadedFiles.bankDocument.name : "Upload Document"}</span>
                    <input
                      type="file"
                      name="bankDocument"
                      onChange={handleFileChange}
                      accept="image/*,.pdf"
                    />
                  </div>
                </label>
              </div>
            </div>
            
            <div className={styles.paymentSection}>
              <h3>Payment Details</h3>
              
              <div className={styles.paymentMethod}>
                <label>Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="bank">Bank Transfer</option>
                  <option value="khalti">Khalti</option>
                  <option value="paypal">PayPal</option>
                </select>
              </div>
              
              {paymentMethod === "bank" && (
                <>
                  <div className={styles.formGroup}>
                    <label>Bank Name</label>
                    <input
                      type="text"
                      name="bankName"
                      value={paymentDetails.bankName}
                      onChange={handleInputChange}
                      placeholder="Enter bank name"
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label>Account Number</label>
                    <input
                      type="text"
                      name="accountNumber"
                      value={paymentDetails.accountNumber}
                      onChange={handleInputChange}
                      placeholder="Enter account number"
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label>Account Holder Name</label>
                    <input
                      type="text"
                      name="accountName"
                      value={paymentDetails.accountName}
                      onChange={handleInputChange}
                      placeholder="Enter account holder name"
                    />
                  </div>
                </>
              )}
              
              {paymentMethod === "khalti" && (
                <div className={styles.formGroup}>
                  <label>Khalti ID</label>
                  <input
                    type="text"
                    name="khaltiId"
                    value={paymentDetails.khaltiId}
                    onChange={handleInputChange}
                    placeholder="Enter Khalti ID"
                  />
                </div>
              )}
              
              {paymentMethod === "paypal" && (
                <div className={styles.formGroup}>
                  <label>PayPal Email</label>
                  <input
                    type="email"
                    name="paypalEmail"
                    value={paymentDetails.paypalEmail}
                    onChange={handleInputChange}
                    placeholder="Enter PayPal email"
                  />
                </div>
              )}
            </div>
            
            <button
              type="submit"
              className={styles.submitButton}
              disabled={submitLoading}
            >
              {submitLoading ? "Submitting..." : "Submit Verification"}
            </button>
          </form>
        )}
        
        {/* Show document list if already submitted */}
        {documents.length > 0 && (
          <div className={styles.documentList}>
            <h3>Submitted Documents</h3>
            <ul>
              {documents.map((doc, index) => (
                <li key={index} className={styles.documentItem}>
                  <div className={styles.documentType}>
                    {doc.type === "id" && "ID Document"}
                    {doc.type === "address" && "Proof of Address"}
                    {doc.type === "bank" && "Bank Statement"}
                  </div>
                  <div className={styles.documentStatus}>
                    {doc.verifiedDate ? (
                      <span className={styles.verified}>Verified</span>
                    ) : (
                      <span className={styles.pending}>Pending</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentVerification;