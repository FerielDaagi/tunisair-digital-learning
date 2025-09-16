const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const CourseReview = require('../models/CourseReview');

// Middleware pour vérifier que l'utilisateur est admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Accès refusé. Rôle admin requis.' });
  }
  next();
};

// Route pour obtenir les statistiques des utilisateurs
router.get('/user-stats', auth, requireAdmin, async (req, res) => {
  try {
    // Compter le total des utilisateurs
    const totalUsers = await User.countDocuments();
    
    // Compter les utilisateurs actifs/inactifs
    const activeUsers = await User.countDocuments({ isActive: { $ne: false } });
    const inactiveUsers = await User.countDocuments({ isActive: false });
    
    // Distribution des rôles
    const roleDistribution = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Convertir en objet
    const roleStats = {
      admin: 0,
      tuteur: 0,
      apprenti: 0
    };
    
    roleDistribution.forEach(role => {
      if (roleStats.hasOwnProperty(role._id)) {
        roleStats[role._id] = role.count;
      }
    });
    
    // Inscriptions mensuelles (6 derniers mois)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyRegistrations = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);
    
    // Formater les mois
    const formattedMonthlyRegistrations = monthlyRegistrations.map(item => {
      const date = new Date(item._id.year, item._id.month - 1);
      const monthNames = [
        'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
        'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'
      ];
      return {
        month: monthNames[date.getMonth()],
        count: item.count
      };
    });
    
    // Statistiques des utilisateurs
    const stats = {
      totalUsers,
      activeUsers,
      inactiveUsers,
      roleDistribution: roleStats,
      monthlyRegistrations: formattedMonthlyRegistrations,
      userActivity: [] // Pour une future implémentation
    };
    
    res.json(stats);
    
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la récupération des statistiques' });
  }
});

// Statistiques globales des cours (plateforme)
router.get('/course-stats', auth, requireAdmin, async (req, res) => {
  try {
    // Totaux globaux
    const [totalCourses, publishedCourses, totalEnrollments, completedEnrollments] = await Promise.all([
      Course.countDocuments(),
      Course.countDocuments({ isPublished: true }),
      Enrollment.countDocuments(),
      Enrollment.countDocuments({ status: 'completed' })
    ]);

    // Moyenne des notes sur toute la plateforme
    const allReviews = await CourseReview.aggregate([
      { $group: { _id: null, avgRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } }
    ]);
    const averageRating = allReviews.length ? Math.round((allReviews[0].avgRating || 0) * 10) / 10 : 0;
    const totalReviews = allReviews.length ? allReviews[0].totalReviews : 0;

    // Top cours par inscriptions (limite 5)
    const topByEnrollments = await Enrollment.aggregate([
      { $group: { _id: '$course', enrollments: { $sum: 1 } } },
      { $sort: { enrollments: -1 } },
      { $limit: 5 }
    ]);
    const enrollmentsIds = topByEnrollments.map(e => e._id);
    const topByEnrollmentsWithCoursesArr = await Course.find({ _id: { $in: enrollmentsIds } })
      .select('title instructor thumbnail isPublished')
      .populate('instructor', 'name email');
    const courseByIdEnroll = new Map(topByEnrollmentsWithCoursesArr.map(c => [String(c._id), c]));
    const topCoursesByEnrollments = topByEnrollments.map(e => {
      const c = courseByIdEnroll.get(String(e._id));
      return c ? {
        id: c._id,
        title: c.title,
        instructor: c.instructor,
        isPublished: c.isPublished,
        enrollments: e.enrollments
      } : null;
    }).filter(Boolean);

    // Top cours par note moyenne (au moins 5 avis, limite 5)
    const topByRating = await CourseReview.aggregate([
      { $group: { _id: '$course', avgRating: { $avg: '$rating' }, reviews: { $sum: 1 } } },
      { $match: { reviews: { $gte: 1 } } },
      { $sort: { avgRating: -1, reviews: -1 } },
      { $limit: 5 }
    ]);
    const ratingIds = topByRating.map(r => r._id);
    const topByRatingWithCoursesArr = await Course.find({ _id: { $in: ratingIds } })
      .select('title instructor thumbnail isPublished')
      .populate('instructor', 'name email');
    const courseByIdRating = new Map(topByRatingWithCoursesArr.map(c => [String(c._id), c]));
    const topCoursesByRating = topByRating.map(r => {
      const c = courseByIdRating.get(String(r._id));
      return c ? {
        id: c._id,
        title: c.title,
        instructor: c.instructor,
        isPublished: c.isPublished,
        averageRating: Math.round(((r.avgRating) || 0) * 10) / 10,
        reviews: r.reviews || 0
      } : null;
    }).filter(Boolean);

    // Top tuteurs par nombre de cours publiés (inclut aussi ceux à 0)
    const topTutorsAgg = await Course.aggregate([
      { $match: { instructor: { $ne: null } } },
      {
        $group: {
          _id: '$instructor',
          publishedCourses: {
            $sum: { $cond: [{ $eq: ['$isPublished', true] }, 1, 0] }
          },
          totalCourses: { $sum: 1 }
        }
      },
      { $sort: { publishedCourses: -1, totalCourses: -1 } },
      { $limit: 5 }
    ]);
    const tutorIds = topTutorsAgg.map(t => t._id);
    const tutors = await User.find({ _id: { $in: tutorIds } }).select('name email');
    const tutorById = new Map(tutors.map(u => [String(u._id), u]));
    const topTutorsByPublished = topTutorsAgg.map(t => {
      const u = tutorById.get(String(t._id));
      return u ? {
        id: u._id,
        name: u.name,
        email: u.email,
        publishedCourses: t.publishedCourses,
        totalCourses: t.totalCourses
      } : null;
    }).filter(Boolean);

    // Derniers avis (10)
    const recentReviews = await CourseReview.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('student', 'name email profile.avatar')
      .populate('course', 'title publishedAt');

    res.json({
      success: true,
      data: {
        totals: {
          totalCourses,
          publishedCourses,
          totalEnrollments,
          completedEnrollments,
          totalReviews,
          averageRating
        },
        topCoursesByEnrollments,
        topCoursesByRating,
        recentReviews,
        topTutorsByPublished
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques de cours (admin):', error);
    res.status(500).json({ success: false, message: 'Erreur serveur lors de la récupération des statistiques de cours' });
  }
});

// Liste paginée de tous les avis/commentaires (admin)
router.get('/reviews', auth, requireAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      minRating,
      maxRating,
      courseId,
      studentId
    } = req.query;

    const numericLimit = Math.max(1, Math.min(parseInt(limit, 10) || 10, 100));
    const numericPage = Math.max(1, parseInt(page, 10) || 1);
    const skip = (numericPage - 1) * numericLimit;

    const filter = {};
    if (minRating) filter.rating = { ...(filter.rating || {}), $gte: Number(minRating) };
    if (maxRating) filter.rating = { ...(filter.rating || {}), $lte: Number(maxRating) };
    if (courseId) filter.course = courseId;
    if (studentId) filter.student = studentId;

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [reviews, total] = await Promise.all([
      CourseReview.find(filter)
        .populate('student', 'name email profile.avatar')
        .populate('course', 'title instructor')
        .sort(sort)
        .skip(skip)
        .limit(numericLimit),
      CourseReview.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          currentPage: numericPage,
          totalPages: Math.ceil(total / numericLimit),
          totalItems: total,
          pageSize: numericLimit
        }
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des avis (admin):', error);
    res.status(500).json({ success: false, message: 'Erreur serveur lors de la récupération des avis' });
  }
});

module.exports = router;
