// frontend/src/context/WishlistContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { getBeatId } from '../utils/audioUtils';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load wishlist from localStorage on mount
  useEffect(() => {
    try {
      const savedWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
      setWishlist(savedWishlist);
      console.log(`Loaded ${savedWishlist.length} items from wishlist`);
    } catch (error) {
      console.error('Error loading wishlist:', error);
      setWishlist([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save to localStorage whenever wishlist changes
  useEffect(() => {
    if (!loading) { // Don't save during initial load
      try {
        localStorage.setItem('wishlist', JSON.stringify(wishlist));
        console.log(`Wishlist updated: ${wishlist.length} items`);
      } catch (error) {
        console.error('Error saving wishlist:', error);
      }
    }
  }, [wishlist, loading]);

  // Add beat to wishlist
  const addToWishlist = (beat) => {
    if (!beat) return false;

    const beatId = getBeatId(beat);
    const isAlreadyInWishlist = wishlist.some(item => getBeatId(item) === beatId);

    if (isAlreadyInWishlist) {
      console.log(`Beat "${beat.title}" is already in wishlist`);
      return false;
    }

    setWishlist(prev => [...prev, beat]);
    console.log(`Added "${beat.title}" to wishlist`);
    return true;
  };

  // Remove beat from wishlist
  const removeFromWishlist = (beat) => {
    if (!beat) return false;

    const beatId = getBeatId(beat);
    const initialLength = wishlist.length;
    
    setWishlist(prev => prev.filter(item => getBeatId(item) !== beatId));
    
    const wasRemoved = wishlist.length !== initialLength;
    if (wasRemoved) {
      console.log(`Removed "${beat.title}" from wishlist`);
    }
    
    return wasRemoved;
  };

  // Toggle beat in wishlist
  const toggleWishlist = (beat) => {
    if (!beat) return { success: false, action: null };

    const beatId = getBeatId(beat);
    const isInWishlist = wishlist.some(item => getBeatId(item) === beatId);

    if (isInWishlist) {
      const success = removeFromWishlist(beat);
      return { 
        success, 
        action: 'removed', 
        message: `${beat.title} removed from wishlist` 
      };
    } else {
      const success = addToWishlist(beat);
      return { 
        success, 
        action: 'added', 
        message: `${beat.title} added to wishlist!` 
      };
    }
  };

  // Check if beat is in wishlist
  const isInWishlist = (beat) => {
    if (!beat) return false;
    const beatId = getBeatId(beat);
    return wishlist.some(item => getBeatId(item) === beatId);
  };

  // Get wishlist count
  const getWishlistCount = () => wishlist.length;

  // Clear entire wishlist
  const clearWishlist = () => {
    setWishlist([]);
    console.log('Wishlist cleared');
  };

  // Get wishlist items (for wishlist page)
  const getWishlist = () => wishlist;

  const value = {
    wishlist,
    loading,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isInWishlist,
    getWishlistCount,
    clearWishlist,
    getWishlist
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};

// Custom hook to use the wishlist context
export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};