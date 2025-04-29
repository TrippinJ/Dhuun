import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaEdit, FaTrash, FaStar, FaRegStar, FaPlay, FaPause } from 'react-icons/fa';
import API from '../../api/api';
import styles from '../../css/Admin/AdminBeats.module.css';

const AdminBeats = () => {
  const navigate = useNavigate();
  const [beats, setBeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [genreFilter, setGenreFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [playingId, setPlayingId] = useState(null);
  const [audioPlayer, setAudioPlayer] = useState(new Audio());

  useEffect(() => {
    fetchBeats();
    
    // Cleanup audio on unmount
    return () => {
      if (audioPlayer) {
        audioPlayer.pause();
        audioPlayer.src = '';
      }
    };
  }, [currentPage, genreFilter]);

  const fetchBeats = async () => {
    try {
      setLoading(true);
      
      // Build the request URL with filters
      let endpoint = `/api/admin/beats?page=${currentPage}`;
      
      // Add genre filter if not 'all'
      if (genreFilter !== 'all') {
        endpoint += `&genre=${genreFilter}`;
      }
      
      const response = await API.get(endpoint);
      
      if (response.data && response.data.beats) {
        setBeats(response.data.beats);
        setTotalPages(response.data.totalPages || 1);
      } else {
        throw new Error('Invalid response format');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching beats:', error);
      setError('Failed to load beats. Please try again.');
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const response = await API.get(`/api/admin/beats/search?q=${searchTerm}`);
      
      if (response.data && response.data.beats) {
        setBeats(response.data.beats);
        setTotalPages(response.data.totalPages || 1);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error searching beats:', error);
      setError('Failed to search beats');
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setGenreFilter(e.target.value);
    setCurrentPage(1);
  };

  const handlePlayPreview = (beatId, audioUrl) => {
    // Stop current audio if playing
    if (playingId) {
      audioPlayer.pause();
      
      // If clicking the same beat, just stop playback
      if (playingId === beatId) {
        setPlayingId(null);
        return;
      }
    }
    
    // Play new audio
    audioPlayer.src = audioUrl;
    audioPlayer.play();
    setPlayingId(beatId);
    
    // Handle when audio ends
    audioPlayer.onended = () => {
      setPlayingId(null);
    };
  };

  const handleToggleFeatured = async (beatId, isFeatured) => {
    try {
      const response = await API.patch(`/api/admin/beats/${beatId}/featured`, {
        isFeatured: !isFeatured
      });
      
      // Update the beat in the current state
      if (response.data && response.data.success) {
        setBeats(beats.map(beat => 
          beat._id === beatId ? {...beat, isFeatured: !isFeatured} : beat
        ));
        alert(`Beat ${!isFeatured ? 'added to' : 'removed from'} featured beats`);
      }
    } catch (error) {
      console.error('Error toggling featured status:', error);
      alert('Failed to update featured status. Please try again.');
    }
  };

  const handleDeleteBeat = async (beatId) => {
    if (window.confirm('Are you sure you want to delete this beat? This action cannot be undone.')) {
      try {
        const response = await API.delete(`/api/admin/beats/${beatId}`);
        
        if (response.data && response.data.success) {
          // Remove the beat from the current state
          setBeats(beats.filter(beat => beat._id !== beatId));
        }
      } catch (error) {
        console.error('Error deleting beat:', error);
        alert('Failed to delete beat. Please try again.');
      }
    }
  };

  // Filter beats based on search term (client-side filtering as backup)
  const filteredBeats = searchTerm 
    ? beats.filter(beat => 
        beat.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        beat.producer?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : beats;

  if (loading) {
    return <div className={styles.loading}>Loading beats...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.beatsContainer}>
      <div className={styles.beatsHeader}>
        <h2>Beats Management</h2>
      </div>

      <div className={styles.beatsControls}>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <input
            type="text"
            placeholder="Search beats or producer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          <button type="submit" className={styles.searchButton}>
            <FaSearch />
          </button>
        </form>

        <select 
          value={genreFilter} 
          onChange={handleFilterChange}
          className={styles.filterSelect}
        >
          <option value="all">All Genres</option>
          <option value="Hip Hop">Hip Hop</option>
          <option value="Trap">Trap</option>
          <option value="R&B">R&B</option>
          <option value="Pop">Pop</option>
          <option value="Lo-Fi">Lo-Fi</option>
          <option value="Drill">Drill</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div className={styles.beatsTable}>
        <div className={styles.tableHeader}>
          <div className={styles.beatCell}>Beat</div>
          <div className={styles.producerCell}>Producer</div>
          <div className={styles.genreCell}>Genre</div>
          <div className={styles.priceCell}>Price</div>
          <div className={styles.statsCell}>Stats</div>
          <div className={styles.actionsCell}>Actions</div>
        </div>

        {filteredBeats.length > 0 ? (
          filteredBeats.map(beat => (
            <div key={beat._id} className={styles.tableRow}>
              <div className={styles.beatCell}>
                <div className={styles.beatInfo}>
                  <div className={styles.beatImageContainer}>
                    <img 
                      src={beat.coverImage} 
                      alt={beat.title} 
                      className={styles.beatImage}
                      onError={(e) => {e.target.src = "/default-cover.jpg"}}
                    />
                    <button 
                      className={styles.playButton}
                      onClick={() => handlePlayPreview(beat._id, beat.audioFile)}
                    >
                      {playingId === beat._id ? <FaPause /> : <FaPlay />}
                    </button>
                  </div>
                  <div className={styles.beatDetails}>
                    <span className={styles.beatTitle}>{beat.title}</span>
                    <span className={styles.beatDate}>
                      {new Date(beat.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className={styles.producerCell}>
                {beat.producer?.name || 'Unknown Producer'}
              </div>
              
              <div className={styles.genreCell}>
                <span className={styles.genreTag}>{beat.genre}</span>
              </div>
              
              <div className={styles.priceCell}>
                ${beat.price?.toFixed(2)}
              </div>
              
              <div className={styles.statsCell}>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Plays:</span>
                  <span className={styles.statValue}>{beat.plays || 0}</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Sales:</span>
                  <span className={styles.statValue}>{beat.purchases || 0}</span>
                </div>
              </div>
              
              <div className={styles.actionsCell}>
                <button 
                  className={styles.actionButton}
                  onClick={() => handleToggleFeatured(beat._id, beat.isFeatured)}
                  title={beat.isFeatured ? 'Remove from Featured' : 'Add to Featured'}
                >
                  {beat.isFeatured ? <FaStar className={styles.featuredStar} /> : <FaRegStar />}
                </button>
                
                <button 
                  className={styles.actionButton}
                  onClick={() => navigate(`/admin/beats/edit/${beat._id}`)}
                  title="Edit Beat"
                >
                  <FaEdit />
                </button>
                
                <button 
                  className={`${styles.actionButton} ${styles.deleteButton}`}
                  onClick={() => handleDeleteBeat(beat._id)}
                  title="Delete Beat"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className={styles.noBeats}>
            <p>No beats found. Try adjusting your search or filter.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className={styles.pagination}>
        <button 
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          className={styles.pageButton}
        >
          Previous
        </button>
        
        <span className={styles.pageInfo}>
          Page {currentPage} of {totalPages}
        </span>
        
        <button 
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          className={styles.pageButton}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default AdminBeats;