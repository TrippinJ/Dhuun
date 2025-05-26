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

// Create new creator resource (Admin only) - FIXED
export const createCreatorResource = async (req, res) => {
  try {
    console.log('Creating creator resource...');
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);

    const {
      title, instructor, category, type,
      description, duration, level,
      blogUrl, videoUrl
    } = req.body;

    // Validate required fields
    if (!title || !instructor || !category || !type || !description || !duration || !level) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: title, instructor, category, type, description, duration, level' 
      });
    }

    if (!req.files || !req.files.image) {
      return res.status(400).json({ 
        success: false, 
        message: 'Resource image is required' 
      });
    }

    // Handle image file
    const imageFile = Array.isArray(req.files.image) ? req.files.image[0] : req.files.image;
    console.log('Uploading image:', imageFile.path);
    
    const imageResult = await uploadFileToCloudinary(
      imageFile.path,
      false,
      { folder: 'dhuun/creator-resources' }
    );
    console.log('Image uploaded successfully:', imageResult.url);

    let downloadUrl = null;
    let downloadPublicId = null;

    // Handle PDF file if provided and type is PDF
    if (type === 'pdf' && req.files.pdfFile) {
      console.log('Uploading PDF file...');
      const pdfFile = Array.isArray(req.files.pdfFile) ? req.files.pdfFile[0] : req.files.pdfFile;
      
      const pdfResult = await uploadFileToCloudinary(
        pdfFile.path,
        false,
        {
          folder: 'dhuun/creator-resources/pdfs',
          resource_type: 'raw'
        }
      );
      console.log('PDF uploaded successfully:', pdfResult.url);
      
      downloadUrl = pdfResult.url;
      downloadPublicId = pdfResult.publicId;
    }

    // Create the resource object
    const resourceData = {
      title,
      instructor,
      category,
      type,
      image: imageResult.url,
      imagePublicId: imageResult.publicId,
      description,
      duration,
      level,
      createdBy: req.user.id
    };

    // Add type-specific fields
    if (type === 'blog' && blogUrl) {
      resourceData.blogUrl = blogUrl;
    }
    if (type === 'video' && videoUrl) {
      resourceData.videoUrl = videoUrl;
    }
    if (type === 'pdf') {
      resourceData.downloadUrl = downloadUrl;
      resourceData.downloadPublicId = downloadPublicId;
    }

    console.log('Creating resource with data:', resourceData);

    const newResource = new CreatorResource(resourceData);
    await newResource.save();

    console.log('Resource created successfully:', newResource._id);

    res.status(201).json({
      success: true,
      message: 'Creator resource created successfully',
      resource: newResource
    });
  } catch (error) {
    console.error('Error creating creator resource:', error);
    console.error('Error stack:', error.stack);

    // Clean up uploaded files on error
    if (req.files) {
      Object.keys(req.files).forEach(key => {
        const files = Array.isArray(req.files[key]) ? req.files[key] : [req.files[key]];
        files.forEach(file => {
          if (file && file.path && fs.existsSync(file.path)) {
            try {
              fs.unlinkSync(file.path);
              console.log('Cleaned up temp file:', file.path);
            } catch (cleanupError) {
              console.error('Error cleaning up temp file:', cleanupError);
            }
          }
        });
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create creator resource: ' + error.message,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
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

    console.log('Updating resource:', id);
    console.log('Update data:', req.body);

    const resource = await CreatorResource.findById(id);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    // Update basic fields
    if (title !== undefined) resource.title = title;
    if (instructor !== undefined) resource.instructor = instructor;
    if (category !== undefined) resource.category = category;
    if (type !== undefined) resource.type = type;
    if (description !== undefined) resource.description = description;
    if (duration !== undefined) resource.duration = duration;
    if (level !== undefined) resource.level = level;
    if (blogUrl !== undefined) resource.blogUrl = blogUrl;
    if (videoUrl !== undefined) resource.videoUrl = videoUrl;
    if (isActive !== undefined) resource.isActive = isActive;

    // Handle file updates
    if (req.files?.image) {
      console.log('Updating image...');
      const imageFile = Array.isArray(req.files.image) ? req.files.image[0] : req.files.image;
      const imageResult = await uploadFileToCloudinary(
        imageFile.path,
        false,
        { folder: 'dhuun/creator-resources' }
      );
      
      // Delete old image
      if (resource.imagePublicId) {
        try {
          await deleteFile(resource.imagePublicId, 'image');
        } catch (deleteError) {
          console.error('Error deleting old image:', deleteError);
        }
      }
      
      resource.image = imageResult.url;
      resource.imagePublicId = imageResult.publicId;
    }

    if (req.files?.pdfFile) {
      console.log('Updating PDF file...');
      const pdfFile = Array.isArray(req.files.pdfFile) ? req.files.pdfFile[0] : req.files.pdfFile;
      const pdfResult = await uploadFileToCloudinary(
        pdfFile.path,
        false,
        {
          folder: 'dhuun/creator-resources/pdfs',
          resource_type: 'raw'
        }
      );
      
      // Delete old PDF
      if (resource.downloadPublicId) {
        try {
          await deleteFile(resource.downloadPublicId, 'raw');
        } catch (deleteError) {
          console.error('Error deleting old PDF:', deleteError);
        }
      }
      
      resource.downloadUrl = pdfResult.url;
      resource.downloadPublicId = pdfResult.publicId;
    }

    await resource.save();
    console.log('Resource updated successfully');

    res.json({
      success: true,
      message: 'Creator resource updated successfully',
      resource
    });
  } catch (error) {
    console.error('Error updating creator resource:', error);
    
    // Clean up temp files
    if (req.files) {
      Object.keys(req.files).forEach(key => {
        const files = Array.isArray(req.files[key]) ? req.files[key] : [req.files[key]];
        files.forEach(file => {
          if (file && file.path && fs.existsSync(file.path)) {
            try {
              fs.unlinkSync(file.path);
            } catch (cleanupError) {
              console.error('Error cleaning up temp file:', cleanupError);
            }
          }
        });
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update creator resource: ' + error.message
    });
  }
};

// Delete creator resource (Admin only)
export const deleteCreatorResource = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('Deleting resource:', id);

    const resource = await CreatorResource.findById(id);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    // Delete files from Cloudinary
    try {
      if (resource.imagePublicId) {
        await deleteFile(resource.imagePublicId, 'image');
        console.log('Deleted image from Cloudinary');
      }
      if (resource.downloadPublicId) {
        await deleteFile(resource.downloadPublicId, 'raw');
        console.log('Deleted PDF from Cloudinary');
      }
    } catch (deleteError) {
      console.error('Error deleting files from Cloudinary:', deleteError);
      // Continue with deletion even if file cleanup fails
    }

    await CreatorResource.findByIdAndDelete(id);
    console.log('Resource deleted successfully');

    res.json({ success: true, message: 'Creator resource deleted successfully' });
  } catch (error) {
    console.error('Error deleting creator resource:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete creator resource: ' + error.message
    });
  }
};