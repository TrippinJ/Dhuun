import express from 'express';
import { authenticateUser } from './auth.js';
import User from '../models/user.js';
import Profile from '../models/profile.js';

const router = express.Router();

// Follow a producer
router.post('/follow/:producerId', authenticateUser, async (req, res) => {
  try {
    const followerId = req.user.id;
    const producerId = req.params.producerId;

    // Check if trying to follow self
    if (followerId === producerId) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    // Find both users
    const [follower, producer] = await Promise.all([
      User.findById(followerId),
      User.findById(producerId)
    ]);

    if (!producer) {
      return res.status(404).json({ message: "Producer not found" });
    }

    // Check if already following
    if (follower.following.includes(producerId)) {
      return res.status(400).json({ message: "Already following this producer" });
    }

    // Update relationships
    follower.following.push(producerId);
    follower.followingCount += 1;
    
    producer.followers.push(followerId);
    producer.followersCount += 1;

    // Save both users
    await Promise.all([follower.save(), producer.save()]);

    // Update producer's profile stats
    await Profile.findOneAndUpdate(
      { user: producerId },
      { $inc: { 'stats.followers': 1 } }
    );

    res.json({
      success: true,
      message: "Successfully followed producer",
      isFollowing: true,
      followersCount: producer.followersCount
    });
  } catch (error) {
    console.error('Follow error:', error);
    res.status(500).json({ message: "Error following producer" });
  }
});

// Unfollow a producer
router.post('/unfollow/:producerId', authenticateUser, async (req, res) => {
  try {
    const followerId = req.user.id;
    const producerId = req.params.producerId;

    // Find both users
    const [follower, producer] = await Promise.all([
      User.findById(followerId),
      User.findById(producerId)
    ]);

    if (!producer) {
      return res.status(404).json({ message: "Producer not found" });
    }

    // Check if not following
    if (!follower.following.includes(producerId)) {
      return res.status(400).json({ message: "Not following this producer" });
    }

    // Update relationships
    follower.following = follower.following.filter(id => id.toString() !== producerId);
    follower.followingCount -= 1;
    
    producer.followers = producer.followers.filter(id => id.toString() !== followerId);
    producer.followersCount -= 1;

    // Save both users
    await Promise.all([follower.save(), producer.save()]);

    // Update producer's profile stats
    await Profile.findOneAndUpdate(
      { user: producerId },
      { $inc: { 'stats.followers': -1 } }
    );

    res.json({
      success: true,
      message: "Successfully unfollowed producer",
      isFollowing: false,
      followersCount: producer.followersCount
    });
  } catch (error) {
    console.error('Unfollow error:', error);
    res.status(500).json({ message: "Error unfollowing producer" });
  }
});

// Check if following a producer
router.get('/check/:producerId', authenticateUser, async (req, res) => {
  try {
    const followerId = req.user.id;
    const producerId = req.params.producerId;

    const follower = await User.findById(followerId);
    const isFollowing = follower.following.includes(producerId);

    res.json({
      success: true,
      isFollowing
    });
  } catch (error) {
    console.error('Check follow status error:', error);
    res.status(500).json({ message: "Error checking follow status" });
  }
});

// Get producer's followers
router.get('/followers/:producerId', async (req, res) => {
  try {
    const producerId = req.params.producerId;
    const producer = await User.findById(producerId)
      .populate('followers', 'name username avatar')
      .select('followersCount');

    if (!producer) {
      return res.status(404).json({ message: "Producer not found" });
    }

    res.json({
      success: true,
      followers: producer.followers,
      count: producer.followersCount
    });
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({ message: "Error getting followers" });
  }
});

export default router;