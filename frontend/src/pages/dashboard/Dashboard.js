import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { dashboardAPI, coursesAPI } from '../../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalCourses: 0,
    enrolledCourses: 0,
    completedCourses: 0,
    totalHours: 0
  });
  const [recentCourses, setRecentCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsResponse, coursesResponse] = await Promise.all([
          dashboardAPI.getStats(),
          coursesAPI.getAll()
        ]);
        
        setStats(statsResponse.data);
        setRecentCourses(coursesResponse.data.slice(0, 3)); // Get first 3 courses
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Use mock data for demo
        setStats({
          totalCourses: 12,
          enrolledCourses: 3,
          completedCourses: 1,
          totalHours: 24
        });
        setRecentCourses([
          {
            id: 1,
            title: 'React Fundamentals',
            description: 'Learn the basics of React development',
            duration: '8 hours',
            level: 'Beginner'
          },
          {
            id: 2,
            title: 'Node.js Backend Development',
            description: 'Build robust backend APIs with Node.js',
            duration: '12 hours',
            level: 'Intermediate'
          },
          {
            id: 3,
            title: 'Advanced JavaScript',
            description: 'Master advanced JavaScript concepts',
            duration: '10 hours',
            level: 'Advanced'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="main-content">
        <div className="text-center">
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="alert alert-info">
        <strong>🎨 New Look!</strong> We've enhanced our platform with a beautiful color palette while keeping our signature red and white theme. Enjoy the improved visual experience!
      </div>
      
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">Welcome back, {user?.name || 'Student'}!</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Here's your learning progress and recent activity
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-number blue">{stats.totalCourses}</div>
          <div className="stat-label">Total Courses</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-number orange">{stats.enrolledCourses}</div>
          <div className="stat-label">Enrolled Courses</div>
        </div>
        <div className="stat-card green">
          <div className="stat-number green">{stats.completedCourses}</div>
          <div className="stat-label">Completed Courses</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-number purple">{stats.totalHours}h</div>
          <div className="stat-label">Total Learning Hours</div>
        </div>
      </div>

      {/* Recent Courses */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Recent Courses</h2>
        </div>
        <div className="grid grid-3">
          {recentCourses.map((course, index) => {
            const colors = ['red', 'blue', 'green', 'orange', 'purple'];
            const badgeColors = ['badge-primary', 'badge-blue', 'badge-green', 'badge-orange', 'badge-purple'];
            const buttonColors = ['btn-primary', 'btn-blue', 'btn-green', 'btn-orange', 'btn-purple'];
            const colorClass = colors[index % colors.length];
            const badgeClass = badgeColors[index % badgeColors.length];
            const buttonClass = buttonColors[index % buttonColors.length];
            
            return (
              <div key={course.id} className="course-card">
                <div className={`course-image ${colorClass}`}>
                  {course.title.charAt(0)}
                </div>
                <div className="course-content">
                  <h3 className="course-title">{course.title}</h3>
                  <p className="course-description">{course.description}</p>
                  <div className="course-meta">
                    <span>{course.duration}</span>
                    <span className={`badge ${badgeClass}`}>{course.level}</span>
                  </div>
                  <Link 
                    to={`/courses/${course.id}`} 
                    className={`btn ${buttonClass}`}
                    style={{ marginTop: '1rem', display: 'block', textAlign: 'center' }}
                  >
                    View Course
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
        <div className="text-center mt-3">
          <Link to="/courses" className="btn btn-primary">
            View All Courses
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card green">
        <div className="card-header">
          <h2 className="card-title">Quick Actions</h2>
        </div>
        <div className="grid grid-2">
          <div className="p-3">
            <h3 style={{ color: 'var(--secondary-green)', marginBottom: '0.5rem' }}>Continue Learning</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Pick up where you left off in your enrolled courses
            </p>
            <Link to="/courses" className="btn btn-green">
              Resume Learning
            </Link>
          </div>
          <div className="p-3">
            <h3 style={{ color: 'var(--secondary-purple)', marginBottom: '0.5rem' }}>Explore New Courses</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Discover new topics and expand your skills
            </p>
            <Link to="/courses" className="btn btn-purple">
              Browse Courses
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 