# Question Beacon Hub - Full Stack Setup Guide

## 🚀 Quick Start

### 1. Backend Setup
```bash
cd backend
npm install
cp env.example .env
# Edit .env with your MongoDB URI
npm run dev
```

### 2. Frontend Setup
```bash
# In the root directory
npm install
cp env.example .env
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
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/question-beacon-hub
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
```

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=Question Beacon Hub
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

## 🧪 Sample Data

The setup script creates:
- 3 sample users (john_doe, jane_smith, dev_expert)
- 3 sample questions with answers
- 8 popular tags
- Sample voting data

**Login credentials:**
- Email: `john@example.com` / Password: `password123`
- Email: `jane@example.com` / Password: `password123`
- Email: `expert@example.com` / Password: `password123`

## 🚀 Deployment

### Backend (Heroku/Railway)
1. Set environment variables
2. Deploy to platform
3. Update frontend API URL

### Frontend (Vercel/Netlify)
1. Set environment variables
2. Deploy to platform
3. Update CORS settings in backend

## 🔧 Development

### Backend Commands
```bash
npm run dev      # Start development server
npm run setup    # Create sample data
npm start        # Start production server
```

### Frontend Commands
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

## 🐛 Troubleshooting

### Common Issues
1. **CORS errors** - Check CORS_ORIGIN in backend .env
2. **MongoDB connection** - Verify MONGODB_URI
3. **JWT errors** - Check JWT_SECRET is set
4. **API 404** - Ensure backend is running on port 5000

### Debug Mode
- Backend: `NODE_ENV=development` shows detailed logs
- Frontend: Check browser console for API errors

## 📈 Next Steps

1. **Add real-time features** (WebSocket)
2. **Implement file uploads** for avatars
3. **Add email notifications**
4. **Create admin panel**
5. **Add analytics dashboard**
6. **Implement search suggestions**
7. **Add question/answer editing**
8. **Create user reputation system**

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

---

**🎉 Your Question Beacon Hub is now ready!**

Start both servers and visit `http://localhost:5173` to see your Q&A platform in action. 