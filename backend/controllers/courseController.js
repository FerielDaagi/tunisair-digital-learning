// Mock course data (in a real app, this would come from a database)
const mockCourses = [
  {
    id: 1,
    title: 'React Fundamentals',
    description: 'Learn the basics of React development including components, state, and props',
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
  },
  {
    id: 2,
    title: 'Node.js Backend Development',
    description: 'Build robust backend APIs with Node.js and Express',
    longDescription: 'Master Node.js backend development with this comprehensive course. Learn to build RESTful APIs, handle authentication, work with databases, and deploy your applications.',
    duration: '12 hours',
    level: 'Intermediate',
    category: 'Backend',
    instructor: 'Jane Smith',
    rating: 4.7,
    students: 890,
    price: 69.99,
    modules: [
      {
        id: 1,
        title: 'Node.js Basics',
        duration: '1 hour',
        lessons: 4
      },
      {
        id: 2,
        title: 'Express Framework',
        duration: '2 hours',
        lessons: 6
      },
      {
        id: 3,
        title: 'RESTful APIs',
        duration: '3 hours',
        lessons: 8
      },
      {
        id: 4,
        title: 'Database Integration',
        duration: '2.5 hours',
        lessons: 7
      },
      {
        id: 5,
        title: 'Authentication & Security',
        duration: '2 hours',
        lessons: 5
      },
      {
        id: 6,
        title: 'Deployment',
        duration: '1.5 hours',
        lessons: 4
      }
    ],
    requirements: [
      'Basic JavaScript knowledge',
      'Understanding of HTTP and APIs',
      'Familiarity with command line'
    ],
    outcomes: [
      'Build scalable Node.js applications',
      'Create RESTful APIs',
      'Implement authentication and authorization',
      'Work with databases',
      'Deploy applications to production'
    ]
  },
  {
    id: 3,
    title: 'Advanced JavaScript',
    description: 'Master advanced JavaScript concepts and ES6+ features',
    longDescription: 'Take your JavaScript skills to the next level with advanced concepts, ES6+ features, and modern programming patterns.',
    duration: '10 hours',
    level: 'Advanced',
    category: 'JavaScript',
    instructor: 'Mike Johnson',
    rating: 4.8,
    students: 2100,
    price: 59.99,
    modules: [
      {
        id: 1,
        title: 'ES6+ Features',
        duration: '2 hours',
        lessons: 6
      },
      {
        id: 2,
        title: 'Async Programming',
        duration: '2.5 hours',
        lessons: 7
      },
      {
        id: 3,
        title: 'Functional Programming',
        duration: '2 hours',
        lessons: 5
      },
      {
        id: 4,
        title: 'Design Patterns',
        duration: '2 hours',
        lessons: 6
      },
      {
        id: 5,
        title: 'Performance Optimization',
        duration: '1.5 hours',
        lessons: 4
      }
    ],
    requirements: [
      'Solid JavaScript fundamentals',
      'Understanding of basic programming concepts',
      'Experience with modern web development'
    ],
    outcomes: [
      'Master ES6+ features',
      'Write clean, maintainable code',
      'Understand functional programming',
      'Apply design patterns',
      'Optimize JavaScript performance'
    ]
  },
  {
    id: 4,
    title: 'MongoDB Database Design',
    description: 'Learn to design and implement MongoDB databases',
    longDescription: 'Master MongoDB database design with this comprehensive course covering schema design, indexing, aggregation, and best practices.',
    duration: '6 hours',
    level: 'Intermediate',
    category: 'Database',
    instructor: 'Sarah Wilson',
    rating: 4.6,
    students: 750,
    price: 39.99,
    modules: [
      {
        id: 1,
        title: 'MongoDB Basics',
        duration: '1 hour',
        lessons: 3
      },
      {
        id: 2,
        title: 'Schema Design',
        duration: '1.5 hours',
        lessons: 4
      },
      {
        id: 3,
        title: 'Indexing Strategies',
        duration: '1 hour',
        lessons: 3
      },
      {
        id: 4,
        title: 'Aggregation Framework',
        duration: '1.5 hours',
        lessons: 5
      },
      {
        id: 5,
        title: 'Performance Optimization',
        duration: '1 hour',
        lessons: 3
      }
    ],
    requirements: [
      'Basic understanding of databases',
      'JavaScript knowledge',
      'Familiarity with JSON'
    ],
    outcomes: [
      'Design efficient MongoDB schemas',
      'Implement proper indexing',
      'Use aggregation framework',
      'Optimize database performance',
      'Apply MongoDB best practices'
    ]
  },
  {
    id: 5,
    title: 'CSS Grid and Flexbox',
    description: 'Master modern CSS layout techniques',
    longDescription: 'Learn modern CSS layout techniques with Grid and Flexbox to create responsive and flexible web layouts.',
    duration: '5 hours',
    level: 'Beginner',
    category: 'Frontend',
    instructor: 'Alex Brown',
    rating: 4.4,
    students: 1800,
    price: 29.99,
    modules: [
      {
        id: 1,
        title: 'CSS Flexbox',
        duration: '2 hours',
        lessons: 5
      },
      {
        id: 2,
        title: 'CSS Grid',
        duration: '2.5 hours',
        lessons: 6
      },
      {
        id: 3,
        title: 'Responsive Design',
        duration: '0.5 hours',
        lessons: 2
      }
    ],
    requirements: [
      'Basic HTML and CSS knowledge',
      'Understanding of web layout concepts',
      'Modern web browser'
    ],
    outcomes: [
      'Create flexible layouts with Flexbox',
      'Build grid-based layouts',
      'Design responsive websites',
      'Master modern CSS techniques',
      'Create complex layouts easily'
    ]
  },
  {
    id: 6,
    title: 'RESTful API Design',
    description: 'Learn to design and implement RESTful APIs',
    longDescription: 'Master the principles of RESTful API design and learn to build scalable, maintainable APIs.',
    duration: '9 hours',
    level: 'Intermediate',
    category: 'Backend',
    instructor: 'David Lee',
    rating: 4.9,
    students: 1100,
    price: 54.99,
    modules: [
      {
        id: 1,
        title: 'REST Principles',
        duration: '1.5 hours',
        lessons: 4
      },
      {
        id: 2,
        title: 'API Design Patterns',
        duration: '2 hours',
        lessons: 5
      },
      {
        id: 3,
        title: 'Authentication & Authorization',
        duration: '2 hours',
        lessons: 6
      },
      {
        id: 4,
        title: 'Error Handling',
        duration: '1.5 hours',
        lessons: 4
      },
      {
        id: 5,
        title: 'API Documentation',
        duration: '1 hour',
        lessons: 3
      },
      {
        id: 6,
        title: 'Testing APIs',
        duration: '1 hour',
        lessons: 3
      }
    ],
    requirements: [
      'Basic programming knowledge',
      'Understanding of HTTP',
      'Familiarity with JSON'
    ],
    outcomes: [
      'Design RESTful APIs',
      'Implement proper authentication',
      'Handle errors effectively',
      'Document APIs properly',
      'Test API endpoints'
    ]
  }
];

// Get all courses
const getAllCourses = (req, res) => {
  try {
    res.json({
      success: true,
      data: mockCourses
    });
  } catch (error) {
    console.error('Get all courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get course by ID
const getCourseById = (req, res) => {
  try {
    const { id } = req.params;
    const course = mockCourses.find(c => c.id === parseInt(id));

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.json({
      success: true,
      data: course
    });

  } catch (error) {
    console.error('Get course by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Enroll in course
const enrollInCourse = (req, res) => {
  try {
    const { id } = req.params;
    const course = mockCourses.find(c => c.id === parseInt(id));

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // In a real app, you would save enrollment to database
    res.json({
      success: true,
      message: `Successfully enrolled in ${course.title}`,
      data: {
        courseId: course.id,
        courseTitle: course.title,
        enrolledAt: new Date()
      }
    });

  } catch (error) {
    console.error('Enroll in course error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get enrolled courses
const getEnrolledCourses = (req, res) => {
  try {
    // In a real app, you would get enrolled courses from database
    // For demo, return first 3 courses as enrolled
    const enrolledCourses = mockCourses.slice(0, 3);

    res.json({
      success: true,
      data: enrolledCourses
    });

  } catch (error) {
    console.error('Get enrolled courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getAllCourses,
  getCourseById,
  enrollInCourse,
  getEnrolledCourses
}; 