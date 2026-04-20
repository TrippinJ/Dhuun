import React, { useState, useEffect, useCallback } from "react";
import {
  FaDownload, FaPlay, FaPause, FaFileContract,
  FaCalendarAlt, FaCertificate, FaMusic, FaTimes,
  FaSpinner, FaLock
} from "react-icons/fa";
import API from "../api/api";
import { toast } from "../utils/toast";          // ← replaces all alert()
import styles from "../css/PurchasedBeats.module.css";

// ─── License config ────────────────────────────────────────────────────────
const LICENSE_INFO = {
  basic: {
    name:     "Basic License",
    features: ["Tagged MP3", "Non-commercial use", "Credit required"],
    color:    "#22863a",
    icon:     "🎵",
    files:    ["MP3"],
  },
  premium: {
    name:     "Premium License",
    features: ["Tagged MP3 + Full WAV", "Commercial use", "Credit required"],
    color:    "#b45309",
    icon:     "⭐",
    files:    ["MP3", "WAV"],
  },
  exclusive: {
    name:     "Exclusive License",
    features: ["MP3 + WAV + Stems", "Full ownership", "No credit required"],
    color:    "#6d28d9",
    icon:     "👑",
    files:    ["MP3", "WAV", "Stems"],
  },
};

const getLicenseInfo = (licenseType) => {
  const key = licenseType?.toLowerCase() || "basic";
  if (key.includes("exclusive")) return LICENSE_INFO.exclusive;
  if (key.includes("premium"))   return LICENSE_INFO.premium;
  return LICENSE_INFO.basic;
};

const getLicenseValue = (license) => {
  const k = license?.toLowerCase() || "";
  if (k.includes("exclusive")) return 3;
  if (k.includes("premium"))   return 2;
  return 1;
};

// ─── Component ─────────────────────────────────────────────────────────────
const PurchasedBeats = () => {
  const [orders,           setOrders]          = useState([]);
  const [loading,          setLoading]         = useState(true);
  const [error,            setError]           = useState(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [audioPlayer]                          = useState(() => new Audio());
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [selectedLicense,  setSelectedLicense] = useState(null);
  // Track which beats are currently downloading (by beatId)
  const [downloading,      setDownloading]     = useState(new Set());

  // ── Fetch orders ──────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await API.get("/api/orders");

        // Deduplicate: keep highest license per beat
        const uniqueBeats = new Map();
        response.data.forEach(order => {
          order.items.forEach(item => {
            if (!item.beat) return;
            const beatId = item.beat._id;
            const existing = uniqueBeats.get(beatId);
            if (!existing || getLicenseValue(item.license) > getLicenseValue(existing.license)) {
              uniqueBeats.set(beatId, {
                ...item,
                orderId:       order._id,
                orderDate:     order.createdAt,
                paymentStatus: order.paymentStatus || "Completed",
              });
            }
          });
        });

        setOrders(
          Array.from(uniqueBeats.values())
            .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
        );
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError("Failed to load your purchased beats. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
    return () => { audioPlayer.pause(); audioPlayer.src = ""; };
  }, []);

  // ── Play / pause preview ──────────────────────────────────────────────────
  const handlePlayPause = useCallback((beatId, audioUrl) => {
    if (!audioUrl) return;

    if (currentlyPlaying === beatId) {
      audioPlayer.paused ? audioPlayer.play() : audioPlayer.pause();
    } else {
      audioPlayer.pause();
      audioPlayer.src = audioUrl;
      audioPlayer.play();
      setCurrentlyPlaying(beatId);
      audioPlayer.onended = () => setCurrentlyPlaying(null);
    }
  }, [currentlyPlaying, audioPlayer]);

  // ── Secure download ───────────────────────────────────────────────────────
  // Calls the backend endpoint which verifies order ownership and returns
  // short-lived signed URLs appropriate for the buyer's license tier:
  //   basic     → MP3 public URL
  //   premium   → MP3 + signed WAV URL (10-min expiry)
  //   exclusive → MP3 + signed WAV + signed Stems URL (10-min expiry each)
  const handleDownload = useCallback(async (item) => {
    const beatId  = item.beat?._id;
    const orderId = item.orderId;

    if (!beatId || !orderId) {
      toast.error("Download info missing — please contact support");
      return;
    }

    // Show loading state on the button
    setDownloading(prev => new Set(prev).add(beatId));

    const toastId = toast.loading("Preparing your download…");

    try {
      const { data } = await API.get(`/api/beats/${orderId}/download/${beatId}`);

      if (!data.success || !data.urls) {
        throw new Error("No download URLs returned");
      }

      // Trigger one download per available file format
      // Small delay between triggers so the browser doesn't block them
      const entries = Object.entries(data.urls);
      for (let i = 0; i < entries.length; i++) {
        const [format, url] = entries[i];
        const filename = `${data.title || "beat"}_${format}.${format === "stems" ? "zip" : format}`;

        const link = document.createElement("a");
        link.href     = url;
        link.download = filename;
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        if (i < entries.length - 1) {
          await new Promise(r => setTimeout(r, 600));
        }
      }

      const fileList = entries.map(([f]) => f.toUpperCase()).join(" + ");
      toast.update(toastId, {
        render:    `Downloaded: ${fileList}`,
        type:      "success",
        isLoading: false,
        autoClose: 3500,
      });

    } catch (err) {
      console.error("Download error:", err);
      toast.update(toastId, {
        render:    err.response?.data?.message || "Download failed — please try again",
        type:      "error",
        isLoading: false,
        autoClose: 5000,
      });
    } finally {
      setDownloading(prev => {
        const next = new Set(prev);
        next.delete(beatId);
        return next;
      });
    }
  }, []);

  // ── License info modal ────────────────────────────────────────────────────
  const handleLicenseInfo = useCallback((item) => {
    setSelectedLicense({ ...item, licenseDetails: getLicenseInfo(item.license) });
    setShowLicenseModal(true);
  }, []);

  // ── Loading / error / empty states ───────────────────────────────────────
  if (loading) {
    return (
      <div className={styles.stateContainer}>
        <FaSpinner className={styles.spinner} />
        <p>Loading your purchases…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.stateContainer}>
        <p className={styles.errorText}>{error}</p>
        <button className={styles.retryBtn} onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className={styles.emptyState}>
        <FaMusic className={styles.emptyIcon} />
        <h3>No purchases yet</h3>
        <p>Explore our marketplace to find beats from talented producers</p>
        <button
          className={styles.exploreButton}
          onClick={() => window.location.href = "/BeatExplorePage"}
        >
          Explore Beats
        </button>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div className={styles.purchasedBeatsContainer}>

      <div className={styles.header}>
        <h2>Your Purchased Beats</h2>
        <span className={styles.totalCount}>
          {orders.length} beat{orders.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Desktop table ── */}
      <div className={styles.beatsTable}>
        <div className={styles.tableHeader}>
          <div className={styles.beatColumn}>Beat</div>
          <div className={styles.licenseColumn}>License</div>
          <div className={styles.filesColumn}>Files included</div>
          <div className={styles.dateColumn}>Purchased</div>
          <div className={styles.actionsColumn}>Actions</div>
        </div>

        {orders.map((item, index) => {
          const licenseInfo = getLicenseInfo(item.license);
          const isActive    = currentlyPlaying === item.beat?._id;
          const isLoading   = downloading.has(item.beat?._id);

          return (
            <div key={index} className={styles.beatRow}>

              {/* Beat info */}
              <div className={styles.beatColumn}>
                <div className={styles.beatInfo}>
                  <div className={styles.beatImageContainer}>
                    <img
                      src={item.beat?.coverImage || "/default-cover.jpg"}
                      alt={item.beat?.title || "Beat"}
                      className={styles.beatImage}
                      onError={e => { e.target.src = "/default-cover.jpg"; }}
                    />
                    <button
                      className={`${styles.playOverlay} ${isActive ? styles.playing : ""}`}
                      onClick={() => handlePlayPause(item.beat?._id, item.beat?.audioFile)}
                      aria-label={isActive ? "Pause" : "Play preview"}
                    >
                      {isActive ? <FaPause /> : <FaPlay />}
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

              {/* License badge */}
              <div className={styles.licenseColumn}>
                <span
                  className={styles.licenseBadge}
                  style={{ background: licenseInfo.color }}
                >
                  {licenseInfo.icon} {licenseInfo.name}
                </span>
              </div>

              {/* Files included */}
              <div className={styles.filesColumn}>
                <div className={styles.filePills}>
                  {licenseInfo.files.map(f => (
                    <span key={f} className={styles.filePill}>
                      {f !== "MP3" && <FaLock className={styles.lockIcon} />}
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              {/* Date */}
              <div className={styles.dateColumn}>
                <div className={styles.dateInfo}>
                  <FaCalendarAlt className={styles.dateIcon} />
                  <span>
                    {new Date(item.orderDate).toLocaleDateString("en-US", {
                      year: "numeric", month: "short", day: "numeric",
                    })}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className={styles.actionsColumn}>
                <div className={styles.actionButtons}>
                  <button
                    className={`${styles.actionBtn} ${styles.downloadBtn} ${isLoading ? styles.loading : ""}`}
                    onClick={() => handleDownload(item)}
                    disabled={isLoading}
                    title={`Download ${licenseInfo.files.join(" + ")}`}
                  >
                    {isLoading
                      ? <FaSpinner className={styles.spin} />
                      : <FaDownload />
                    }
                    <span>{isLoading ? "…" : "Download"}</span>
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

      {/* ── License details modal ── */}
      {showLicenseModal && selectedLicense && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowLicenseModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className={styles.modalContent}
            onClick={e => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h3>License Details</h3>
              <button
                className={styles.closeBtn}
                onClick={() => setShowLicenseModal(false)}
                aria-label="Close"
              >
                <FaTimes />
              </button>
            </div>

            <div className={styles.modalBody}>
              {/* Beat info */}
              <div className={styles.modalBeatRow}>
                <img
                  src={selectedLicense.beat?.coverImage || "/default-cover.jpg"}
                  alt={selectedLicense.beat?.title}
                  className={styles.modalBeatImage}
                />
                <div>
                  <h4>{selectedLicense.beat?.title}</h4>
                  <p>by {selectedLicense.beat?.producer?.name}</p>
                  <span
                    className={styles.licenseBadge}
                    style={{ background: selectedLicense.licenseDetails.color }}
                  >
                    {selectedLicense.licenseDetails.icon} {selectedLicense.licenseDetails.name}
                  </span>
                </div>
              </div>

              {/* Files */}
              <div className={styles.modalSection}>
                <h5>Files you receive</h5>
                <div className={styles.filePills}>
                  {selectedLicense.licenseDetails.files.map(f => (
                    <span key={f} className={styles.filePill}>
                      {f !== "MP3" && <FaLock className={styles.lockIcon} />}
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              {/* Rights */}
              <div className={styles.modalSection}>
                <h5>Rights granted</h5>
                <ul className={styles.featuresList}>
                  {selectedLicense.licenseDetails.features.map((f, i) => (
                    <li key={i}>
                      <FaCertificate className={styles.checkIcon} />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Order info */}
              <div className={styles.modalSection}>
                <h5>Order information</h5>
                <div className={styles.orderGrid}>
                  <div className={styles.orderItem}>
                    <span>Order ID</span>
                    <span>#{selectedLicense.orderId.substring(0, 8)}</span>
                  </div>
                  <div className={styles.orderItem}>
                    <span>Purchased</span>
                    <span>{new Date(selectedLicense.orderDate).toLocaleDateString()}</span>
                  </div>
                  <div className={styles.orderItem}>
                    <span>Amount paid</span>
                    <span>Rs {selectedLicense.price?.toFixed(2) || "—"}</span>
                  </div>
                  <div className={styles.orderItem}>
                    <span>Status</span>
                    <span className={styles.statusActive}>Active</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.downloadModalBtn}
                disabled={downloading.has(selectedLicense.beat?._id)}
                onClick={() => {
                  handleDownload(selectedLicense);
                  setShowLicenseModal(false);
                }}
              >
                <FaDownload />
                Download {selectedLicense.licenseDetails.files.join(" + ")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchasedBeats;