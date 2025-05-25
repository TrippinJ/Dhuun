// backend/routes/creatorResourcesRoutes.js
import express from 'express';

const router = express.Router();

// Sample educational resources data
const educationalResources = [
  // Mixing & Mastering
  {
    id: "resource1",
    title: "Complete Guide to Mixing Hip-Hop Beats",
    instructor: "Pro Audio Engineer",
    category: "Mixing & Mastering",
    type: "pdf",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop",
    downloadUrl: "#",
    description: "Learn professional mixing techniques for hip-hop production",
    duration: "45 min read",
    level: "Intermediate"
  },
  {
    id: "resource2",
    title: "Mastering Fundamentals for Beginners",
    instructor: "Master Engineer",
    category: "Mixing & Mastering",
    type: "blog",
    image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop",
    blogUrl: "#",
    description: "Essential mastering concepts every producer should know",
    duration: "20 min read",
    level: "Beginner"
  },
  
  // Beat Making
  {
    id: "resource3",
    title: "Trap Beat Production Secrets",
    instructor: "Beat Architect",
    category: "Beat Making",
    type: "pdf",
    image: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=300&fit=crop",
    downloadUrl: "#",
    description: "Advanced techniques for creating modern trap beats",
    duration: "60 min read",
    level: "Advanced"
  },
  {
    id: "resource4",
    title: "Lo-Fi Hip-Hop Production Tutorial",
    instructor: "Chill Producer",
    category: "Beat Making",
    type: "blog",
    image: "https://images.unsplash.com/photo-1571974599782-87624638275b?w=400&h=300&fit=crop",
    blogUrl: "#",
    description: "Step-by-step guide to creating atmospheric lo-fi beats",
    duration: "30 min read",
    level: "Beginner"
  },
  
  // Music Theory
  {
    id: "resource5",
    title: "Music Theory for Beat Makers",
    instructor: "Theory Master",
    category: "Music Theory",
    type: "pdf",
    image: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=400&h=300&fit=crop",
    downloadUrl: "#",
    description: "Essential music theory concepts for modern producers",
    duration: "90 min read",
    level: "Intermediate"
  },
  {
    id: "resource6",
    title: "Understanding Chord Progressions",
    instructor: "Harmony Expert",
    category: "Music Theory",
    type: "blog",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop",
    blogUrl: "#",
    description: "Master chord progressions to enhance your beats",
    duration: "25 min read",
    level: "Beginner"
  },
  
  // Vocal Production
  {
    id: "resource7",
    title: "Recording Vocals at Home",
    instructor: "Vocal Engineer",
    category: "Vocal Production",
    type: "pdf",
    image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&h=300&fit=crop",
    downloadUrl: "#",
    description: "Professional vocal recording techniques for home studios",
    duration: "40 min read",
    level: "Intermediate"
  },
  {
    id: "resource8",
    title: "Auto-Tune and Vocal Effects Guide",
    instructor: "FX Specialist",
    category: "Vocal Production",
    type: "blog",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop",
    blogUrl: "#",
    description: "Learn to use Auto-Tune and vocal effects creatively",
    duration: "35 min read",
    level: "Intermediate"
  },
  
  // Music Business
  {
    id: "resource9",
    title: "Music Licensing and Copyright Guide",
    instructor: "Legal Advisor",
    category: "Music Business",
    type: "pdf",
    image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=300&fit=crop",
    downloadUrl: "#",
    description: "Protect your music and understand licensing deals",
    duration: "50 min read",
    level: "Beginner"
  },
  {
    id: "resource10",
    title: "Building Your Music Brand Online",
    instructor: "Marketing Pro",
    category: "Music Business",
    type: "blog",
    image: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=300&fit=crop",
    blogUrl: "#",
    description: "Strategies for building a strong online presence",
    duration: "15 min read",
    level: "Beginner"
  }
];

// Get all educational resources
router.get('/', (req, res) => {
  try {
    console.log('Creator resources endpoint hit with query:', req.query);
    
    const { category, type } = req.query;
    
    let filteredResources = educationalResources;
    
    // Filter by category if specified and not "All Courses"
    if (category && category !== 'All Courses') {
      filteredResources = filteredResources.filter(resource => 
        resource.category === category
      );
    }
    
    // Filter by type if specified
    if (type) {
      filteredResources = filteredResources.filter(resource => 
        resource.type === type
      );
    }
    
    console.log(`Returning ${filteredResources.length} resources for category: ${category || 'All'}`);
    
    res.json({
      success: true,
      resources: filteredResources,
      total: filteredResources.length
    });
  } catch (error) {
    console.error('Error fetching creator resources:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch educational resources'
    });
  }
});

// Get single resource by ID
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const resource = educationalResources.find(r => r.id === id);
    
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }
    
    res.json({
      success: true,
      resource
    });
  } catch (error) {
    console.error('Error fetching resource:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resource'
    });
  }
});

export default router;