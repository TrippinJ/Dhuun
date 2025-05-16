import React, { useState, useEffect } from "react";
import styles from "../css/LicenseSelectionModal.module.css";
import { FaTimes, FaCheck } from "react-icons/fa";

const LicenseSelectionModal = ({ beat, onClose, onSelectLicense }) => {
  const [selectedLicense, setSelectedLicense] = useState(null);
  const [licenseOptions, setLicenseOptions] = useState([]);

  // Initialize license options based on the beat's available licenses
  useEffect(() => {
    if (beat) {
      // Try to get the license types from the beat data
      const beatLicenses = beat.licenseTypes || [];
      
      // If the beat has defined license types, use those
      if (beatLicenses.length > 0) {
        setLicenseOptions(beatLicenses.map(license => ({
          type: license.type,
          name: license.name,
          price: parseFloat(license.price),
          description: getLicenseDescription(license.type),
          features: getLicenseFeatures(license.type)
        })));
      } else {
        // Fallback to default licenses if the beat doesn't have defined licenses
        setLicenseOptions([
          {
            type: "basic",
            name: "Basic License",
            price: parseFloat(beat.price || 4.99),
            description: "Perfect for demos and mixtapes",
            features: [
              "MP3 File",
              "No royalties", 
              "Must credit producer"
            ]
          },
          {
            type: "premium",
            name: "Premium License", 
            price: parseFloat(beat.price || 4.99) * 2.5,
            description: "For professional releases",
            features: [
              "WAV + MP3 Files",
              "No royalties",
              "Must credit producer"
            ]
          },
          {
            type: "exclusive",
            name: "Exclusive License",
            price: parseFloat(beat.price || 4.99) * 10,
            description: "Full ownership of the beat",
            features: [
              "WAV + MP3 + Stems",
              "Full ownership",
              "Beat removed from store"
            ]
          }
        ]);
      }
    }
  }, [beat]);

  // Helper function to get license description based on type
  const getLicenseDescription = (type) => {
    switch (type) {
      case "basic": return "Perfect for demos and mixtapes";
      case "premium": return "For professional releases";
      case "exclusive": return "Full ownership of the beat";
      default: return "License for music usage";
    }
  };

  // Helper function to get license features based on type
  const getLicenseFeatures = (type) => {
    switch (type) {
      case "basic":
        return ["MP3 File", "No royalties", "Must credit producer"];
      case "premium":
        return ["WAV + MP3 Files", "No royalties", "Must credit producer"];
      case "exclusive":
        return ["WAV + MP3 + Stems", "Full ownership", "Beat removed from store"];
      default:
        return ["Standard usage rights"];
    }
  };

  const handleLicenseSelect = (license) => {
    setSelectedLicense(license);
  };

  const handleConfirm = () => {
    if (selectedLicense) {
      onSelectLicense({
        ...beat,
        selectedLicense: selectedLicense.type,
        licensePrice: selectedLicense.price,
        licenseName: selectedLicense.name
      });
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          <FaTimes />
        </button>
        
        <h2 className={styles.modalTitle}>Select Your License</h2>
        <h3 className={styles.beatTitle}>{beat.title}</h3>
        <p className={styles.artistName}>by {beat.producer?.name || "Unknown Producer"}</p>

        <div className={styles.licenseOptions}>
          {licenseOptions.map((license) => (
            <div 
              key={license.type} 
              className={`${styles.licenseCard} ${selectedLicense?.type === license.type ? styles.selected : ''}`}
              onClick={() => handleLicenseSelect(license)}
            >
              <div className={styles.licenseHeader}>
                <h4>{license.name}</h4>
                <span className={styles.licensePrice}>Rs {license.price.toFixed(2)}</span>
              </div>
              
              <p className={styles.licenseDescription}>{license.description}</p>
              
              <ul className={styles.featuresList}>
                {license.features.map((feature, index) => (
                  <li key={index}>
                    <FaCheck className={styles.checkIcon} /> {feature}
                  </li>
                ))}
              </ul>
              
              {selectedLicense?.type === license.type && (
                <div className={styles.selectedBadge}>Selected</div>
              )}
            </div>
          ))}
        </div>

        <button 
          className={styles.confirmButton}
          onClick={handleConfirm}
          disabled={!selectedLicense}
        >
          Add to Cart with {selectedLicense?.name}
        </button>
      </div>
    </div>
  );
};

export default LicenseSelectionModal;