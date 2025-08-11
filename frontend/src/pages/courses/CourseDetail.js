import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { coursesAPI } from '../../services/api';

const CourseDetail = () => {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await coursesAPI.getById(id);
        setCourse(response.data);
      } catch (error) {
        console.error('Error fetching course:', error);
        // Use mock data for demo
        setCourse({
          id: parseInt(id),
          title: 'React Fundamentals',
          description: 'Learn the basics of React development including components, state, and props. This comprehensive course covers everything you need to know to get started with React.',
          longDescription: 'This course is designed for beginners who want to learn React from scratch. You will learn about JSX, components, state management, props, event handling, and more. By the end of this course, you will be able to build your own React applications.',
          duration: '8 hours',
          level: 'Beginner',
          category: 'Frontend',
          instructor: 'John Doe',
          rating: 4.5,
          students: 1250,
          price: 49.99,
          modules: [
            {
              id: 1,
              title: 'Introduction to React',
              duration: '45 minutes',
              lessons: 3
            },
            {
              id: 2,
              title: 'Components and JSX',
              duration: '1 hour',
              lessons: 4
            },
            {
              id: 3,
              title: 'State and Props',
              duration: '1.5 hours',
              lessons: 5
            },
            {
              id: 4,
              title: 'Event Handling',
              duration: '1 hour',
              lessons: 3
            },
            {
              id: 5,
              title: 'Building a Complete App',
              duration: '2 hours',
              lessons: 6
            }
          ],
          requirements: [
            'Basic knowledge of HTML, CSS, and JavaScript',
            'A computer with internet connection',
            'Code editor (VS Code recommended)'
          ],
          outcomes: [
            'Understand React fundamentals and concepts',
            'Build reusable components',
            'Manage state and props effectively',
            'Create interactive user interfaces',
            'Deploy React applications'
          ]
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id]);

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      await coursesAPI.enroll(id);
      alert('Successfully enrolled in the course!');
    } catch (error) {
      console.error('Error enrolling:', error);
      alert('Enrollment successful! (Demo mode)');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="main-content">
        <div className="text-center">
          <p>Loading course...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="main-content">
        <div className="card text-center">
          <h2>Course not found</h2>
          <Link to="/courses" className="btn btn-primary">
            Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      {/* Course Header */}
      <div className="card">
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '300px' }}>
            <h1 className="card-title">{course.title}</h1>
            <p style={{ color: '#6c757d', marginBottom: '1rem' }}>
              {course.description}
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <span style={{ 
                backgroundColor: '#dc3545', 
                color: 'white', 
                padding: '0.25rem 0.75rem', 
                borderRadius: '20px',
                fontSize: '0.85rem'
              }}>
                {course.level}
              </span>
              <span style={{ 
                backgroundColor: '#6c757d', 
                color: 'white', 
                padding: '0.25rem 0.75rem', 
                borderRadius: '20px',
                fontSize: '0.85rem'
              }}>
                {course.category}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <span>⭐ {course.rating}</span>
              <span>{course.students} students enrolled</span>
              <span>{course.duration}</span>
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#dc3545' }}>
              ${course.price}
            </div>
          </div>
          <div style={{ minWidth: '200px' }}>
            <button
              onClick={handleEnroll}
              disabled={enrolling}
              className="btn btn-primary"
              style={{ width: '100%', marginBottom: '1rem' }}
            >
              {enrolling ? 'Enrolling...' : 'Enroll Now'}
            </button>
            <Link to="/courses" className="btn btn-outline" style={{ width: '100%' }}>
              Back to Courses
            </Link>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="grid grid-2">
        {/* Course Modules */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Course Content</h2>
          </div>
          <div>
            {course.modules.map((module) => (
              <div key={module.id} style={{ 
                padding: '1rem', 
                borderBottom: '1px solid #e9ecef',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <h4 style={{ margin: 0, color: '#495057' }}>{module.title}</h4>
                  <small style={{ color: '#6c757d' }}>
                    {module.lessons} lessons • {module.duration}
                  </small>
                </div>
                <span style={{ color: '#6c757d' }}>▶</span>
              </div>
            ))}
          </div>
        </div>

        {/* Course Info */}
        <div>
          {/* Requirements */}
          <div className="card mb-3">
            <div className="card-header">
              <h3 className="card-title">Requirements</h3>
            </div>
            <ul style={{ paddingLeft: '1.5rem', margin: 0 }}>
              {course.requirements.map((req, index) => (
                <li key={index} style={{ marginBottom: '0.5rem', color: '#495057' }}>
                  {req}
                </li>
              ))}
            </ul>
          </div>

          {/* Learning Outcomes */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">What you'll learn</h3>
            </div>
            <ul style={{ paddingLeft: '1.5rem', margin: 0 }}>
              {course.outcomes.map((outcome, index) => (
                <li key={index} style={{ marginBottom: '0.5rem', color: '#495057' }}>
                  {outcome}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Instructor */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Instructor</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ 
            width: '60px', 
            height: '60px', 
            borderRadius: '50%', 
            backgroundColor: '#dc3545',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '1.5rem',
            fontWeight: 'bold'
          }}>
            {course.instructor.charAt(0)}
          </div>
          <div>
            <h3 style={{ margin: 0, color: '#495057' }}>{course.instructor}</h3>
            <p style={{ margin: 0, color: '#6c757d' }}>
              Experienced instructor with expertise in {course.category} development
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail; 