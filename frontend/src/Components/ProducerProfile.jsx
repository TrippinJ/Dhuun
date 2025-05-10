import React, { useState, useEffect } from 'react';
import { FaUserCircle, FaMusic, FaHeart, FaTimes, FaComment, FaPlay, FaPause, FaCheckCircle} from 'react-icons/fa';
import API from '../api/api';
import styles from '../css/ProducerProfile.module.css';
import { useAudio } from '../context/AudioContext';

const ProducerProfile = ({ producerId, isOpen, onClose }) => {
  const [producer, setProducer] = useState(null);
  const [beats, setBeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [error, setError] = useState(null);
  const { playTrack, currentTrack, isPlaying } = useAudio();

  useEffect(() => {
    if (isOpen && producerId) {
      fetchProducerData();
      checkFollowStatus();
    }
  }, [isOpen, producerId]);

  const fetchProducerData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch producer profile
      const profileRes = await API.get(`/api/profile/${producerId}`);
      const profileData = profileRes.data;

      // Set producer data with fallbacks
      setProducer({
        ...profileData,
        name: profileData.user?.name || profileData.username,
        avatar: profileData.user?.avatar || profileData.avatar,
        bio: profileData.user?.bio || profileData.bio || '',
        username: profileData.username || profileData.user?.username,
        verificationStatus: profileData.user?.verificationStatus
      });

      // Use user's followersCount as the source of truth
      setFollowersCount(profileData.user?.followersCount || profileData.stats?.followers || 0);

      // Fetch producer's beats
      const beatsRes = await API.get(`/api/beats/producer/${producerId}`);
      setBeats(beatsRes.data.data || []);
    } catch (error) {
      console.error('Error fetching producer data:', error);
      setError('Failed to load producer profile');
    } finally {
      setLoading(false);
    }
  };

  const checkFollowStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await API.get(`/api/follow/check/${producerId}`);
      setIsFollowing(response.data.isFollowing);
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const handleFollow = async () => {
    try {
      const endpoint = isFollowing
        ? `/api/follow/unfollow/${producerId}`
        : `/api/follow/follow/${producerId}`;

      const response = await API.post(endpoint);

      if (response.data.success) {
        setIsFollowing(!isFollowing);
        setFollowersCount(response.data.followersCount);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      alert(error.response?.data?.message || 'Failed to update follow status');
    }
  };

  const handlePlayBeat = (beat) => {
    playTrack(beat);
  };

  const handleMessage = () => {
    // TODO: Implement messaging functionality
    alert('Messaging feature coming soon!');
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          <FaTimes />
        </button>

        {loading ? (
          <div className={styles.loading}>Loading producer profile...</div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : producer ? (
          <div className={styles.content}>
            {/* Producer Header */}
            <div className={styles.header}>
              <div className={styles.avatarSection}>
                {producer.avatar ? (
                  <img
                    src={producer.user.avatar}
                    alt={producer.user.name}
                    className={styles.avatar}
                  />
                ) : (
                  <FaUserCircle className={styles.avatarPlaceholder} />
                )}
                <div className={styles.producerInfo}>
                  <h2 className={styles.producerName}>
                    {producer.name}
                    {producer.verificationStatus === 'approved' && (
                      <FaCheckCircle className={styles.verifiedBadge} />
                    )}
                  </h2>
                  <p className={styles.username}>@{producer.username}</p>
                  <div className={styles.stats}>
                    <span>{followersCount} followers</span>
                    <span>{beats.length} beats</span>
                  </div>
                </div>
              </div>

              <div className={styles.actions}>
                <button
                  className={`${styles.followButton} ${isFollowing ? styles.following : ''}`}
                  onClick={handleFollow}
                >
                  <FaHeart />
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
                <button className={styles.messageButton} onClick={handleMessage}>
                  <FaComment />
                  Message
                </button>
              </div>
            </div>

            {/* Bio Section */}
            {producer.bio && (
              <div className={styles.bioSection}>
                <p className={styles.bio}>{producer.bio}</p>
              </div>
            )}

            {/* Social Links */}
            {producer.socialLinks && Object.keys(producer.socialLinks).length > 0 && (
              <div className={styles.socialLinks}>
                {producer.socialLinks.instagram && (
                  <a href={producer.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                    Instagram
                  </a>
                )}
                {producer.socialLinks.twitter && (
                  <a href={producer.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                    Twitter
                  </a>
                )}
                {producer.socialLinks.youtube && (
                  <a href={producer.socialLinks.youtube} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                    YouTube
                  </a>
                )}
                {producer.socialLinks.soundcloud && (
                  <a href={producer.socialLinks.soundcloud} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                    SoundCloud
                  </a>
                )}
              </div>
            )}

            {/* Beats Section */}
            <div className={styles.beatsSection}>
              <h3>Latest Beats</h3>
              <div className={styles.beatsList}>
                {beats.length > 0 ? (
                  beats.slice(0, 6).map((beat) => (
                    <div key={beat._id} className={styles.beatCard}>
                      <div className={styles.beatImageContainer}>
                        <img
                          src={beat.coverImage || '/default-cover.jpg'}
                          alt={beat.title}
                          className={styles.beatImage}
                        />
                        <button
                          className={styles.playButton}
                          onClick={() => handlePlayBeat(beat)}
                        >
                          {currentTrack?._id === beat._id && isPlaying ? (
                            <FaPause />
                          ) : (
                            <FaPlay />
                          )}
                        </button>
                      </div>
                      <div className={styles.beatInfo}>
                        <h4 className={styles.beatTitle}>{beat.title}</h4>
                        <p className={styles.beatGenre}>{beat.genre}</p>
                        <p className={styles.beatPrice}>${beat.price?.toFixed(2)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className={styles.noBeats}>No beats uploaded yet</p>
                )}
              </div>
              {beats.length > 6 && (
                <button className={styles.viewAllButton}>
                  View All Beats
                </button>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ProducerProfile;