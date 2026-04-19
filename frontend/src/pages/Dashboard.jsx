import React, { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import API from "../api/api";
import styles from "../css/Dashboard.module.css";
import NavbarBeatExplore from '../Components/NavbarBeatExplore';
import {
  FaUserCircle, FaMusic, FaChartLine,
  FaUpload, FaPlay, FaPause, FaEdit, FaTrash, FaHeadphones,
  FaUserEdit, FaIdCard, FaWallet
} from "react-icons/fa";
import UploadBeat from "../Components/UploadBeat";
import PurchasedBeats from "../Components/PurchasedBeats";
import SellerWallet from "../Components/SellerWallet";
import EditProfile from "../Components/EditProfile";
import DocumentVerification from '../Components/DocumentVerification';
import { showToast } from '../utils/toast';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoggedIn, loading: authLoading } = useAuth();

  const [beats, setBeats] = useState([]);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [player, setPlayer] = useState(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(null);
  const [error, setError] = useState(null);
  const [audioLoading, setAudioLoading] = useState(false);

  const getCurrentPage = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'dashboard';
    if (path === '/dashboard/profile') return 'profile';
    if (path === '/dashboard/wallet') return 'wallet';
    if (path === '/dashboard/purchases') return 'purchases';
    if (path === '/dashboard/verification') return 'verification';
    return 'dashboard';
  };

  const activePage = getCurrentPage();

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      navigate("/login");
    }
  }, [isLoggedIn, authLoading, navigate]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        if (user.role === "seller") {
          const beatsResponse = await API.get("/api/beats/producer/beats");
          setBeats(beatsResponse.data);
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        if (error.response?.status === 401) {
          navigate("/login");
        } else {
          setError("Failed to load dashboard data. Please try again later.");
          setIsLoading(false);
        }
      }
    };

    fetchDashboardData();

    return () => {
      if (player) {
        player.pause();
        player.src = "";
      }
    };
  }, [user, navigate]);

  const getCloudinaryImageUrl = (imageUrl, fallbackUrl = "/default-cover.jpg") => {
    if (!imageUrl) return fallbackUrl;
    const url = String(imageUrl);
    try {
      new URL(url);
      return url;
    } catch (e) {
      return fallbackUrl;
    }
  };

  const handlePlayPause = async (beatId, audioUrl) => {
    try {
      if (!audioUrl) return;

      if (currentlyPlaying === beatId && player) {
        if (!player.paused) {
          player.pause();
          setCurrentlyPlaying(null);
        } else {
          player.play();
          setCurrentlyPlaying(beatId);
        }
        return;
      }

      setAudioLoading(true);
      if (player) { player.pause(); player.src = ""; }

      const audio = new Audio();

      audio.oncanplaythrough = () => {
        setAudioLoading(false);
        audio.play()
          .then(() => setCurrentlyPlaying(beatId))
          .catch(error => {
            console.error("Failed to start playback:", error);
            setAudioLoading(false);
          });
      };
      audio.onended = () => setCurrentlyPlaying(null);
      audio.onerror = () => {
        setAudioLoading(false);
        setCurrentlyPlaying(null);
      };

      audio.src = audioUrl;
      audio.load();
      setPlayer(audio);
    } catch (error) {
      console.error("Audio playback error:", error);
      setAudioLoading(false);
    }
  };

  const handleUpgrade = () => navigate("/subscription");
  const toggleUploadForm = () => setShowUploadForm(!showUploadForm);

  const handleUploadComplete = (data) => {
    if (data && data.beat) {
      setBeats([data.beat, ...beats]);
      showToast.uploadSuccess(data.beat.title);
    } else {
      showToast.success('Beat uploaded successfully!');
    }
    setShowUploadForm(false);
  };

  const handleEditBeat = (beatId) => navigate(`/edit-beat/${beatId}`);
  const handleDeleteBeat = (beatId) => setShowConfirmDelete(beatId);

  const confirmDelete = async (beatId) => {
    try {
      if (!beatId) {
        showToast.error("Cannot delete beat: Invalid ID");
        setShowConfirmDelete(null);
        return;
      }

      await API.delete(`/api/beats/${beatId}`);

      if (currentlyPlaying === beatId && player) {
        player.pause();
        player.src = "";
        setPlayer(null);
        setCurrentlyPlaying(null);
      }

      setBeats(beats.filter(beat => beat.id !== beatId && beat._id !== beatId));
      setShowConfirmDelete(null);
    } catch (error) {
      console.error("Error deleting beat:", error);
      showToast.error("Failed to delete beat. Please try again.");
      setShowConfirmDelete(null);
    }
  };

  const cancelDelete = () => setShowConfirmDelete(null);

  // Safe upload limit with null fallback
  const uploadLimit = user?.subscription?.uploadLimit ?? 10;

  const renderDashboardContent = () => {
    if (isLoading || authLoading) {
      return <div className={styles.loading}>Loading dashboard...</div>;
    }

    if (error) return <div className={styles.error}>{error}</div>;
    if (activePage === "wallet") return <SellerWallet />;
    if (activePage === "purchases") return <PurchasedBeats />;
    if (activePage === "profile") return <EditProfile />;
    if (activePage === "verification") return <DocumentVerification />;

    if (user?.role === "seller") {
      return (
        <>
          <div className={styles.statsSection}>
            <div className={styles.statCard}>
              <h3>Total Beats</h3>
              <p>{beats.length}</p>
            </div>
            <div className={styles.statCard}>
              <h3>Total Plays</h3>
              <p>{beats.reduce((sum, beat) => sum + (beat.plays || 0), 0)}</p>
            </div>
            <div className={styles.statCard}>
              <h3>Total Followers</h3>
              <p>{user.followersCount || 0}</p>
            </div>
            <div className={styles.statCard}>
              <h3>Upload Limit</h3>
              <p>{uploadLimit}</p>
            </div>
          </div>

          <div className={styles.beatsSection}>
            <h2>Your Beats</h2>
            {beats.length === 0 ? (
              <div className={styles.noBeats}>
                <p>You haven't uploaded any beats yet.</p>
                <button className={styles.uploadBtn} onClick={toggleUploadForm}>
                  <FaUpload className={styles.btnIcon} /> Upload Your First Beat
                </button>
              </div>
            ) : (
              <>
                <div className={styles.beatsHeader}>
                  <p>You have {beats.length} beats uploaded</p>
                  <button className={styles.uploadBtn} onClick={toggleUploadForm}>
                    <FaUpload className={styles.btnIcon} /> Upload Beat
                  </button>
                </div>
                <div className={styles.beatsList}>
                  <div className={styles.beatsTableHeader}>
                    <div className={styles.beatImage}>Cover</div>
                    <div className={styles.beatTitle}>Title</div>
                    <div className={styles.beatGenre}>Genre</div>
                    <div className={styles.beatPrice}>Price</div>
                    <div className={styles.beatStats}>Stats</div>
                    <div className={styles.beatActions}>Actions</div>
                  </div>

                  {beats.map((beat) => {
                    const beatId = beat._id || beat.id;
                    return (
                      <div key={beatId} className={styles.beatItem}>
                        <div className={styles.beatImage}>
                          <img
                            src={getCloudinaryImageUrl(beat.coverImage || beat.imageUrl)}
                            alt={beat.title}
                            onError={(e) => {
                              e.target.src = "/default-cover.jpg";
                              e.target.onerror = null;
                            }}
                          />
                        </div>
                        <div className={styles.beatTitle}>{beat.title}</div>
                        <div className={styles.beatGenre}>{beat.genre}</div>
                        <div className={styles.beatPrice}>Rs {beat.price}</div>
                        <div className={styles.beatStats}>
                          <div className={styles.statItem}>
                            <FaHeadphones /> {beat.plays || 0}
                          </div>
                        </div>
                        <div className={styles.beatActions}>
                          <button
                            className={styles.actionBtn}
                            onClick={() => handlePlayPause(beatId, beat.audioFile || beat.audioUrl)}
                            disabled={audioLoading && currentlyPlaying === beatId}
                          >
                            {audioLoading && currentlyPlaying === beatId ? (
                              <span className={styles.loadingDot}>•••</span>
                            ) : currentlyPlaying === beatId ? (
                              <FaPause />
                            ) : (
                              <FaPlay />
                            )}
                          </button>
                          <button className={styles.actionBtn} onClick={() => handleEditBeat(beatId)}>
                            <FaEdit />
                          </button>
                          <button className={styles.actionBtn} onClick={() => handleDeleteBeat(beatId)}>
                            <FaTrash />
                          </button>
                        </div>

                        {showConfirmDelete === beatId && (
                          <div className={styles.confirmDelete}>
                            <p>Are you sure you want to delete <strong>{beat.title}</strong>?</p>
                            <div className={styles.confirmButtons}>
                              <button className={styles.deleteBtn} onClick={() => confirmDelete(beatId)}>
                                Delete
                              </button>
                              <button className={styles.cancelBtn} onClick={cancelDelete}>
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </>
      );
    } else {
      return (
        <div className={styles.buyerDashboard}>
          <h2>Welcome to Your Dashboard</h2>
          <p>View your purchased beats and explore more music</p>
          <div className={styles.actionCards}>
            <div className={styles.actionCard} onClick={() => navigate('/BeatExplorePage')}>
              <FaMusic className={styles.actionIcon} />
              <h3>Explore Beats</h3>
              <p>Browse our collection of beats from talented producers</p>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <>
      <NavbarBeatExplore />
      <div className={styles.dashboardContainer}>
        <aside className={styles.sidebar}>
          <div className={styles.profileSection}>
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user?.username || user?.name || "User"}
                className={styles.profileIcon}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <FaUserCircle className={styles.profileIcon} />
            )}
            <h3>{user?.username || user?.name || "User"}</h3>
            <span className={styles.role}>{user?.role === "seller" ? "Producer" : "Listener"}</span>

            {user?.role === "seller" && (
              <div className={styles.verificationStatus}>
                <div className={`${styles.statusIndicator} ${styles[user?.verificationStatus || "not_submitted"]}`}></div>
                <span>
                  {user?.verificationStatus === "approved" && "Verified"}
                  {user?.verificationStatus === "pending" && "Verification Pending"}
                  {user?.verificationStatus === "rejected" && "Verification Rejected"}
                  {(!user?.verificationStatus || user?.verificationStatus === "not_submitted") && "Not Verified"}
                </span>
              </div>
            )}

            {user?.role === "seller" && user?.subscription?.plan && (
              <div className={styles.subscriptionBadge} onClick={() => navigate("/subscription")}>
                <span className={styles.planName}>{user.subscription.plan}</span>
                <span className={styles.planDetails}>
                  {uploadLimit === Infinity
                    ? "Unlimited uploads"
                    : `${beats.length}/${uploadLimit} uploads`}
                </span>
                {uploadLimit !== Infinity && (
                  <div className={styles.usageBar}>
                    <div
                      className={styles.usageProgress}
                      style={{ width: `${Math.min(100, (beats.length / uploadLimit) * 100)}%` }}
                    ></div>
                  </div>
                )}
              </div>
            )}
          </div>

          <nav>
            <ul>
              <li className={activePage === "dashboard" ? styles.active : ""}>
                <Link to="/dashboard" className={styles.navLink}>
                  <FaChartLine /> Dashboard
                </Link>
              </li>
              <li className={activePage === "profile" ? styles.active : ""}>
                <Link to="/dashboard/profile" className={styles.navLink}>
                  <FaUserEdit /> Edit Profile
                </Link>
              </li>
              {user?.role === "seller" ? (
                <>
                  <li className={activePage === "wallet" ? styles.active : ""}>
                    <Link to="/dashboard/wallet" className={styles.navLink}>
                      <FaWallet /> Wallet
                    </Link>
                  </li>
                  <li className={activePage === "verification" ? styles.active : ""}>
                    <Link to="/dashboard/verification" className={styles.navLink}>
                      <FaIdCard /> Verify Account
                    </Link>
                  </li>
                </>
              ) : (
                <li className={activePage === "purchases" ? styles.active : ""}>
                  <Link to="/dashboard/purchases" className={styles.navLink}>
                    <FaMusic /> Purchased Beats
                  </Link>
                </li>
              )}
            </ul>
          </nav>
        </aside>

        <main className={styles.mainContent}>
          {showUploadForm ? (
            <>
              <div className={styles.header}>
                <h2>Upload Beat</h2>
                <button className={styles.backBtn} onClick={toggleUploadForm}>
                  Back to Dashboard
                </button>
              </div>
              <UploadBeat onUploadComplete={handleUploadComplete} />
            </>
          ) : (
            <>
              <div className={styles.header}>
                {activePage === "dashboard" && (
                  <>
                    <h2>Dashboard</h2>
                    {user?.role === "seller" && (
                      <div className={styles.headerActions}>
                        <button className={styles.upgradeBtn} onClick={handleUpgrade}>
                          Upgrade Plan
                        </button>
                      </div>
                    )}
                  </>
                )}
                {activePage === "profile" && <h2>Edit Profile</h2>}
                {activePage === "wallet" && <h2>Seller Wallet</h2>}
                {activePage === "verification" && <h2>Account Verification</h2>}
              </div>
              {renderDashboardContent()}
            </>
          )}
        </main>
      </div>
    </>
  );
};

export default Dashboard;