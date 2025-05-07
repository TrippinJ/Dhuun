import React, { useState, useEffect } from 'react';
import { FaUpload, FaCheckCircle, FaTimesCircle, FaSpinner, FaFileAlt, FaIdCard } from 'react-icons/fa';
import API from '../api/api';

const DocumentVerification = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('not_submitted');
  
  // Payment details for withdrawals
  const [paymentDetails, setPaymentDetails] = useState({
    paymentMethod: 'bank',
    bankName: '',
    accountNumber: '',
    accountName: '',
    khaltiId: '',
    eSewa: ''
  });

  useEffect(() => {
    fetchVerificationStatus();
  }, []);

  const fetchVerificationStatus = async () => {
    try {
      setLoading(true);
      const response = await API.get('/api/verification/status');
      console.log("Verification status response:", response.data);
      
      if (response.data.success) {
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
      }
    } catch (error) {
      console.error("Error fetching verification status:", error);
      setError("Failed to load verification status");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e, documentType) => {
    // This will be triggered when a file is selected
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      handleUpload(file, documentType);
    }
  };

  const handleUpload = async (file, documentType) => {
    try {
      setUploadLoading(true);
      setError(null);
      setSuccess('');
      
      const formData = new FormData();
      formData.append(`${documentType}Document`, file);
      
      // Add payment details if they exist
      if (paymentDetails.paymentMethod) {
        formData.append('paymentMethod', paymentDetails.paymentMethod);
        
        if (paymentDetails.paymentMethod === 'bank') {
          formData.append('bankName', paymentDetails.bankName);
          formData.append('accountNumber', paymentDetails.accountNumber);
          formData.append('accountName', paymentDetails.accountName);
        } else if (paymentDetails.paymentMethod === 'khalti') {
          formData.append('khaltiId', paymentDetails.khaltiId);
        } else if (paymentDetails.paymentMethod === 'esewa') {
          formData.append('eSewa', paymentDetails.eSewa);
        }
      }
      
      const response = await API.post('/api/verification/submit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        setSuccess(`${documentType.toUpperCase()} document uploaded successfully`);
        fetchVerificationStatus(); // Refresh documents
      }
    } catch (error) {
      console.error(`Error uploading ${documentType} document:`, error);
      setError(error.response?.data?.message || `Failed to upload ${documentType} document`);
    } finally {
      setUploadLoading(false);
    }
  };

  const handlePaymentDetailChange = (e) => {
    const { name, value } = e.target;
    setPaymentDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <FaCheckCircle className="mr-1" /> Verified
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <FaSpinner className="mr-1 animate-spin" /> Under Review
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <FaTimesCircle className="mr-1" /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <FaFileAlt className="mr-1" /> Not Submitted
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <FaSpinner className="animate-spin text-purple-600 text-3xl" />
      </div>
    );
  }

  // Find if specific document types exist
  const findDocument = (type) => documents.find(doc => doc.type === type);
  const idDocument = findDocument('id');
  const addressDocument = findDocument('address');

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Document Verification</h2>
          <StatusBadge status={verificationStatus} />
        </div>
        
        <p className="text-gray-600 mb-4">
          Verify your account to unlock withdrawals and seller features. 
          We require official identification documents.
        </p>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
            <p className="text-green-700">{success}</p>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* ID Document Section */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center mb-3">
            <FaIdCard className="text-gray-600 mr-2" />
            <h3 className="font-medium">Citizenship ID / Passport</h3>
          </div>
          
          {idDocument ? (
            <div className="mt-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  Uploaded: {new Date(idDocument.uploadDate).toLocaleDateString()}
                </span>
                <StatusBadge status={verificationStatus} />
              </div>
              
              {idDocument.fileUrl && (
                <div className="mt-2 border rounded p-2">
                  <img 
                    src={idDocument.fileUrl} 
                    alt="ID Document" 
                    className="w-full h-auto max-h-40 object-contain"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="mt-2">
              <label className="block w-full">
                <span className="sr-only">Upload Citizenship or Passport</span>
                <div className="relative">
                  <input 
                    type="file" 
                    className="hidden"
                    onChange={(e) => handleFileChange(e, 'id')}
                    accept="image/*,.pdf"
                    disabled={uploadLoading}
                  />
                  <button 
                    onClick={() => document.querySelector('input[type="file"]').click()}
                    className="w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    disabled={uploadLoading}
                  >
                    {uploadLoading ? (
                      <><FaSpinner className="animate-spin inline mr-2" /> Uploading...</>
                    ) : (
                      <><FaUpload className="inline mr-2" /> Upload ID Document</>
                    )}
                  </button>
                </div>
              </label>
              <p className="mt-1 text-xs text-gray-500">
                Please upload a clear photo of your Citizenship ID, Passport, or Driving License
              </p>
            </div>
          )}
        </div>

        {/* Address Document Section */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center mb-3">
            <FaFileAlt className="text-gray-600 mr-2" />
            <h3 className="font-medium">Address Proof</h3>
          </div>
          
          {addressDocument ? (
            <div className="mt-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  Uploaded: {new Date(addressDocument.uploadDate).toLocaleDateString()}
                </span>
                <StatusBadge status={verificationStatus} />
              </div>
              
              {addressDocument.fileUrl && (
                <div className="mt-2 border rounded p-2">
                  <img 
                    src={addressDocument.fileUrl} 
                    alt="Address Document" 
                    className="w-full h-auto max-h-40 object-contain"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="mt-2">
              <label className="block w-full">
                <span className="sr-only">Upload Address Proof</span>
                <div className="relative">
                  <input 
                    type="file" 
                    className="hidden"
                    onChange={(e) => handleFileChange(e, 'address')}
                    accept="image/*,.pdf"
                    disabled={uploadLoading}
                  />
                  <button 
                    onClick={() => document.querySelectorAll('input[type="file"]')[1].click()}
                    className="w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    disabled={uploadLoading}
                  >
                    {uploadLoading ? (
                      <><FaSpinner className="animate-spin inline mr-2" /> Uploading...</>
                    ) : (
                      <><FaUpload className="inline mr-2" /> Upload Address Proof</>
                    )}
                  </button>
                </div>
              </label>
              <p className="mt-1 text-xs text-gray-500">
                Please upload a utility bill, bank statement, or Voter ID showing your address
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Payment Details Section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Payment Details for Withdrawals</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Payment Method
          </label>
          <select
            name="paymentMethod"
            value={paymentDetails.paymentMethod}
            onChange={handlePaymentDetailChange}
            className="block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
          >
            <option value="bank">Bank Transfer</option>
            <option value="khalti">Khalti</option>
            <option value="esewa">eSewa</option>
          </select>
        </div>
        
        {paymentDetails.paymentMethod === 'bank' && (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bank Name
              </label>
              <input
                type="text"
                name="bankName"
                value={paymentDetails.bankName}
                onChange={handlePaymentDetailChange}
                className="block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                placeholder="e.g., Nepal Investment Bank, NIC Asia"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Holder Name
              </label>
              <input
                type="text"
                name="accountName"
                value={paymentDetails.accountName}
                onChange={handlePaymentDetailChange}
                className="block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                placeholder="Full name as per bank account"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Number
              </label>
              <input
                type="text"
                name="accountNumber"
                value={paymentDetails.accountNumber}
                onChange={handlePaymentDetailChange}
                className="block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                placeholder="Your bank account number"
              />
            </div>
          </>
        )}
        
        {paymentDetails.paymentMethod === 'khalti' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Khalti ID / Mobile Number
            </label>
            <input
              type="text"
              name="khaltiId"
              value={paymentDetails.khaltiId}
              onChange={handlePaymentDetailChange}
              className="block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              placeholder="Your Khalti registered mobile number"
            />
          </div>
        )}
        
        {paymentDetails.paymentMethod === 'esewa' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              eSewa ID / Mobile Number
            </label>
            <input
              type="text"
              name="eSewa"
              value={paymentDetails.eSewa}
              onChange={handlePaymentDetailChange}
              className="block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              placeholder="Your eSewa registered mobile number"
            />
          </div>
        )}
        
        <div className="mt-4">
          <button
            type="button"
            onClick={() => handleUpload(null, 'payment')}
            className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            disabled={uploadLoading}
          >
            {uploadLoading ? (
              <><FaSpinner className="animate-spin mr-2" /> Saving...</>
            ) : (
              'Save Payment Details'
            )}
          </button>
        </div>
      </div>
      
      {/* Verification Status Info */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-800 mb-2">Verification Status: <StatusBadge status={verificationStatus} /></h3>
        
        {verificationStatus === 'pending' && (
          <p className="text-sm text-gray-600">
            Your documents are under review. This usually takes 1-2 business days. 
            We'll notify you once the verification is complete.
          </p>
        )}
        
        {verificationStatus === 'approved' && (
          <p className="text-sm text-green-600">
            Congratulations! Your account is fully verified. You can now request withdrawals.
          </p>
        )}
        
        {verificationStatus === 'rejected' && (
          <p className="text-sm text-red-600">
            Unfortunately, your verification was rejected. Please upload new documents with better quality.
          </p>
        )}
        
        {verificationStatus === 'not_submitted' && (
          <p className="text-sm text-gray-600">
            Please upload the required documents to verify your account.
          </p>
        )}
      </div>
    </div>
  );
};

export default DocumentVerification;