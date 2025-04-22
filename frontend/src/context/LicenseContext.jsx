// src/context/LicenseContext.jsx
import React, { createContext, useState, useContext } from 'react';
import LicenseSelectionModal from '../Components/LicenseSelectionModal';

const LicenseContext = createContext();

export const LicenseProvider = ({ children }) => {
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [selectedBeatForLicense, setSelectedBeatForLicense] = useState(null);
  const [onLicenseSelectCallback, setOnLicenseSelectCallback] = useState(null);

  const openLicenseModal = (beat, callback) => {
    setSelectedBeatForLicense(beat);
    setOnLicenseSelectCallback(() => callback);
    setShowLicenseModal(true);
  };

  const closeLicenseModal = () => {
    setShowLicenseModal(false);
    setSelectedBeatForLicense(null);
    setOnLicenseSelectCallback(null);
  };

  const handleLicenseSelect = (beatWithLicense) => {
    if (onLicenseSelectCallback) {
      onLicenseSelectCallback(beatWithLicense);
    }
    closeLicenseModal();
  };

  return (
    <LicenseContext.Provider
      value={{
        openLicenseModal,
        closeLicenseModal,
      }}
    >
      {children}
      {showLicenseModal && selectedBeatForLicense && (
        <LicenseSelectionModal
          beat={selectedBeatForLicense}
          onClose={closeLicenseModal}
          onSelectLicense={handleLicenseSelect}
        />
      )}
    </LicenseContext.Provider>
  );
};

export const useLicense = () => useContext(LicenseContext);