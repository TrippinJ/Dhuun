const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { authenticateUser } = require('../routes/auth');
const Beat = require('../models/beat');
const User = require('../models/user');

// Set up storage for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create directories if they don't exist
    const userId = req.user.id;
    const userDir = path.join(__dirname, '../uploads/users', userId);
    const audioDir = path.join(userDir, 'audio');
    const imageDir = path.join(userDir, 'images');
    
    // Create directories if they don't exist
    if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });
    if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir);
    if (!fs.existsSync(imageDir)) fs.mkdirSync(imageDir);
    
    // Determine destination based on file type
    if (file.fieldname === 'audio') {
      cb(null, audioDir);
    } else if (file.fieldname === 'coverImage') {
      cb(null, imageDir);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp and original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Set up file filter to only accept certain file types
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'audio') {
    // Accept only audio files
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed!'), false);
    }
  } else if (file.fieldname === 'coverImage') {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
};

// Set up multer with storage and file filter
const upload = multer({ 
  storage: storage, 
  fileFilter: fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // Limit file size to 50MB
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // A multer error occurred when uploading
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 50MB.' });
    }
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  } else if (err) {
    // A different error occurred
    return res.status(400).json({ message: err.message });
  }
  next();
};

// Get all beats (public route)
router.get('/', async (req, res) => {
  try {
    const beats = await Beat.find()
      .populate('producer', 'name username')
      .sort({ createdAt: -1 });
    
    res.json(beats);
  } catch (error) {
    console.error('Error fetching beats:', error);
    res.status(500).json({ message: 'Server error while fetching beats' });
  }
});

// Get a single beat by ID (public route)
router.get('/:id', async (req, res) => {
  try {
    const beat = await Beat.findById(req.params.id)
      .populate('producer', 'name username');
    
    if (!beat) {
      return res.status(404).json({ message: 'Beat not found' });
    }
    
    res.json(beat);
  } catch (error) {
    console.error('Error fetching beat:', error);
    res.status(500).json({ message: 'Server error while fetching beat' });
  }
});

// Get beats by producer (authorized route)
router.get('/producer/beats', authenticateUser, async (req, res) => {
  try {
    const beats = await Beat.find({ producer: req.user.id })
      .sort({ createdAt: -1 });
    
    res.json(beats);
  } catch (error) {
    console.error('Error fetching producer beats:', error);
    res.status(500).json({ message: 'Server error while fetching beats' });
  }
});

// Create new beat (authorized route)
router.post('/', authenticateUser, upload.fields([
  { name: 'audio', maxCount: 1 },
  { name: 'coverImage', maxCount: 1 }
]), handleMulterError, async (req, res) => {
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
    if (!req.files.audio || !req.files.coverImage) {
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
        audioFile: newBeat.audioFile,
        coverImage: newBeat.coverImage
      }
    });
  } catch (error) {
    console.error('Error uploading beat:', error);
    res.status(500).json({ message: 'Server error while uploading beat' });
  }
});

// Update a beat (authorized route)
router.put('/:id', authenticateUser, async (req, res) => {
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
        price: beat.price
      }
    });
  } catch (error) {
    console.error('Error updating beat:', error);
    res.status(500).json({ message: 'Server error while updating beat' });
  }
});

// Delete a beat (authorized route)
router.delete('/:id', authenticateUser, async (req, res) => {
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
});

// Stream audio file (public route)
router.get('/:id/audio', async (req, res) => {
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
});

// Get cover image (public route)
router.get('/:id/image', async (req, res) => {
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
});

// Like a beat (authorized route)
router.post('/:id/like', authenticateUser, async (req, res) => {
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
});

module.exports = router;