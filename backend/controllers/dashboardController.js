// Mock dashboard data
const mockStats = {
  totalCourses: 12,
  enrolledCourses: 3,
  completedCourses: 1,
  totalHours: 24,
  averageProgress: 45,
  certificatesEarned: 1,
  currentStreak: 5,
  totalLessonsCompleted: 21
};

const mockRecentActivity = [
  {
    id: 1,
    type: 'lesson_completed',
    title: 'Completed Lesson: Introduction to React',
    course: 'React Fundamentals',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    description: 'You completed lesson 1 of React Fundamentals'
  },
  {
    id: 2,
    type: 'course_enrolled',
    title: 'Enrolled in Node.js Backend Development',
    course: 'Node.js Backend Development',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    description: 'You enrolled in a new course'
  },
  {
    id: 3,
    type: 'certificate_earned',
    title: 'Earned Certificate: CSS Grid and Flexbox',
    course: 'CSS Grid and Flexbox',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    description: 'Congratulations! You completed the course'
  },
  {
    id: 4,
    type: 'lesson_completed',
    title: 'Completed Lesson: Components and JSX',
    course: 'React Fundamentals',
    timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
    description: 'You completed lesson 2 of React Fundamentals'
  },
  {
    id: 5,
    type: 'course_enrolled',
    title: 'Enrolled in Advanced JavaScript',
    course: 'Advanced JavaScript',
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
    description: 'You enrolled in a new course'
  }
];

// Get dashboard stats
const getStats = (req, res) => {
  try {
    res.json({
      success: true,
      data: mockStats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get recent activity
const getRecentActivity = (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const recentActivity = mockRecentActivity.slice(0, limit);

    res.json({
      success: true,
      data: recentActivity
    });
  } catch (error) {
    console.error('Get recent activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get learning progress
const getLearningProgress = (req, res) => {
  try {
    const progress = {
      weeklyProgress: [
        { day: 'Mon', lessons: 3 },
        { day: 'Tue', lessons: 2 },
        { day: 'Wed', lessons: 4 },
        { day: 'Thu', lessons: 1 },
        { day: 'Fri', lessons: 5 },
        { day: 'Sat', lessons: 3 },
        { day: 'Sun', lessons: 2 }
      ],
      monthlyProgress: [
        { week: 1, hours: 8 },
        { week: 2, hours: 12 },
        { week: 3, hours: 6 },
        { week: 4, hours: 10 }
      ],
      courseProgress: [
        { course: 'React Fundamentals', progress: 75 },
        { course: 'Node.js Backend Development', progress: 30 },
        { course: 'Advanced JavaScript', progress: 0 }
      ]
    };

    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    console.error('Get learning progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get achievements
const getAchievements = (req, res) => {
  try {
    const achievements = [
      {
        id: 1,
        title: 'First Steps',
        description: 'Complete your first lesson',
        icon: 'target',
        earned: true,
        earnedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      },
      {
        id: 2,
        title: 'Course Champion',
        description: 'Complete your first course',
        icon: 'trophy',
        earned: true,
        earnedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        id: 3,
        title: 'Streak Master',
        description: 'Maintain a 7-day learning streak',
        icon: 'flame',
        earned: false,
        progress: 5,
        required: 7
      },
      {
        id: 4,
        title: 'Knowledge Seeker',
        description: 'Enroll in 5 courses',
        icon: 'graduation',
        earned: false,
        progress: 3,
        required: 5
      }
    ];

    res.json({
      success: true,
      data: achievements
    });
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getStats,
  getRecentActivity,
  getLearningProgress,
  getAchievements
}; 