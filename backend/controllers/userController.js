// Mock user data (in a real app, this would come from a database)
const mockUsers = [
  {
    id: 1,
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
    avatar: null,
    bio: 'Experienced instructor and administrator',
    createdAt: new Date('2023-01-01'),
    lastLogin: new Date()
  },
  {
    id: 2,
    name: 'John Doe',
    email: 'john@example.com',
    role: 'student',
    avatar: null,
    bio: 'Passionate learner focused on web development',
    createdAt: new Date('2023-01-15'),
    lastLogin: new Date()
  }
];

// Mock user progress data
const mockUserProgress = [
  {
    userId: 2,
    courseId: 1,
    progress: 75,
    completedLessons: 15,
    totalLessons: 20,
    lastAccessed: new Date(),
    enrolledAt: new Date('2023-02-01')
  },
  {
    userId: 2,
    courseId: 2,
    progress: 30,
    completedLessons: 6,
    totalLessons: 20,
    lastAccessed: new Date(),
    enrolledAt: new Date('2023-02-15')
  },
  {
    userId: 2,
    courseId: 3,
    progress: 0,
    completedLessons: 0,
    totalLessons: 18,
    lastAccessed: null,
    enrolledAt: new Date('2023-03-01')
  }
];

// Get user profile
const getProfile = (req, res) => {
  try {
    const user = mockUsers.find(u => u.id === req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update user profile
const updateProfile = (req, res) => {
  try {
    const { name, bio } = req.body;
    const user = mockUsers.find(u => u.id === req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user data
    if (name) user.name = name;
    if (bio) user.bio = bio;

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get user progress
const getProgress = (req, res) => {
  try {
    const userProgress = mockUserProgress.filter(p => p.userId === req.user.id);

    res.json({
      success: true,
      data: userProgress
    });

  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update lesson progress
const updateLessonProgress = (req, res) => {
  try {
    const { courseId, lessonId, completed } = req.body;
    
    // Find user progress for this course
    const progress = mockUserProgress.find(p => 
      p.userId === req.user.id && p.courseId === parseInt(courseId)
    );

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Course enrollment not found'
      });
    }

    // Update progress (in a real app, you'd update the database)
    if (completed) {
      progress.completedLessons = Math.min(progress.completedLessons + 1, progress.totalLessons);
      progress.progress = Math.round((progress.completedLessons / progress.totalLessons) * 100);
    }

    progress.lastAccessed = new Date();

    res.json({
      success: true,
      message: 'Progress updated successfully',
      data: progress
    });

  } catch (error) {
    console.error('Update lesson progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getProgress,
  updateLessonProgress
}; 