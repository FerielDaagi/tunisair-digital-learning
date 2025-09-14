const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Certificate = require('../models/Certificate');
const Progress = require('../models/Progress');

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
const getStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let stats = {};

    if (userRole === 'apprenti') {
      // Statistiques pour les apprentis
      const totalCourses = await Course.countDocuments({ isPublished: true });
      const enrolledCourses = await Enrollment.countDocuments({ student: userId });
      const completedCourses = await Enrollment.countDocuments({ 
        student: userId, 
        status: 'completed' 
      });
      const certificatesEarned = await Certificate.countDocuments({ student: userId });

      // Calculer le temps total passé (approximation)
      const enrollments = await Enrollment.find({ student: userId });
      let totalHours = 0;
      for (const enrollment of enrollments) {
        const course = await Course.findById(enrollment.course);
        if (course && course.duration) {
          // Extraire les heures de la durée (format: "X heures" ou "Xh")
          const durationMatch = course.duration.match(/(\d+)/);
          if (durationMatch) {
            totalHours += parseInt(durationMatch[1]);
          }
        }
      }

      stats = {
        totalCourses,
        enrolledCourses,
        completedCourses,
        totalHours,
        certificatesEarned,
        averageProgress: 0,
        currentStreak: 0,
        totalLessonsCompleted: 0
      };
    } else if (userRole === 'tuteur') {
      // Statistiques pour les tuteurs
      const totalCourses = await Course.countDocuments({ instructor: userId });
      const publishedCourses = await Course.countDocuments({ 
        instructor: userId, 
        isPublished: true 
      });
      const totalStudents = await Enrollment.countDocuments({
        course: { $in: await Course.find({ instructor: userId }).distinct('_id') }
      });
      const completedEnrollments = await Enrollment.countDocuments({
        course: { $in: await Course.find({ instructor: userId }).distinct('_id') },
        status: 'completed'
      });

      stats = {
        totalCourses,
        publishedCourses,
        totalStudents,
        completedEnrollments,
        totalHours: 0,
        averageProgress: 0,
        currentStreak: 0,
        totalLessonsCompleted: 0
      };
    } else {
      // Statistiques pour les admins
      const totalCourses = await Course.countDocuments();
      const publishedCourses = await Course.countDocuments({ isPublished: true });
      const totalStudents = await Enrollment.countDocuments();
      const completedEnrollments = await Enrollment.countDocuments({ status: 'completed' });
      const totalCertificates = await Certificate.countDocuments();

      stats = {
        totalCourses,
        publishedCourses,
        totalStudents,
        completedEnrollments,
        totalCertificates,
        totalHours: 0,
        averageProgress: 0,
        currentStreak: 0,
        totalLessonsCompleted: 0
      };
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
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