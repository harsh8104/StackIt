// Environment configuration
export const config = {
  // API Configuration
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  
  // App Configuration
  APP_NAME: 'Question Beacon Hub',
  APP_VERSION: '1.0.0',
  
  // Feature Flags
  ENABLE_NOTIFICATIONS: true,
  ENABLE_REAL_TIME_UPDATES: false,
  
  // Pagination
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 50,
  
  // Search
  SEARCH_DEBOUNCE_MS: 300,
  
  // File Upload
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
};

// Development helpers
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    PROFILE: '/auth/profile',
  },
  QUESTIONS: {
    LIST: '/questions',
    CREATE: '/questions',
    GET: (id: string) => `/questions/${id}`,
    UPDATE: (id: string) => `/questions/${id}`,
    DELETE: (id: string) => `/questions/${id}`,
    VOTE: (id: string) => `/questions/${id}/vote`,
  },
  ANSWERS: {
    LIST: (questionId: string) => `/answers/question/${questionId}`,
    CREATE: '/answers',
    UPDATE: (id: string) => `/answers/${id}`,
    DELETE: (id: string) => `/answers/${id}`,
    VOTE: (id: string) => `/answers/${id}/vote`,
    ACCEPT: (id: string) => `/answers/${id}/accept`,
  },
  TAGS: {
    LIST: '/tags',
    POPULAR: '/tags/popular',
    SEARCH: '/tags/search',
    GET: (name: string) => `/tags/${name}`,
  },
  USERS: {
    PROFILE: (id: string) => `/users/${id}`,
    STATS: (id: string) => `/users/${id}/stats`,
    TOP: '/users/top',
    SEARCH: '/users/search',
  },
}; 