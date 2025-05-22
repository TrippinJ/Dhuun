// frontend/src/Components/PurchasedBeats.jsx
import React, { useState, useEffect } from "react";
import { 
  FaDownload, 
  FaPlay, 
  FaPause, 
  FaInfoCircle, 
  FaFileContract,
  FaCalendarAlt,
  FaCertificate,
  FaMusic,
  FaTimes
} from "react-icons/fa";
import API from "../api/api";
import styles from "../css/PurchasedBeats.module.css";

const PurchasedBeats = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [audioPlayer, setAudioPlayer] = useState(new Audio());
  const [processedBeats, setProcessedBeats] = useState(new Set());
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Authentication required");
        }

        const response = await API.get("/api/orders", {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Process orders to eliminate duplicate beats
        const uniqueBeats = new Map();
        const processedBeatsSet = new Set();

        // First, process all orders to identify unique beats
        response.data.forEach(order => {
          order.items.forEach(item => {
            if (item.beat) {
              const beatId = item.beat._id;

              // If this beat hasn't been processed yet
              if (!processedBeatsSet.has(beatId)) {
                processedBeatsSet.add(beatId);

                // Keep only the highest license level (exclusive > premium > basic)
                if (!uniqueBeats.has(beatId) ||
                  getLicenseValue(item.license) > getLicenseValue(uniqueBeats.get(beatId).license)) {
                  uniqueBeats.set(beatId, { 
                    ...item, 
                    orderId: order._id,
                    orderDate: order.createdAt,
                    paymentStatus: order.paymentStatus || 'Completed'
                  });
                }
              }
            }
          });
        });

        // Convert to array and sort by purchase date
        const processedOrders = Array.from(uniqueBeats.values()).sort((a, b) => 
          new Date(b.orderDate) - new Date(a.orderDate)
        );

        setOrders(processedOrders);
        setProcessedBeats(processedBeatsSet);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching orders:", error);
        setError("Failed to load your purchased beats");
        setLoading(false);
      }
    };

    fetchOrders();

    // Cleanup audio player on unmount
    return () => {
      if (audioPlayer) {
        audioPlayer.pause();
        audioPlayer.src = "";
      }
    };
  }, []);

  // Helper function to determine license value for sorting
  const getLicenseValue = (license) => {
    const licenseType = license ? license.toLowerCase() : '';

    if (licenseType.includes('exclusive')) return 3;
    if (licenseType.includes('premium')) return 2;
    if (licenseType.includes('basic')) return 1;
    return 0;
  };

  // Get detailed license information
  const getLicenseDetails = (licenseType) => {
    const license = licenseType ? licenseType.toLowerCase() : 'basic';
    
    const licenseInfo = {
      basic: {
        name: "Basic License",
        features: ["MP3 Download", "Non-commercial use", "Credit required"],
        color: "#4CAF50",
        icon: "🎵"
      },
      premium: {
        name: "Premium License",
        features: ["WAV + MP3 Download", "Commercial use", "Credit required"],
        color: "#FF9800",
        icon: "⭐"
      },
      exclusive: {
        name: "Exclusive License",
        features: ["Full rights", "WAV + MP3 + Stems", "No credit required"],
        color: "#9C27B0",
        icon: "👑"
      }
    };

    return licenseInfo[license] || licenseInfo.basic;
  };

  // Handle play/pause
  const handlePlayPause = (beatId, audioUrl) => {
    if (!audioUrl) return;

    if (currentlyPlaying === beatId) {
      // Toggle play/pause for current beat
      if (audioPlayer.paused) {
        audioPlayer.play();
      } else {
        audioPlayer.pause();
      }
    } else {
      // Play a new beat
      audioPlayer.pause();
      audioPlayer.src = audioUrl;
      audioPlayer.play();
      setCurrentlyPlaying(beatId);

      // Set ended event to reset state
      audioPlayer.onended = () => {
        setCurrentlyPlaying(null);
      };
    }
  };

  // Handle download beat
  const handleDownload = (beat, licenseType) => {
    if (!beat || !beat.audioFile) {
      alert("Download link not available");
      return;
    }

    // Create an anchor element and trigger the download
    const link = document.createElement('a');
    link.href = beat.audioFile;
    link.download = `${beat.title || 'beat'}_${licenseType}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle license info modal
  const handleLicenseInfo = (item) => {
    const licenseDetails = getLicenseDetails(item.license);
    setSelectedLicense({
      ...item,
      licenseDetails
    });
    setShowLicenseModal(true);
  };

  if (loading) {
    return <div className={styles.loading}>Loading your purchases...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (orders.length === 0) {
    return (
      <div className={styles.emptyState}>
        <FaMusic className={styles.emptyIcon} />
        <h3>You haven't purchased any beats yet</h3>
        <p>Explore our marketplace to find beats from talented producers</p>
        <button className={styles.exploreButton} onClick={() => window.location.href = "/BeatExplorePage"}>
          Explore Beats
        </button>
      </div>
    );
  }

  return (
    <div className={styles.purchasedBeatsContainer}>
      <div className={styles.header}>
        <h2>Your Purchased Beats</h2>
        <span className={styles.totalCount}>{orders.length} beat{orders.length !== 1 ? 's' : ''} purchased</span>
      </div>

      <div className={styles.beatsTable}>
        <div className={styles.tableHeader}>
          <div className={styles.beatColumn}>Beat</div>
          <div className={styles.orderColumn}>Order</div>
          <div className={styles.licenseColumn}>License</div>
          <div className={styles.dateColumn}>Purchase Date</div>
          <div className={styles.actionsColumn}>Actions</div>
        </div>

        {orders.map((item, index) => {
          const licenseDetails = getLicenseDetails(item.license);
          const isPlaying = currentlyPlaying === item.beat?._id;

          return (
            <div key={index} className={styles.beatRow}>
              {/* Beat Info */}
              <div className={styles.beatColumn}>
                <div className={styles.beatInfo}>
                  <div className={styles.beatImageContainer}>
                    <img
                      src={item.beat?.coverImage || "/default-cover.jpg"}
                      alt={item.beat?.title || "Beat"}
                      className={styles.beatImage}
                    />
                    <button
                      className={`${styles.playOverlay} ${isPlaying ? styles.playing : ''}`}
                      onClick={() => handlePlayPause(item.beat?._id, item.beat?.audioFile)}
                    >
                      {isPlaying ? <FaPause /> : <FaPlay />}
                    </button>
                  </div>
                  <div className={styles.beatDetails}>
                    <h4 className={styles.beatTitle}>{item.beat?.title || "Untitled Beat"}</h4>
                    <p className={styles.producerName}>
                      by {item.beat?.producer?.name || "Unknown Producer"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Info */}
              <div className={styles.orderColumn}>
                <div className={styles.orderInfo}>
                  <span className={styles.orderId}>#{item.orderId.substring(0, 8)}</span>
                  <span className={styles.paymentStatus}>
                    <span className={`${styles.statusDot} ${styles[item.paymentStatus?.toLowerCase()]}`}></span>
                    {item.paymentStatus || 'Completed'}
                  </span>
                </div>
              </div>

              {/* License Info */}
              <div className={styles.licenseColumn}>
                <div className={styles.licenseInfo}>
                  <div className={styles.licenseBadge} style={{ backgroundColor: licenseDetails.color }}>
                    <span className={styles.licenseIcon}>{licenseDetails.icon}</span>
                    <span className={styles.licenseName}>{licenseDetails.name}</span>
                  </div>
                  <div className={styles.licenseFeatures}>
                    {licenseDetails.features.slice(0, 2).map((feature, idx) => (
                      <span key={idx} className={styles.featureTag}>{feature}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Purchase Date */}
              <div className={styles.dateColumn}>
                <div className={styles.dateInfo}>
                  <FaCalendarAlt className={styles.dateIcon} />
                  <span className={styles.date}>
                    {new Date(item.orderDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className={styles.actionsColumn}>
                <div className={styles.actionButtons}>
                  <button
                    className={`${styles.actionBtn} ${styles.downloadBtn}`}
                    onClick={() => handleDownload(item.beat, item.license)}
                    title="Download Beat"
                  >
                    <FaDownload />
                    <span>Download</span>
                  </button>
                  <button
                    className={`${styles.actionBtn} ${styles.infoBtn}`}
                    onClick={() => handleLicenseInfo(item)}
                    title="License Details"
                  >
                    <FaFileContract />
                    <span>License</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* License Details Modal */}
      {showLicenseModal && selectedLicense && (
        <div className={styles.modalOverlay} onClick={() => setShowLicenseModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>License Details</h3>
              <button 
                className={styles.closeBtn}
                onClick={() => setShowLicenseModal(false)}
              >
                <FaTimes />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.licenseHeader}>
                <div className={styles.beatInfo}>
                  <img 
                    src={selectedLicense.beat?.coverImage || "/default-cover.jpg"} 
                    alt={selectedLicense.beat?.title}
                    className={styles.modalBeatImage}
                  />
                  <div>
                    <h4>{selectedLicense.beat?.title}</h4>
                    <p>by {selectedLicense.beat?.producer?.name}</p>
                  </div>
                </div>
                <div 
                  className={styles.licenseBadgeLarge} 
                  style={{ backgroundColor: selectedLicense.licenseDetails.color }}
                >
                  <span className={styles.licenseIcon}>{selectedLicense.licenseDetails.icon}</span>
                  <span>{selectedLicense.licenseDetails.name}</span>
                </div>
              </div>

              <div className={styles.licenseContent}>
                <h5>What's Included:</h5>
                <ul className={styles.featuresList}>
                  {selectedLicense.licenseDetails.features.map((feature, idx) => (
                    <li key={idx}>
                      <FaCertificate className={styles.checkIcon} />
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className={styles.orderDetails}>
                  <h5>Order Information:</h5>
                  <div className={styles.orderGrid}>
                    <div className={styles.orderItem}>
                      <span>Order ID:</span>
                      <span>#{selectedLicense.orderId.substring(0, 8)}</span>
                    </div>
                    <div className={styles.orderItem}>
                      <span>Purchase Date:</span>
                      <span>{new Date(selectedLicense.orderDate).toLocaleDateString()}</span>
                    </div>
                    <div className={styles.orderItem}>
                      <span>Price Paid:</span>
                      <span>Rs {selectedLicense.price?.toFixed(2) || 'N/A'}</span>
                    </div>
                    <div className={styles.orderItem}>
                      <span>Status:</span>
                      <span className={styles.statusActive}>Active</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button 
                className={styles.downloadModalBtn}
                onClick={() => {
                  handleDownload(selectedLicense.beat, selectedLicense.license);
                  setShowLicenseModal(false);
                }}
              >
                <FaDownload /> Download Beat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchasedBeats;