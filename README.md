# Question Beacon Hub - Full Stack Setup Guide

## 🚀 Quick Start

### 1. Backend Setup
```bash
cd backend
npm install
# Edit .env with your MongoDB URI
npm run dev
```

### 2. Frontend Setup
```bash
# In the root directory
npm install
npm run dev
```

### 3. Database Setup (Optional)
```bash
cd backend
npm run setup  # Creates sample data
```

## 📁 Project Structure

```
question-beacon-hub/
├── backend/                 # Node.js/Express API
│   ├── config/             # Database configuration
│   ├── controllers/        # API logic
│   ├── middleware/         # Auth & error handling
│   ├── models/            # MongoDB schemas
│   ├── routes/            # API endpoints
│   ├── index.js           # Server entry point
│   └── setup.js           # Sample data creation
├── src/                   # React frontend
│   ├── components/        # UI components
│   ├── contexts/          # React contexts
│   ├── pages/            # Page components
│   ├── services/         # API client
│   └── config/           # Environment config
└── README.md
```

## 🔧 Environment Configuration

### Backend (.env)
```env
PORT=
NODE_ENV=
MONGODB_URI=
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
CORS_ORIGIN=
```

### Frontend (.env)
```env
VITE_API_BASE_URL=
VITE_APP_NAME=
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Questions
- `GET /api/questions` - Get questions (with filtering)
- `POST /api/questions` - Create question
- `GET /api/questions/:id` - Get single question
- `PUT /api/questions/:id` - Update question
- `POST /api/questions/:id/vote` - Vote on question

### Answers
- `GET /api/answers/question/:id` - Get answers for question
- `POST /api/answers` - Create answer
- `POST /api/answers/:id/accept` - Accept answer
- `POST /api/answers/:id/vote` - Vote on answer

### Tags & Users
- `GET /api/tags/popular` - Get popular tags
- `GET /api/users/:id` - Get user profile

## 🔐 Authentication Flow

1. **Register/Login** → Get JWT token
2. **Token stored** in localStorage
3. **API requests** include Authorization header
4. **Protected routes** check authentication
5. **Logout** clears token

## 📊 Features Implemented

### Frontend
- ✅ User authentication (login/register)
- ✅ Question listing with search & filters
- ✅ Question detail pages
- ✅ Answer creation and display
- ✅ Tag system
- ✅ Voting system (UI ready)
- ✅ Responsive design
- ✅ Real-time form validation

### Backend
- ✅ JWT authentication
- ✅ User management
- ✅ Question CRUD operations
- ✅ Answer CRUD operations
- ✅ Tag management
- ✅ Voting system
- ✅ Search functionality
- ✅ Pagination
- ✅ Error handling
- ✅ Input validation






