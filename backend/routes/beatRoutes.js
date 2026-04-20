import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authenticateUser } from '../routes/auth.js';
import Beat from '../models/beat.js';
import User from '../models/user.js';
import { v2 as cloudinary } from 'cloudinary';
import * as beatController from '../controllers/beatController.js';
import { getPopularTags } from '../controllers/beatController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Cloudinary config ────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

// ─── Temp upload directory ────────────────────────────────────────────────────
const tempDir = path.join(__dirname, '../temp_uploads');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

// ─── Multer storage ───────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, tempDir),
  filename:    (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// ─── File filter ──────────────────────────────────────────────────────────────
// audio      → tagged MP3  (public preview)
// audioWav   → full WAV    (private, premium + exclusive buyers)
// audioStems → stems ZIP   (private, exclusive buyers only)
// coverImage → JPEG/PNG    (public)
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'audio' || file.fieldname === 'audioWav') {
    if (file.mimetype.startsWith('audio/')) return cb(null, true);
    return cb(new Error('Only audio files are allowed for this field'), false);
  }
  if (file.fieldname === 'audioStems') {
    const allowed = ['application/zip', 'application/x-zip-compressed', 'application/octet-stream'];
    if (allowed.includes(file.mimetype) || file.originalname.endsWith('.zip')) return cb(null, true);
    return cb(new Error('Stems must be uploaded as a ZIP file'), false);
  }
  if (file.fieldname === 'coverImage') {
    if (file.mimetype.startsWith('image/')) return cb(null, true);
    return cb(new Error('Only image files are allowed for cover art'), false);
  }
  cb(new Error('Unexpected upload field: ' + file.fieldname), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB — stems ZIPs can be large
});

// ─── Multer error handler ─────────────────────────────────────────────────────
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 200 MB.' });
    }
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  }
  if (err) return res.status(400).json({ message: err.message });
  next();
};

// ─── Cloudinary helpers ───────────────────────────────────────────────────────

/**
 * Upload a file to Cloudinary.
 * @param {string} filePath   - Local temp path
 * @param {string} folder     - Cloudinary folder
 * @param {string} resourceType - 'video' | 'image' | 'raw'
 * @param {string} type       - 'upload' (public) | 'authenticated' (private)
 */
const uploadToCloudinary = async (filePath, folder, resourceType = 'video', type = 'upload') => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type:   resourceType,
      folder,
      type,             // 'authenticated' = private, requires signed URL to access
      use_filename:    true,
      unique_filename: true,
    });
    fs.unlinkSync(filePath); // remove temp file immediately
    return result;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    // Try to clean up even on failure
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    throw error;
  }
};

/**
 * Delete a file from Cloudinary.
 * Works for both public and authenticated assets.
 */
const deleteFromCloudinary = async (publicId, resourceType = 'video', type = 'upload') => {
  try {
    return await cloudinary.uploader.destroy(publicId, { resource_type: resourceType, type });
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
};

/**
 * Generate a short-lived signed URL for a PRIVATE (authenticated) Cloudinary asset.
 * Used for WAV and Stems downloads — expires in 10 minutes.
 */
const generateSignedDownloadUrl = (publicId, resourceType = 'video') => {
  const expiresAt = Math.floor(Date.now() / 1000) + 600; // 10 minutes
  return cloudinary.url(publicId, {
    resource_type: resourceType,
    secure:        true,
    sign_url:      true,
    expires_at:    expiresAt,
    flags:         'attachment', // forces browser download, not inline playback
    type:          'authenticated',
  });
};

/**
 * Clean up all temp files for a request (called on error).
 */
const cleanupTempFiles = (files) => {
  if (!files) return;
  Object.values(files).flat().forEach(file => {
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
  });
};

// ─── Router ───────────────────────────────────────────────────────────────────
const router = express.Router();

// ── GET / — all beats (public) ────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const beats = await Beat.find({ isExclusiveSold: { $ne: true } })
      .populate('producer', 'name username')
      .sort({ createdAt: -1 });
    res.json(beats);
  } catch (error) {
    console.error('Error fetching beats:', error);
    res.status(500).json({ message: 'Server error while fetching beats' });
  }
});

// ── GET /trending ─────────────────────────────────────────────────────────────
router.get('/trending', beatController.getTrendingBeats);

// ── GET /tags/popular ─────────────────────────────────────────────────────────
router.get('/tags/popular', getPopularTags);

// ── GET /featured ─────────────────────────────────────────────────────────────
router.get('/featured', beatController.getFeaturedBeats);

// ── GET /producer/beats — logged-in producer's own beats ──────────────────────
router.get('/producer/beats', authenticateUser, async (req, res) => {
  try {
    const beats = await Beat.find({ producer: req.user.id }).sort({ createdAt: -1 });
    res.json(beats);
  } catch (error) {
    console.error('Error fetching producer beats:', error);
    res.status(500).json({ message: 'Server error while fetching beats' });
  }
});

// ── GET /producer/:producerId — public producer page beats ────────────────────
router.get('/producer/:producerId', async (req, res) => {
  try {
    const { producerId } = req.params;
    const { limit = 20, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {
      producer:        producerId,
      isPublished:     true,
      isExclusiveSold: { $ne: true },
    };

    const [beats, total] = await Promise.all([
      Beat.find(filter)
        .populate('producer', 'name username')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Beat.countDocuments(filter),
    ]);

    res.status(200).json({
      success:     true,
      count:       beats.length,
      total,
      totalPages:  Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data:        beats,
    });
  } catch (error) {
    console.error('Error fetching producer beats:', error);
    res.status(500).json({ success: false, message: 'Error fetching producer beats', error: error.message });
  }
});

// ── GET /:id — single beat (public) ──────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const beat = await Beat.findById(req.params.id).populate('producer', 'name username');
    if (!beat) return res.status(404).json({ message: 'Beat not found' });
    res.json(beat);
  } catch (error) {
    console.error('Error fetching beat:', error);
    res.status(500).json({ message: 'Server error while fetching beat' });
  }
});

// ── POST / — upload new beat (3 files) ───────────────────────────────────────
router.post('/', authenticateUser, upload.fields([
  { name: 'audio',      maxCount: 1 }, // tagged MP3  — required, PUBLIC
  { name: 'audioWav',   maxCount: 1 }, // full WAV    — required, PRIVATE
  { name: 'audioStems', maxCount: 1 }, // stems ZIP   — optional, PRIVATE
  { name: 'coverImage', maxCount: 1 }, // cover art   — required, PUBLIC
]), handleMulterError, async (req, res) => {
  try {
    // ── Auth / limits ───────────────────────────────────────────────────────
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const beatCount   = await Beat.countDocuments({ producer: req.user.id });
    const uploadLimit = user.subscription?.uploadLimit || 5;
    if (beatCount >= uploadLimit) {
      cleanupTempFiles(req.files);
      return res.status(403).json({
        message: `You've reached your upload limit of ${uploadLimit} beats. Please upgrade your subscription.`,
      });
    }

    // ── Validate required fields ────────────────────────────────────────────
    const { title, genre, price, licenseTypes, bpm, key, tags, description } = req.body;
    if (!title || !genre || !price || !licenseTypes) {
      cleanupTempFiles(req.files);
      return res.status(400).json({ message: 'title, genre, price, and licenseTypes are required' });
    }

    // ── Validate required files ─────────────────────────────────────────────
    if (!req.files?.audio || !req.files?.audioWav || !req.files?.coverImage) {
      cleanupTempFiles(req.files);
      return res.status(400).json({
        message: 'Three files are required: tagged MP3 (audio), full WAV (audioWav), and cover image (coverImage). Stems ZIP (audioStems) is optional.',
      });
    }

    // ── 1. Tagged MP3 → PUBLIC (used for streaming on explore page) ─────────
    console.log('⏳ Uploading tagged MP3 (public)...');
    const audioResult = await uploadToCloudinary(
      req.files.audio[0].path,
      `dhuun/audio/preview/${req.user.id}`,
      'video',
      'upload', // public
    );

    // ── 2. Full WAV → PRIVATE (premium + exclusive buyers only) ─────────────
    console.log('⏳ Uploading full WAV (private)...');
    const wavResult = await uploadToCloudinary(
      req.files.audioWav[0].path,
      `dhuun/audio/wav/${req.user.id}`,
      'video',
      'authenticated', // private — signed URL required to access
    );

    // ── 3. Stems ZIP → PRIVATE (exclusive buyers only) — optional ───────────
    let stemsPublicId = null;
    if (req.files.audioStems?.[0]) {
      console.log('⏳ Uploading stems ZIP (private)...');
      const stemsResult = await uploadToCloudinary(
        req.files.audioStems[0].path,
        `dhuun/audio/stems/${req.user.id}`,
        'raw',           // ZIP files must use resource_type: raw
        'authenticated', // private
      );
      stemsPublicId = stemsResult.public_id;
    }

    // ── 4. Cover image → PUBLIC ──────────────────────────────────────────────
    console.log('⏳ Uploading cover image (public)...');
    const imageResult = await uploadToCloudinary(
      req.files.coverImage[0].path,
      `dhuun/images/${req.user.id}`,
      'image',
      'upload', // public
    );

    // ── Parse tags & license types ───────────────────────────────────────────
    const processedTags = tags
      ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())).filter(Boolean)
      : [];

    let parsedLicenseTypes = [];
    try {
      parsedLicenseTypes = JSON.parse(licenseTypes);
    } catch {
      console.error('Error parsing licenseTypes JSON');
    }

    // ── Save beat ────────────────────────────────────────────────────────────
    // IMPORTANT: audioWavPublicId and audioStemsPublicId store the Cloudinary
    // public ID only — never the URL. URLs are generated on-demand (signed, expiring).
    const newBeat = new Beat({
      title:       title.trim(),
      producer:    req.user.id,
      genre:       genre.trim(),
      bpm:         bpm ? parseInt(bpm) : null,
      key:         key || null,
      tags:        processedTags,
      price:       parseFloat(price),
      licenseTypes: parsedLicenseTypes,
      description: description?.trim() || '',
      isPublished:  true,

      // Public MP3 — URL is safe to store and serve to the client
      audioFile:    audioResult.secure_url,
      audioPublicId: audioResult.public_id,

      // Private WAV — store public ID only, never the URL
      audioWavPublicId: wavResult.public_id,

      // Private Stems — store public ID only (null if not uploaded)
      audioStemsPublicId: stemsPublicId,

      // Public cover image
      coverImage:  imageResult.secure_url,
      imagePublicId: imageResult.public_id,
    });

    await newBeat.save();
    console.log(`✅ Beat saved: ${newBeat._id}`);

    res.status(201).json({
      message: 'Beat uploaded successfully',
      beat: {
        id:           newBeat._id,
        title:        newBeat.title,
        genre:        newBeat.genre,
        price:        newBeat.price,
        audioFile:    newBeat.audioFile,   // public MP3 URL (safe to send)
        coverImage:   newBeat.coverImage,
        hasWav:       true,                // always true — WAV is required
        hasStems:     !!stemsPublicId,     // true if stems were uploaded
      },
    });

  } catch (error) {
    console.error('Error uploading beat:', error);
    cleanupTempFiles(req.files);
    res.status(500).json({ message: 'Server error while uploading beat' });
  }
});

// ── GET /:orderId/download/:beatId — secure download (auth required) ──────────
// Returns signed, expiring URLs based on the buyer's license tier.
// basic    → tagged MP3 public URL (still gated by order ownership check)
// premium  → MP3 + signed WAV URL (10 min expiry)
// exclusive→ MP3 + signed WAV URL + signed Stems URL (10 min expiry each)
router.get('/:orderId/download/:beatId', authenticateUser, async (req, res) => {
  try {
    const { orderId, beatId } = req.params;

    // Lazy import to avoid circular dependency
    const Order = (await import('../models/order.js')).default;

    // Verify this user actually purchased this beat
    const order = await Order.findOne({ _id: orderId, user: req.user.id });
    if (!order) {
      return res.status(403).json({ message: 'Order not found or unauthorized' });
    }

    // Find the specific item in the order
    const item = order.items.find(
      i => (i.beat?.toString() ?? i.beatId?.toString()) === beatId
    );
    if (!item) {
      return res.status(403).json({ message: 'This beat was not part of that order' });
    }

    const beat = await Beat.findById(beatId)
      .select('audioFile audioPublicId audioWavPublicId audioStemsPublicId title');
    if (!beat) {
      return res.status(404).json({ message: 'Beat not found' });
    }

    const license = (item.license || 'basic').toLowerCase();
    const urls    = {};

    // All tiers get the tagged MP3 (public URL, but access is controlled here)
    urls.mp3 = beat.audioFile;

    // Premium & Exclusive → full WAV (private, signed URL)
    if ((license === 'premium' || license === 'exclusive') && beat.audioWavPublicId) {
      urls.wav = generateSignedDownloadUrl(beat.audioWavPublicId, 'video');
    }

    // Exclusive only → stems ZIP (private, signed URL)
    if (license === 'exclusive' && beat.audioStemsPublicId) {
      urls.stems = generateSignedDownloadUrl(beat.audioStemsPublicId, 'raw');
    }

    return res.json({
      success:   true,
      title:     beat.title,
      license,
      urls,        // only contains what this license tier allows
      expiresIn: 600, // seconds — client should not cache WAV/stems URLs
    });

  } catch (error) {
    console.error('[download]', error);
    res.status(500).json({ message: 'Failed to generate download link' });
  }
});

// ── PUT /:id — update beat (authorized) ──────────────────────────────────────
router.put('/:id', authenticateUser, upload.fields([
  { name: 'audio',      maxCount: 1 },
  { name: 'audioWav',   maxCount: 1 },
  { name: 'audioStems', maxCount: 1 },
  { name: 'coverImage', maxCount: 1 },
]), handleMulterError, async (req, res) => {
  try {
    const beat = await Beat.findById(req.params.id);
    if (!beat) return res.status(404).json({ message: 'Beat not found' });

    if (beat.producer.toString() !== req.user.id) {
      cleanupTempFiles(req.files);
      return res.status(403).json({ message: 'You are not authorized to update this beat' });
    }

    // Update metadata fields
    if (req.body.title)       beat.title       = req.body.title.trim();
    if (req.body.genre)       beat.genre       = req.body.genre.trim();
    if (req.body.bpm)         beat.bpm         = parseInt(req.body.bpm);
    if (req.body.key)         beat.key         = req.body.key;
    if (req.body.price)       beat.price       = parseFloat(req.body.price);
    if (req.body.description) beat.description = req.body.description.trim();
    if (req.body.tags) {
      beat.tags = Array.isArray(req.body.tags)
        ? req.body.tags
        : req.body.tags.split(',').map(t => t.trim()).filter(Boolean);
    }
    if (req.body.licenseTypes) {
      try { beat.licenseTypes = JSON.parse(req.body.licenseTypes); } catch {}
    }

    if (req.files) {
      // Replace tagged MP3 (public)
      if (req.files.audio?.[0]) {
        if (beat.audioPublicId) await deleteFromCloudinary(beat.audioPublicId, 'video', 'upload');
        const r = await uploadToCloudinary(req.files.audio[0].path, `dhuun/audio/preview/${req.user.id}`, 'video', 'upload');
        beat.audioFile    = r.secure_url;
        beat.audioPublicId = r.public_id;
      }

      // Replace full WAV (private)
      if (req.files.audioWav?.[0]) {
        if (beat.audioWavPublicId) await deleteFromCloudinary(beat.audioWavPublicId, 'video', 'authenticated');
        const r = await uploadToCloudinary(req.files.audioWav[0].path, `dhuun/audio/wav/${req.user.id}`, 'video', 'authenticated');
        beat.audioWavPublicId = r.public_id; // store public ID only
      }

      // Replace stems ZIP (private)
      if (req.files.audioStems?.[0]) {
        if (beat.audioStemsPublicId) await deleteFromCloudinary(beat.audioStemsPublicId, 'raw', 'authenticated');
        const r = await uploadToCloudinary(req.files.audioStems[0].path, `dhuun/audio/stems/${req.user.id}`, 'raw', 'authenticated');
        beat.audioStemsPublicId = r.public_id; // store public ID only
      }

      // Replace cover image (public)
      if (req.files.coverImage?.[0]) {
        if (beat.imagePublicId) await deleteFromCloudinary(beat.imagePublicId, 'image', 'upload');
        const r = await uploadToCloudinary(req.files.coverImage[0].path, `dhuun/images/${req.user.id}`, 'image', 'upload');
        beat.coverImage  = r.secure_url;
        beat.imagePublicId = r.public_id;
      }
    }

    await beat.save();

    res.json({
      message: 'Beat updated successfully',
      beat: {
        id:        beat._id,
        title:     beat.title,
        genre:     beat.genre,
        price:     beat.price,
        audioFile: beat.audioFile,
        coverImage: beat.coverImage,
        hasWav:    !!beat.audioWavPublicId,
        hasStems:  !!beat.audioStemsPublicId,
      },
    });
  } catch (error) {
    console.error('Error updating beat:', error);
    cleanupTempFiles(req.files);
    res.status(500).json({ message: 'Server error while updating beat' });
  }
});

// ── DELETE /:id — delete beat (authorized) ────────────────────────────────────
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const beat = await Beat.findById(req.params.id);
    if (!beat) return res.status(404).json({ message: 'Beat not found' });

    if (beat.producer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You are not authorized to delete this beat' });
    }

    // Delete all Cloudinary assets — failures are logged but don't block deletion
    await Promise.allSettled([
      beat.audioPublicId      && deleteFromCloudinary(beat.audioPublicId,      'video', 'upload'),
      beat.audioWavPublicId   && deleteFromCloudinary(beat.audioWavPublicId,   'video', 'authenticated'),
      beat.audioStemsPublicId && deleteFromCloudinary(beat.audioStemsPublicId, 'raw',   'authenticated'),
      beat.imagePublicId      && deleteFromCloudinary(beat.imagePublicId,      'image', 'upload'),
    ].filter(Boolean));

    await Beat.findByIdAndDelete(req.params.id);
    res.json({ message: 'Beat deleted successfully' });

  } catch (error) {
    console.error('Error deleting beat:', error);
    res.status(500).json({ message: 'Server error while deleting beat' });
  }
});

// ── POST /:id/like — like a beat ──────────────────────────────────────────────
router.post('/:id/like', authenticateUser, async (req, res) => {
  try {
    const beat = await Beat.findById(req.params.id);
    if (!beat) return res.status(404).json({ message: 'Beat not found' });
    beat.likes = (beat.likes || 0) + 1;
    await beat.save();
    res.json({ likes: beat.likes });
  } catch (error) {
    console.error('Error liking beat:', error);
    res.status(500).json({ message: 'Server error while liking beat' });
  }
});

export default router;