import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import styles from "../css/Dashboard.module.css";
import NavbarBeatExplore from '../Components/NavbarBeatExplore';
import {
  FaUserCircle,
  FaMusic,
  FaChartLine,
  FaSignOutAlt,
  FaTools,
  FaUpload,
  FaPlay,
  FaPause,
  FaEdit,
  FaTrash,
  FaHeadphones,
  FaUserEdit,
  FaIdCard,
  FaWallet
} from "react-icons/fa";
import UploadBeat from "../Components/UploadBeat";
import PurchasedBeats from "../Components/PurchasedBeats";
import SellerWallet from "../Components/SellerWallet";
import EditProfile from "../Components/EditProfile";
import DocumentVerification from '../Components/DocumentVerification';

const Dashboard = ({ activePage: initialPage }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [beats, setBeats] = useState([]);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [player, setPlayer] = useState(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(null);
  const [error, setError] = useState(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const [activePage, setActivePage] = useState(initialPage || "dashboard");
  const [userAvatar, setUserAvatar] = useState(null);
  const [userFullName, setUserFullName] = useState("User");


  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        // Fetch user data
        const userResponse = await API.get("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUser(userResponse.data);

        // Only fetch beats for sellers
        if (userResponse.data.role === "seller") {
          // Fetch user's beats
          const beatsResponse = await API.get("/api/beats/producer/beats", {
            headers: { Authorization: `Bearer ${token}` },
          });

          // Log the first beat to debug structure
          if (beatsResponse.data.length > 0) {
            console.log("First beat structure:", beatsResponse.data[0]);
            console.log("Image URL:", beatsResponse.data[0].coverImage || beatsResponse.data[0].imageUrl || "No image URL found");
            console.log("Audio URL:", beatsResponse.data[0].audioUrl || beatsResponse.data[0].audioFile || "No audio URL found");
          }

          setBeats(beatsResponse.data);
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        } else {
          setError("Failed to load dashboard data. Please try again later.");
          setIsLoading(false);
        }
      }
    };

    checkAuth();

    // Cleanup function for audio player
    return () => {
      if (player) {
        player.pause();
        player.src = "";
      }
    };
  }, [navigate]);

  // Image URL helper function
  const getCloudinaryImageUrl = (imageUrl, fallbackUrl = "/default-cover.jpg") => {
    if (!imageUrl) {
      console.log("Image URL is missing, using fallback");
      return fallbackUrl;
    }

    console.log("Original image URL:", imageUrl);

    // Make sure it's a string
    const url = String(imageUrl);

    // Check if it's a valid URL
    try {
      new URL(url);
      return url;
    } catch (e) {
      console.error("Invalid image URL:", url, e);
      return fallbackUrl;
    }
  };

  // HTML5 Audio Implementation for play/pause
  const handlePlayPause = async (beatId, audioUrl) => {
    try {
      console.log(`Playing beat with ID: ${beatId}`);
      console.log("Audio URL:", audioUrl);

      if (!audioUrl) {
        console.error("No audio URL provided for this beat");
        return;
      }

      // If already playing this beat, toggle play/pause
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

      // Otherwise, start fresh with a new audio player
      setAudioLoading(true);

      // Stop previous audio if playing
      if (player) {
        player.pause();
        player.src = "";
      }

      // Create standard HTML5 Audio element
      const audio = new Audio();

      // Set up event handlers first
      audio.oncanplaythrough = () => {
        setAudioLoading(false);
        audio.play()
          .then(() => {
            console.log("Audio playback started successfully");
            setCurrentlyPlaying(beatId);
          })
          .catch(error => {
            console.error("Failed to start playback:", error);
            setAudioLoading(false);
          });
      };

      audio.onended = () => {
        setCurrentlyPlaying(null);
      };

      audio.onerror = (e) => {
        console.error("Audio playback error:", e);
        console.error("Error code:", audio.error ? audio.error.code : "unknown");
        console.error("Error message:", audio.error ? audio.error.message : "unknown");
        setAudioLoading(false);
        setCurrentlyPlaying(null);
      };

      // Log loading states for debugging
      audio.onloadstart = () => console.log("Audio loading started");
      audio.onprogress = () => console.log("Audio download in progress");
      audio.onstalled = () => console.log("Audio download stalled");

      // Set the source (this triggers loading)
      audio.src = audioUrl;
      audio.load(); // Explicitly start loading

      // Store the audio element
      setPlayer(audio);

    } catch (error) {
      console.error("Audio playback error:", error);
      setAudioLoading(false);
    }
  };

  const handleLogout = () => {
    if (player) {
      player.pause();
      player.src = "";
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleUpgrade = () => {
    navigate("/subscription");
  };

  const toggleUploadForm = () => {
    setShowUploadForm(!showUploadForm);
  };

  const handleUploadComplete = (data) => {
    // Add the new beat to the beats list
    if (data && data.beat) {
      setBeats([data.beat, ...beats]);
    }
    setShowUploadForm(false);
  };

  const handleEditBeat = (beatId) => {
    // Implement edit functionality or navigate to edit page
    navigate(`/edit-beat/${beatId}`);
  };

  const handleDeleteBeat = async (beatId) => {
    try {
      console.log("Setting up delete for beat ID:", beatId); // Debug log
      // Set up confirm dialog
      setShowConfirmDelete(beatId);
    } catch (error) {
      console.error("Error preparing delete:", error);
    }
  };

  const confirmDelete = async (beatId) => {
    try {
      console.log("Deleting beat with ID:", beatId); // Debug log

      // Make sure beatId is not undefined
      if (!beatId) {
        console.error("Beat ID is undefined");
        setError("Cannot delete beat: Invalid ID");
        setShowConfirmDelete(null);
        return;
      }

      const token = localStorage.getItem("token");
      await API.delete(`/api/beats/${beatId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // If the beat being deleted is currently playing, stop it
      if (currentlyPlaying === beatId && player) {
        player.pause();
        player.src = "";
        setPlayer(null);
        setCurrentlyPlaying(null);
      }

      // Remove the beat from the list - support both id and _id
      setBeats(beats.filter(beat => (beat.id !== beatId && beat._id !== beatId)));

      // Reset confirm delete state
      setShowConfirmDelete(null);
    } catch (error) {
      console.error("Error deleting beat:", error);
      setError("Failed to delete beat. Please try again.");
      setShowConfirmDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowConfirmDelete(null);
  };

  // Render dashboard content based on user's role
  const renderDashboardContent = () => {
    if (isLoading) {
      return <div className={styles.loading}>Loading dashboard...</div>;
    }

    if (error) {
      return <div className={styles.error}>{error}</div>;
    }

    if (activePage === "wallet") {
      return <SellerWallet />;
    }

    if (activePage === "purchases") {
      return <PurchasedBeats />;
    }

    if (activePage === "profile") {
      return <EditProfile />;
    }

    if (activePage === "verification") {
      return <DocumentVerification />;
    }

    // Return different content based on user role
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
              <h3>Total Likes</h3>
              <p>{beats.reduce((sum, beat) => sum + (beat.likes || 0), 0)}</p>
            </div>
            <div className={styles.statCard}>
              <h3>Upload Limit</h3>
              <p>{user.subscription?.uploadLimit || 5}</p>
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
                    // Support both id and _id formats
                    const beatId = beat._id || beat.id;
                    return (
                      <div key={beatId} className={styles.beatItem}>
                        <div className={styles.beatImage}>
                          <img
                            src={getCloudinaryImageUrl(beat.coverImage || beat.imageUrl)}
                            alt={beat.title}
                            onError={(e) => {
                              console.error("Image failed to load:", e.target.src);
                              e.target.src = "/default-cover.jpg";
                              e.target.onerror = null;
                            }}
                          />
                        </div>
                        <div className={styles.beatTitle}>{beat.title}</div>
                        <div className={styles.beatGenre}>{beat.genre}</div>
                        <div className={styles.beatPrice}>${beat.price}</div>
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
                          <button
                            className={styles.actionBtn}
                            onClick={() => handleEditBeat(beatId)}
                          >
                            <FaEdit />
                          </button>
                          <button
                            className={styles.actionBtn}
                            onClick={() => handleDeleteBeat(beatId)}
                          >
                            <FaTrash />
                          </button>
                        </div>

                        {showConfirmDelete === beatId && (
                          <div className={styles.confirmDelete}>
                            <p>Are you sure you want to delete <strong>{beat.title}</strong>?</p>
                            <div className={styles.confirmButtons}>
                              <button
                                className={styles.deleteBtn}
                                onClick={() => confirmDelete(beatId)}
                              >
                                Delete
                              </button>
                              <button
                                className={styles.cancelBtn}
                                onClick={cancelDelete}
                              >
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
      // Buyer dashboard content
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

            {/* Add more action cards as needed */}
          </div>
        </div>
      );
    }
  };

  // Main render function for the dashboard
  return (
    <>
      <NavbarBeatExplore />
      <div className={styles.dashboardContainer}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.profileSection}>
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user?.username || user?.name || "User"}
                className={styles.profileIcon}
                onError={(e) => {
                  console.error("Profile image failed to load:", e.target.src);
                  e.target.style.display = 'none';
                  // Show fallback icon if image fails to load
                  const fallbackIcon = document.createElement('div');
                  fallbackIcon.className = styles.profileIconFallback;
                  fallbackIcon.innerHTML = '<FaUserCircle />';
                  e.target.parentNode.appendChild(fallbackIcon);
                }}
              />
            ) : (
              <FaUserCircle className={styles.profileIcon} />
            )}
            <h3>{user?.username || user?.name || "User"}</h3>
            <span className={styles.role}>{user?.role === "seller" ? "Producer" : "Listener"}</span>
            
            {user?.role === "seller" && user?.subscription?.plan && (
              <div 
                className={styles.subscriptionBadge}
                onClick={() => navigate("/subscription")}
              >
                <span className={styles.planName}>{user.subscription.plan}</span>
                <span className={styles.planDetails}>
                  {user.subscription.uploadLimit === Infinity 
                    ? "Unlimited uploads" 
                    : `${beats.length}/${user.subscription.uploadLimit} uploads`}
                </span>
                
                {/* Progress bar for upload limit */}
                {user.subscription.uploadLimit !== Infinity && (
                  <div className={styles.usageBar}>
                    <div 
                      className={styles.usageProgress} 
                      style={{ 
                        width: `${Math.min(100, (beats.length / user.subscription.uploadLimit) * 100)}%`,
                      }}
                    ></div>
                  </div>
                )}
              </div>
            )}
          </div>
          <nav>
            <ul>
              <li className={activePage === "dashboard" ? styles.active : ""} onClick={() => setActivePage("dashboard")}>
                <FaChartLine /> Dashboard
              </li>

              {/* Edit Profile link */}
              <li
                className={activePage === "profile" ? styles.active : ""}
                onClick={() => setActivePage("profile")}
              >
                <FaUserEdit /> Edit Profile
              </li>

              {user?.role === "seller" ? (
                <>
                <li className={activePage === "wallet" ? styles.active : ""} onClick={() => setActivePage("wallet")}>
                  <FaWallet /> Wallet
                </li>
                <li className={activePage === "verification" ? styles.active : ""} onClick={() => setActivePage("verification")}>
                <FaIdCard /> Verify Account
              </li>
              </>
              ) : (
                <li className={activePage === "purchases" ? styles.active : ""} onClick={() => setActivePage("purchases")}>
                  <FaMusic /> Purchased Beats
                </li>
              )}

              {/* <li className={activePage === "settings" ? styles.active : ""} onClick={() => setActivePage("settings")}>
              <FaTools /> {user?.role === "seller" ? "Selling Tools" : "Account Settings"}
            </li> */}

              {/* <li onClick={handleLogout}>
              <FaSignOutAlt /> Logout
            </li> */}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className={styles.mainContent}>
          {showUploadForm ? (
            <>
              <div className={styles.header}>
                <h2>Upload Beat</h2>
                <button
                  className={styles.backBtn}
                  onClick={toggleUploadForm}
                >
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
                        <button
                          className={styles.upgradeBtn}
                          onClick={handleUpgrade}
                        >
                          Upgrade Plan
                        </button>
                      </div>
                    )}
                  </>
                )}

                {activePage === "profile" && (
                  <h2>Edit Profile</h2>
                )}

                {activePage === "wallet" && (
                  <h2>Seller Wallet</h2>
                )}

                {activePage === "purchases" && (
                  <h2>Purchased Beats</h2>
                )}
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