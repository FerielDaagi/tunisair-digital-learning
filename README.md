# E-Learning Platform

A modern e-learning platform built with React.js frontend and Node.js backend for a 6-week internship project.

## 🚀 Features

### Core Features
- **User Authentication**: Login/Register with JWT tokens
- **Course Management**: Browse, view, and enroll in courses
- **Dashboard**: Learning progress, stats, and recent activity
- **Responsive Design**: Mobile-friendly interface
- **Modern UI**: Clean, professional design with red and white theme

### Advanced User Features
- **Avatar Management**: Upload, update, and manage profile pictures
- **Avatar History**: View and restore previous avatars
- **Account Management**: Complete account deletion with data cleanup
- **Role System**: Apprentice to Tutor promotion system
- **Professional UI**: Custom confirmation modals replacing browser alerts
- **Enhanced Navigation**: Avatar display in navbar with user information

### Profile Management
- **Avatar Upload**: Support for JPG, PNG, GIF, WebP (max 5MB)
- **Avatar History**: Automatic backup of previous avatars
- **Avatar Restoration**: Restore any previous avatar from history
- **Avatar Deletion**: Remove specific avatars from history
- **Profile Information**: Update name, bio, phone, date of birth

### Account Security
- **Secure Deletion**: Complete account removal with file cleanup
- **Confirmation System**: Professional modal confirmations
- **Data Protection**: Automatic cleanup of user files and data

## 🛠️ Tech Stack

### Frontend
- React.js 18
- React Router for navigation
- Axios for API calls
- CSS3 with custom styling
- Context API for state management
- File upload handling with FormData

### Backend
- Node.js
- Express.js
- JWT for authentication
- bcryptjs for password hashing
- Multer for file uploads
- MongoDB with Mongoose
- CORS enabled
- Helmet for security
- File system operations (fs, path)

## 📁 Project Structure

```
e-learning/
├── frontend/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   │   └── common/
│   │   │       ├── Navbar.js    # Enhanced navbar with avatar
│   │   │       └── ProtectedRoute.js
│   │   ├── contexts/        # React contexts
│   │   │   └── AuthContext.js
│   │   ├── pages/          # Page components
│   │   │   ├── auth/
│   │   │   │   ├── Login.js
│   │   │   │   └── Signup.js
│   │   │   ├── courses/
│   │   │   │   ├── Courses.js
│   │   │   │   └── CourseDetail.js
│   │   │   ├── dashboard/
│   │   │   │   └── Dashboard.js
│   │   │   └── user/
│   │   │       └── Profile.js   # Enhanced profile management
│   │   ├── services/       # API services
│   │   │   └── api.js      # Complete API integration
│   │   └── App.js
│   └── package.json
├── backend/                 # Node.js backend
│   ├── config/
│   │   └── database.js
│   ├── controllers/        # Route controllers
│   │   ├── authController.js   # Enhanced with account deletion
│   │   ├── userController.js   # Avatar and tutor management
│   │   ├── courseController.js
│   │   └── dashboardController.js
│   ├── middleware/         # Custom middleware
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── models/
│   │   └── User.js
│   ├── routes/            # API routes
│   │   ├── auth.js        # Enhanced auth routes
│   │   ├── user.js        # Complete user management
│   │   ├── courses.js
│   │   └── dashboard.js
│   ├── uploads/           # File storage
│   │   └── avatars/       # User avatar storage
│   ├── server.js          # Main server file
│   └── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- MongoDB (local or cloud)

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
   MONGODB_URI=mongodb://localhost:27017/e-learning
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

## 📚 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `DELETE /api/auth/delete` - Delete user account (with file cleanup)

### User Management
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `PUT /api/user/avatar` - Upload/update user avatar
- `GET /api/user/avatar/history` - Get avatar history
- `POST /api/user/avatar/restore` - Restore previous avatar
- `DELETE /api/user/avatar/history` - Delete avatar from history
- `POST /api/user/become-tutor` - Promote user to tutor role
- `GET /api/user/progress` - Get learning progress
- `POST /api/user/progress` - Update lesson progress

### Courses
- `GET /api/courses` - Get all courses
- `GET /api/courses/:id` - Get course by ID
- `GET /api/courses/enrolled` - Get enrolled courses
- `POST /api/courses/:id/enroll` - Enroll in course

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/recent-activity` - Get recent activity
- `GET /api/dashboard/learning-progress` - Get learning progress
- `GET /api/dashboard/achievements` - Get user achievements

## 🎨 Design Features

### UI/UX Improvements
- **Avatar Integration**: User avatars displayed in navigation
- **Professional Modals**: Custom confirmation dialogs
- **Enhanced Navigation**: Avatar and username in navbar
- **Responsive Design**: Mobile-first approach
- **Smooth Animations**: Hover effects and transitions

### Color Scheme & Typography
- **Primary Colors**: Red (#dc3545) and white theme
- **Accent Colors**: Blue (#007bff), Green (#28a745), Gray (#6c757d)
- **Typography**: Clean, modern fonts with proper hierarchy
- **Layout**: Responsive grid system with flexbox

## 🔧 Development Features

### Frontend Development
- **Component Architecture**: Modular, reusable components
- **State Management**: Context API for global state
- **File Handling**: FormData for avatar uploads
- **Error Handling**: Comprehensive error management
- **Loading States**: User feedback during operations

### Backend Development
- **MVC Architecture**: Clean separation of concerns
- **File Management**: Multer for file uploads
- **Database Integration**: MongoDB with Mongoose
- **Security**: JWT authentication, password hashing
- **Error Handling**: Comprehensive error middleware

### File Management
- **Avatar Storage**: Organized file structure in uploads/avatars/
- **File Validation**: Type and size validation
- **Automatic Cleanup**: File deletion on account removal
- **History Management**: Previous avatar tracking

## 📱 Responsive Design

The application is fully responsive and optimized for:
- **Desktop**: Full-featured experience
- **Tablet**: Touch-friendly interface
- **Mobile**: Optimized navigation and interactions

## 🔒 Security Features

### Authentication & Authorization
- JWT token authentication
- Password hashing with bcryptjs
- Role-based access control (Apprentice/Tutor)
- Token expiration and refresh

### Data Protection
- CORS configuration
- Helmet security headers
- Rate limiting
- Input validation and sanitization
- Secure file upload handling

### Account Security
- Complete account deletion
- File cleanup on account removal
- Confirmation requirements for destructive actions
- Session management

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
2. Ensure MongoDB connection
3. Configure file storage for avatars
4. Deploy to your Node.js hosting service

### File Storage Considerations
- Configure persistent file storage for avatars
- Set up proper backup systems
- Ensure file cleanup processes work in production

## 🆕 Recent Updates

### Version 2.0 Features
- **Avatar Management System**: Complete avatar upload, history, and restoration
- **Account Deletion**: Secure account removal with data cleanup
- **Tutor Promotion**: Role-based system for user advancement
- **Enhanced UI**: Professional modals and improved navigation
- **File Management**: Organized avatar storage and cleanup
- **Security Improvements**: Enhanced authentication and data protection

### Technical Improvements
- **Backend**: Enhanced controllers with file management
- **Frontend**: Improved user experience with avatars
- **API**: Complete RESTful endpoints for all features
- **Database**: Enhanced user model with avatar tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is created for educational purposes as part of a 6-week internship.

## 🎯 Future Enhancements

- **Real-time Features**: Live chat, notifications
- **Advanced Analytics**: Learning progress tracking
- **Content Management**: Course creation tools
- **Social Features**: User interactions and forums
- **Mobile App**: Native mobile application

 