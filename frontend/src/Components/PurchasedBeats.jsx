// frontend/src/Components/PurchasedBeats.js
import React, { useState, useEffect } from "react";
import { FaDownload, FaPlay, FaPause, FaInfoCircle } from "react-icons/fa";
import API from "../api/api";
import styles from "../css/PurchasedBeats.module.css";

const PurchasedBeats = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [audioPlayer, setAudioPlayer] = useState(new Audio());

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

        setOrders(response.data);
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
  const handleDownload = (beat) => {
    // Create an anchor element and trigger the download
    const link = document.createElement('a');
    link.href = beat.audioFile;
    link.download = `${beat.title}.mp3`; // Set filename
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      <h2>Your Purchased Beats</h2>
      
      <div className={styles.beatsList}>
        {orders.map((order) => (
          <div key={order._id} className={styles.orderCard}>
            <div className={styles.orderHeader}>
              <h3>Order #{order._id.substring(0, 8)}</h3>
              <span className={styles.orderDate}>
                {new Date(order.createdAt).toLocaleDateString()}
              </span>
            </div>
            
            <div className={styles.beatsGrid}>
              {order.items.map((item, index) => (
                <div key={index} className={styles.beatCard}>
                  <div className={styles.beatImage}>
                    <img 
                      src={item.beat?.coverImage || "/default-cover.jpg"} 
                      alt={item.beat?.title || "Beat"} 
                    />
                    <button 
                      className={styles.playButton}
                      onClick={() => handlePlayPause(item.beat?._id, item.beat?.audioFile)}
                    >
                      {currentlyPlaying === item.beat?._id ? <FaPause /> : <FaPlay />}
                    </button>
                  </div>
                  
                  <div className={styles.beatInfo}>
                    <h4>{item.beat?.title || "Untitled Beat"}</h4>
                    <p>License: {item.license || "Basic"}</p>
                    <div className={styles.beatActions}>
                      <button 
                        className={styles.downloadButton}
                        onClick={() => handleDownload(item.beat)}
                      >
                        <FaDownload /> Download
                      </button>
                      <button className={styles.infoButton}>
                        <FaInfoCircle /> License Info
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PurchasedBeats;