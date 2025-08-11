# E-Learning Platform

A modern e-learning platform built with React.js frontend and Node.js backend for a 6-week internship project.

## 🚀 Features

- **User Authentication**: Login/Register with JWT tokens
- **Course Management**: Browse, view, and enroll in courses
- **Dashboard**: Learning progress, stats, and recent activity
- **Responsive Design**: Mobile-friendly interface
- **Modern UI**: Clean, professional design with red and white theme

## 🛠️ Tech Stack

### Frontend
- React.js 18
- React Router for navigation
- Axios for API calls
- CSS3 with custom styling
- Context API for state management

### Backend
- Node.js
- Express.js
- JWT for authentication
- bcryptjs for password hashing
- CORS enabled
- Helmet for security

## 📁 Project Structure

```
e-learning/
├── frontend/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   │   └── common/
│   │   ├── contexts/        # React contexts
│   │   ├── pages/          # Page components
│   │   │   ├── auth/
│   │   │   ├── courses/
│   │   │   └── dashboard/
│   │   ├── services/       # API services
│   │   └── App.js
│   └── package.json
├── backend/                 # Node.js backend
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Custom middleware
│   ├── routes/            # API routes
│   ├── server.js          # Main server file
│   └── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd e-learning
   ```

2. **Install Frontend Dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Install Backend Dependencies**
   ```bash
   cd ../backend
   npm install
   ```

4. **Set up Environment Variables**
   
   Create a `.env` file in the backend directory:
   ```env
   NODE_ENV=development
   PORT=5000
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   FRONTEND_URL=http://localhost:3000
   ```

### Running the Application

1. **Start the Backend Server**
   ```bash
   cd backend
   npm run dev
   ```
   The backend will run on `http://localhost:5000`

2. **Start the Frontend Development Server**
   ```bash
   cd frontend
   npm start
   ```
   The frontend will run on `http://localhost:3000`

## 🔐 Authentication

The application uses JWT tokens for authentication. Demo credentials:

- **Email**: `admin@example.com`
- **Password**: `password123`

## 📚 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Courses
- `GET /api/courses` - Get all courses
- `GET /api/courses/:id` - Get course by ID
- `GET /api/courses/enrolled` - Get enrolled courses
- `POST /api/courses/:id/enroll` - Enroll in course

### User
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `GET /api/user/progress` - Get learning progress
- `POST /api/user/progress` - Update lesson progress

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/recent-activity` - Get recent activity
- `GET /api/dashboard/learning-progress` - Get learning progress
- `GET /api/dashboard/achievements` - Get user achievements

## 🎨 Design Features

- **Color Scheme**: Red (#dc3545) and white theme
- **Typography**: Clean, modern fonts
- **Layout**: Responsive grid system
- **Components**: Reusable card components
- **Navigation**: Intuitive navigation with React Router

## 🔧 Development

### Frontend Development
- Component-based architecture
- Context API for state management
- Custom CSS with responsive design
- Axios interceptors for API calls

### Backend Development
- MVC architecture
- Middleware for authentication and error handling
- Mock data for demonstration
- RESTful API design

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile devices

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcryptjs
- CORS configuration
- Helmet security headers
- Rate limiting
- Input validation

## 🚀 Deployment

### Frontend Deployment
1. Build the production version:
   ```bash
   cd frontend
   npm run build
   ```
2. Deploy the `build` folder to your hosting service

### Backend Deployment
1. Set production environment variables
2. Deploy to your Node.js hosting service (Heroku, Vercel, etc.)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is created for educational purposes as part of a 6-week internship.

## 🆘 Support

For support or questions, please contact the development team.

---

**Note**: This is a demo project with mock data. In a production environment, you would need to:
- Implement a real database (MongoDB, PostgreSQL, etc.)
- Add proper error handling and logging
- Implement file upload functionality
- Add comprehensive testing
- Set up CI/CD pipelines
- Configure production environment variables 