import CreatorResource from '../models/creatorResource.js';
import { uploadFileToCloudinary, deleteFile } from '../utils/storageManger.js';
import fs from 'fs';

// Get all creator resources with filtering
export const getCreatorResources = async (req, res) => {
  try {
    const { category, type } = req.query;

    const filter = { isActive: true };
    if (category && category !== 'All Courses') {
      filter.category = category;
    }
    if (type) {
      filter.type = type;
    }

    const resources = await CreatorResource.find(filter)
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name username');

    res.json({
      success: true,
      resources,
      total: resources.length
    });
  } catch (error) {
    console.error('Error fetching creator resources:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch educational resources'
    });
  }
};

// Get single resource by ID
export const getCreatorResourceById = async (req, res) => {
  try {
    const { id } = req.params;
    const resource = await CreatorResource.findOne({ _id: id, isActive: true })
      .populate('createdBy', 'name username');

    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    res.json({ success: true, resource });
  } catch (error) {
    console.error('Error fetching resource:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch resource' });
  }
};

// Create new creator resource (Admin only)
export const createCreatorResource = async (req, res) => {
  try {
    const {
      title, instructor, category, type,
      description, duration, level,
      blogUrl, videoUrl
    } = req.body;

    if (!req.files || !req.files.image) {
      return res.status(400).json({ success: false, message: 'Resource image is required' });
    }

    const imageFile = Array.isArray(req.files.image) ? req.files.image[0] : req.files.image;
    const imageResult = await uploadFileToCloudinary(
      imageFile.path,
      false,
      { folder: 'dhuun/creator-resources' }
    );

    let downloadUrl = null;
    let downloadPublicId = null;

    if (type === 'pdf' && req.files.pdfFile) {
      const pdfFile = Array.isArray(req.files.pdfFile) ? req.files.pdfFile[0] : req.files.pdfFile;
      const pdfResult = await uploadFileToCloudinary(
        pdfFile.path,
        false,
        {
          folder: 'dhuun/creator-resources/pdfs',
          resource_type: 'raw'
        }
      );
      downloadUrl = pdfResult.url;
      downloadPublicId = pdfResult.publicId;
    }

    const newResource = new CreatorResource({
      title,
      instructor,
      category,
      type,
      image: imageResult.url,
      imagePublicId: imageResult.publicId,
      description,
      duration,
      level,
      downloadUrl,
      downloadPublicId,
      blogUrl: type === 'blog' ? blogUrl : undefined,
      videoUrl: type === 'video' ? videoUrl : undefined,
      createdBy: req.user.id
    });

    await newResource.save();

    res.status(201).json({
      success: true,
      message: 'Creator resource created successfully',
      resource: newResource
    });
  } catch (error) {
    console.error('Error creating creator resource:', error);

    if (req.files) {
      Object.keys(req.files).forEach(key => {
        const files = Array.isArray(req.files[key]) ? req.files[key] : [req.files[key]];
        files.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create creator resource'
    });
  }
};

// Update creator resource (Admin only)
export const updateCreatorResource = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title, instructor, category, type,
      description, duration, level,
      blogUrl, videoUrl, isActive
    } = req.body;

    const resource = await CreatorResource.findById(id);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    if (title) resource.title = title;
    if (instructor) resource.instructor = instructor;
    if (category) resource.category = category;
    if (type) resource.type = type;
    if (description) resource.description = description;
    if (duration) resource.duration = duration;
    if (level) resource.level = level;
    if (blogUrl !== undefined) resource.blogUrl = blogUrl;
    if (videoUrl !== undefined) resource.videoUrl = videoUrl;
    if (isActive !== undefined) resource.isActive = isActive;

    if (req.files?.image) {
      const imageFile = Array.isArray(req.files.image) ? req.files.image[0] : req.files.image;
      const imageResult = await uploadFileToCloudinary(
        imageFile.path,
        false,
        { folder: 'dhuun/creator-resources' }
      );
      if (resource.imagePublicId) await deleteFile(resource.imagePublicId, 'image');
      resource.image = imageResult.url;
      resource.imagePublicId = imageResult.publicId;
    }

    if (req.files?.pdfFile) {
      const pdfFile = Array.isArray(req.files.pdfFile) ? req.files.pdfFile[0] : req.files.pdfFile;
      const pdfResult = await uploadFileToCloudinary(
        pdfFile.path,
        false,
        {
          folder: 'dhuun/creator-resources/pdfs',
          resource_type: 'raw'
        }
      );
      if (resource.downloadPublicId) await deleteFile(resource.downloadPublicId, 'raw');
      resource.downloadUrl = pdfResult.url;
      resource.downloadPublicId = pdfResult.publicId;
    }

    await resource.save();

    res.json({
      success: true,
      message: 'Creator resource updated successfully',
      resource
    });
  } catch (error) {
    console.error('Error updating creator resource:', error);
    if (req.files) {
      Object.keys(req.files).forEach(key => {
        const files = Array.isArray(req.files[key]) ? req.files[key] : [req.files[key]];
        files.forEach(file => {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        });
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to update creator resource'
    });
  }
};

// Delete creator resource (Admin only)
export const deleteCreatorResource = async (req, res) => {
  try {
    const { id } = req.params;

    const resource = await CreatorResource.findById(id);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    try {
      if (resource.imagePublicId) await deleteFile(resource.imagePublicId, 'image');
      if (resource.downloadPublicId) await deleteFile(resource.downloadPublicId, 'raw');
    } catch (deleteError) {
      console.error('Error deleting files:', deleteError);
    }

    await CreatorResource.findByIdAndDelete(id);

    res.json({ success: true, message: 'Creator resource deleted successfully' });
  } catch (error) {
    console.error('Error deleting creator resource:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete creator resource'
    });
  }
};
