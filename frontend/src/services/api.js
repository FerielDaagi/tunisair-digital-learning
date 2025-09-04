import axios from 'axios';

// Configuration Axios améliorée pour éviter les connexions multiples
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 10000, // 10 secondes de timeout
  headers: {
    'Content-Type': 'application/json',
  },
  // Configuration pour éviter les connexions multiples
  maxRedirects: 5,
  maxContentLength: 50 * 1024 * 1024, // 50MB
  // Désactiver le keep-alive pour éviter les connexions persistantes
  httpAgent: false,
  httpsAgent: false,
});

// Intercepteur pour les requêtes
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour les réponses
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  signup: (userData) => api.post('/auth/register', userData), // Alias pour signup
  logout: () => api.post('/auth/logout'),
  deleteAccount: () => api.delete('/auth/delete'),
};

// Courses API
export const coursesAPI = {
  getAll: (params) => api.get('/courses', { params }),
  getById: (id) => api.get(`/courses/${id}`),
  enroll: (courseId) => api.post(`/courses/${courseId}/enroll`),
  getEnrolled: () => api.get('/courses/enrolled'),
  // Tutor functions
  create: (courseData) => {
    const isFormData = typeof FormData !== 'undefined' && courseData instanceof FormData;
    return api.post('/courses', courseData, isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined);
  },
  update: (id, courseData) => {
    const isFormData = typeof FormData !== 'undefined' && courseData instanceof FormData;
    return api.put(`/courses/${id}`, courseData, isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined);
  },
  delete: (id) => api.delete(`/courses/${id}`),
  publish: (id) => api.patch(`/courses/${id}/publish`),
  getTutorCourses: (params) => api.get('/courses/tutor/my-courses', { params }),
};

// Modules API
export const modulesAPI = {
  // Créer un module
  create: async (moduleData) => {
    try {
      // Try standard endpoint first
      return await api.post(`/modules`, moduleData);
    } catch (err) {
      // Fallback to nested-by-course endpoint if available
      const courseId = moduleData.course;
      if (courseId) {
        return api.post(`/modules/course/${courseId}`, moduleData);
      }
      throw err;
    }
  },
  
  // Récupérer tous les modules d'un cours (avec pagination)
  getByCourse: (courseId, params) => api.get(`/modules/course/${courseId}`, { params }),
  
  // Récupérer un module par ID
  getById: (moduleId) => api.get(`/modules/${moduleId}`),
  
  // Modifier un module
  update: (moduleId, moduleData) => api.put(`/modules/${moduleId}`, moduleData),
  
  // Supprimer un module
  delete: (moduleId) => api.delete(`/modules/${moduleId}`),
  
  // Réorganiser les modules
  reorder: (courseId, moduleIds) => api.put(`/modules/reorder/${courseId}`, { moduleIds }),
  
  // Toggle publication d'un module
  togglePublish: (moduleId) => api.put(`/modules/${moduleId}/toggle-publish`)
};

// API pour les leçons
export const lessonsAPI = {
  // Créer une leçon
  create: (lessonData) => {
    const isFormData = typeof FormData !== 'undefined' && lessonData instanceof FormData;
    const moduleId = isFormData ? (lessonData.get('module') || lessonData.get('moduleId')) : (lessonData.module || lessonData.moduleId);
    // Do not set Content-Type manually; let the browser/axios set the boundary
    return api.post(`/lessons/module/${moduleId}`, lessonData);
  },
  
  // Récupérer toutes les leçons d'un module
  getByModule: (moduleId) => api.get(`/lessons/module/${moduleId}`),
  
  // Récupérer une leçon par ID
  getById: (lessonId) => api.get(`/lessons/${lessonId}`),
  
  // Modifier une leçon
  update: (lessonId, lessonData) => {
    // Let axios handle the Content-Type
    return api.put(`/lessons/${lessonId}`, lessonData);
  },
  
  // Supprimer une leçon
  delete: (lessonId) => api.delete(`/lessons/${lessonId}`),
  
  // Réorganiser les leçons
  reorder: (moduleId, lessonIds) => api.put(`/lessons/reorder/${moduleId}`, { lessonIds })
};

// User API
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  updateAvatar: (formData) => api.put('/users/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getAvatarHistory: () => api.get('/users/avatar/history'),
  restoreAvatar: (avatarPath) => api.post('/users/avatar/restore', { avatarPath }),
  deleteAvatarFromHistory: (avatarPath) => api.delete('/users/avatar/history', { 
    headers: { 'Content-Type': 'application/json' },
    data: { avatarPath } 
  }),
  getProgress: () => api.get('/users/progress'),
  requestTutor: (note) => api.post('/users/request-tutor', { message: note }),
  // Admin functions
  getAllUsers: () => api.get('/users/admin/all'),
  toggleUserStatus: (userId, isActive) => api.put(`/users/admin/${userId}/status`, { isActive }),
  promoteToTutor: (userId) => api.put(`/users/admin/${userId}/promote`),
  rejectTutorRequest: (userId, reason) => api.put(`/users/admin/${userId}/reject-tutor`, { reason }),
  demoteToApprentice: (userId) => api.put(`/users/admin/${userId}/demote`),
  deleteUser: (userId) => api.delete(`/users/admin/${userId}`),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getRecentActivity: () => api.get('/dashboard/recent-activity'),
};

// Notifications API
export const notificationsAPI = {
  getUser: () => api.get('/notifications/user'),
  getAdmin: () => api.get('/notifications/admin'),
};

export default api; 