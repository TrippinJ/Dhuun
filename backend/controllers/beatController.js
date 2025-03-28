const Beat = require('../models/beat');
const User = require('../models/user');
const fs = require('fs');
const path = require('path');

// Get all beats with optional filtering
exports.getAllBeats = async (req, res) => {
  try {
    // Build query based on filter parameters
    const query = {};
    
    // Apply filters if provided
    if (req.query.genre) query.genre = req.query.genre;
    if (req.query.producer) query.producer = req.query.producer;
    if (req.query.minPrice) query.price = { $gte: parseFloat(req.query.minPrice) };
    if (req.query.maxPrice) {
      if (query.price) {
        query.price.$lte = parseFloat(req.query.maxPrice);
      } else {
        query.price = { $lte: parseFloat(req.query.maxPrice) };
      }
    }
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Sorting
    const sortField = req.query.sortField || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortField]: sortOrder };
    
    // Execute query
    const beats = await Beat.find(query)
      .populate('producer', 'name username')
      .sort(sort)
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const total = await Beat.countDocuments(query);
    
    // Format response
    const formattedBeats = beats.map(beat => ({
      id: beat._id,
      title: beat.title,
      producer: {
        id: beat.producer._id,
        name: beat.producer.name,
        username: beat.producer.username
      },
      genre: beat.genre,
      bpm: beat.bpm,
      key: beat.key,
      price: beat.price,
      licenseType: beat.licenseType,
      tags: beat.tags,
      plays: beat.plays,
      likes: beat.likes,
      createdAt: beat.createdAt,
      audioUrl: `/api/beats/${beat._id}/audio`,
      imageUrl: `/api/beats/${beat._id}/image`
    }));
    
    res.json({
      beats: formattedBeats,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        hasMore: page < Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching beats:', error);
    res.status(500).json({ message: 'Server error while fetching beats' });
  }
};

// Get a single beat by ID
exports.getBeatById = async (req, res) => {
  try {
    const beat = await Beat.findById(req.params.id)
      .populate('producer', 'name username');
    
    if (!beat) {
      return res.status(404).json({ message: 'Beat not found' });
    }
    
    // Format response
    const formattedBeat = {
      id: beat._id,
      title: beat.title,
      producer: {
        id: beat.producer._id,
        name: beat.producer.name,
        username: beat.producer.username
      },
      genre: beat.genre,
      bpm: beat.bpm,
      key: beat.key,
      price: beat.price,
      licenseType: beat.licenseType,
      tags: beat.tags,
      description: beat.description,
      plays: beat.plays,
      likes: beat.likes,
      createdAt: beat.createdAt,
      audioUrl: `/api/beats/${beat._id}/audio`,
      imageUrl: `/api/beats/${beat._id}/image`
    };
    
    res.json(formattedBeat);
  } catch (error) {
    console.error('Error fetching beat:', error);
    res.status(500).json({ message: 'Server error while fetching beat' });
  }
};

// Get beats by producer
exports.getProducerBeats = async (req, res) => {
  try {
    const beats = await Beat.find({ producer: req.user.id })
      .sort({ createdAt: -1 });
    
    // Format response
    const formattedBeats = beats.map(beat => ({
      id: beat._id,
      title: beat.title,
      genre: beat.genre,
      bpm: beat.bpm,
      price: beat.price,
      licenseType: beat.licenseType,
      plays: beat.plays,
      likes: beat.likes,
      createdAt: beat.createdAt,
      audioUrl: `/api/beats/${beat._id}/audio`,
      imageUrl: `/api/beats/${beat._id}/image`
    }));
    
    res.json(formattedBeats);
  } catch (error) {
    console.error('Error fetching producer beats:', error);
    res.status(500).json({ message: 'Server error while fetching beats' });
  }
};

// Create a new beat
exports.createBeat = async (req, res) => {
  try {
    // Check user's upload limit based on subscription
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Count user's existing beats
    const beatCount = await Beat.countDocuments({ producer: req.user.id });
    
    // Get upload limit from user's subscription (default to 5 if not defined)
    const uploadLimit = user.subscription?.uploadLimit || 5;
    
    // Check if user has reached their upload limit
    if (beatCount >= uploadLimit) {
      return res.status(403).json({ 
        message: `You've reached your upload limit of ${uploadLimit} beats. Please upgrade your subscription to upload more.` 
      });
    }
    
    // Process tags if provided
    let tags = [];
    if (req.body.tags) {
      tags = Array.isArray(req.body.tags) 
        ? req.body.tags 
        : req.body.tags.split(',').map(tag => tag.trim());
    }

    // Validate required fields
    if (!req.body.title || !req.body.genre || !req.body.price || !req.body.licenseType) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate files
    if (!req.files || !req.files.audio || !req.files.coverImage) {
      return res.status(400).json({ message: 'Both audio file and cover image are required' });
    }
    
    // Create a new beat
    const newBeat = new Beat({
      title: req.body.title,
      producer: req.user.id,
      genre: req.body.genre,
      bpm: req.body.bpm || null,
      key: req.body.key || null,
      tags: tags,
      price: parseFloat(req.body.price),
      licenseType: req.body.licenseType,
      description: req.body.description || '',
      audioFile: req.files.audio[0].path,
      coverImage: req.files.coverImage[0].path
    });
    
    // Save the beat
    await newBeat.save();
    
    res.status(201).json({
      message: 'Beat uploaded successfully',
      beat: {
        id: newBeat._id,
        title: newBeat.title,
        genre: newBeat.genre,
        price: newBeat.price,
        audioUrl: `/api/beats/${newBeat._id}/audio`,
        imageUrl: `/api/beats/${newBeat._id}/image`
      }
    });
  } catch (error) {
    console.error('Error uploading beat:', error);
    res.status(500).json({ message: 'Server error while uploading beat' });
  }
};

// Update an existing beat
exports.updateBeat = async (req, res) => {
  try {
    const beat = await Beat.findById(req.params.id);
    
    if (!beat) {
      return res.status(404).json({ message: 'Beat not found' });
    }
    
    // Check if user is the producer of the beat
    if (beat.producer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You are not authorized to update this beat' });
    }
    
    // Process tags if provided
    let tags = beat.tags;
    if (req.body.tags) {
      tags = Array.isArray(req.body.tags) 
        ? req.body.tags 
        : req.body.tags.split(',').map(tag => tag.trim());
    }
    
    // Update allowed fields
    if (req.body.title) beat.title = req.body.title;
    if (req.body.genre) beat.genre = req.body.genre;
    if (req.body.bpm) beat.bpm = req.body.bpm;
    if (req.body.key) beat.key = req.body.key;
    if (req.body.price) beat.price = parseFloat(req.body.price);
    if (req.body.licenseType) beat.licenseType = req.body.licenseType;
    if (req.body.description) beat.description = req.body.description;
    beat.tags = tags;
    
    // Save the updated beat
    await beat.save();
    
    res.json({
      message: 'Beat updated successfully',
      beat: {
        id: beat._id,
        title: beat.title,
        genre: beat.genre,
        price: beat.price,
        audioUrl: `/api/beats/${beat._id}/audio`,
        imageUrl: `/api/beats/${beat._id}/image`
      }
    });
  } catch (error) {
    console.error('Error updating beat:', error);
    res.status(500).json({ message: 'Server error while updating beat' });
  }
};

// Delete a beat
exports.deleteBeat = async (req, res) => {
  try {
    const beat = await Beat.findById(req.params.id);
    
    if (!beat) {
      return res.status(404).json({ message: 'Beat not found' });
    }
    
    // Check if user is the producer of the beat
    if (beat.producer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You are not authorized to delete this beat' });
    }
    
    // Delete the audio and image files
    try {
      if (fs.existsSync(beat.audioFile)) {
        fs.unlinkSync(beat.audioFile);
      }
      
      if (fs.existsSync(beat.coverImage)) {
        fs.unlinkSync(beat.coverImage);
      }
    } catch (fileError) {
      console.error('Error deleting files:', fileError);
      // Continue with beat deletion even if files cannot be deleted
    }
    
    // Delete the beat from the database
    await Beat.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Beat deleted successfully' });
  } catch (error) {
    console.error('Error deleting beat:', error);
    res.status(500).json({ message: 'Server error while deleting beat' });
  }
};

// Stream audio file
exports.streamAudio = async (req, res) => {
  try {
    const beat = await Beat.findById(req.params.id);
    
    if (!beat) {
      return res.status(404).json({ message: 'Beat not found' });
    }
    
    // Increment play count
    beat.plays += 1;
    await beat.save();
    
    // Stream the audio file
    const audioPath = path.resolve(beat.audioFile);
    
    // Check if file exists
    if (!fs.existsSync(audioPath)) {
      return res.status(404).json({ message: 'Audio file not found' });
    }
    
    const stat = fs.statSync(audioPath);
    const fileSize = stat.size;
    const range = req.headers.range;
    
    if (range) {
      // Handle range requests for audio streaming
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(audioPath, { start, end });
      
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'audio/mpeg',
      };
      
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      // Handle non-range requests
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'audio/mpeg',
      };
      
      res.writeHead(200, head);
      fs.createReadStream(audioPath).pipe(res);
    }
  } catch (error) {
    console.error('Error streaming audio:', error);
    res.status(500).json({ message: 'Server error while streaming audio' });
  }
};

// Get cover image
exports.getCoverImage = async (req, res) => {
  try {
    const beat = await Beat.findById(req.params.id);
    
    if (!beat) {
      return res.status(404).json({ message: 'Beat not found' });
    }
    
    // Send the image file
    const imagePath = path.resolve(beat.coverImage);
    
    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ message: 'Image file not found' });
    }
    
    res.sendFile(imagePath);
  } catch (error) {
    console.error('Error fetching image:', error);
    res.status(500).json({ message: 'Server error while fetching image' });
  }
};

// Like a beat
exports.likeBeat = async (req, res) => {
  try {
    const beat = await Beat.findById(req.params.id);
    
    if (!beat) {
      return res.status(404).json({ message: 'Beat not found' });
    }
    
    // Increment likes
    beat.likes += 1;
    await beat.save();
    
    res.json({ likes: beat.likes });
  } catch (error) {
    console.error('Error liking beat:', error);
    res.status(500).json({ message: 'Server error while liking beat' });
  }
};