# Question Beacon Hub Backend

A robust Node.js/Express backend API for the Question Beacon Hub Q&A platform, built with MongoDB and Mongoose.

## Features

- **User Authentication**: JWT-based authentication with registration, login, and profile management
- **Questions & Answers**: Full CRUD operations with voting, acceptance, and comments
- **Tag System**: Dynamic tag management with usage statistics
- **User Management**: User profiles, reputation system, and activity tracking
- **Search & Filtering**: Advanced search with text indexing and tag filtering
- **Voting System**: Upvote/downvote functionality for questions and answers
- **Security**: Input validation, rate limiting, CORS, and helmet security
- **Modular Architecture**: Clean separation of concerns with models, controllers, and routes

## Tech Stack

- **Runtime**: Node.js with ES modules
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Express-validator
- **Security**: Helmet, CORS, Rate limiting
- **Password Hashing**: bcryptjs

## Project Structure

```
backend/
├── config/
│   └── database.js          # MongoDB connection configuration
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── questionController.js # Question CRUD operations
│   ├── answerController.js  # Answer CRUD operations
│   ├── userController.js    # User management
│   └── tagController.js     # Tag management
├── middleware/
│   ├── auth.js             # JWT authentication middleware
│   ├── errorHandler.js     # Global error handling
│   └── notFound.js         # 404 handler
├── models/
│   ├── User.js             # User schema and methods
│   ├── Question.js         # Question schema and methods
│   ├── Answer.js           # Answer schema and methods
│   └── Tag.js              # Tag schema and methods
├── routes/
│   ├── auth.js             # Authentication routes
│   ├── questions.js        # Question routes
│   ├── answers.js          # Answer routes
│   ├── users.js            # User routes
│   └── tags.js             # Tag routes
├── index.js                # Main server file
├── package.json            # Dependencies and scripts
└── env.example             # Environment variables template
```

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. **Clone the repository and navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   # Copy the example environment file
   cp env.example .env
   
   # Edit .env with your configuration
   # Replace MONGODB_URI with your MongoDB connection string
   ```

4. **Environment Variables**
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/question-beacon-hub
   # For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/question-beacon-hub
   
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=7d
   
   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   
   # CORS Configuration
   CORS_ORIGIN=http://localhost:5173
   ```

5. **Start the server**
   ```bash
   # Development mode with auto-restart
   npm run dev
   
   # Production mode
   npm start
   ```

6. **Verify the server is running**
   ```bash
   curl http://localhost:5000/api/health
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/password` - Change password
- `POST /api/auth/logout` - Logout user

### Questions
- `GET /api/questions` - Get all questions (with filtering)
- `GET /api/questions/:id` - Get single question
- `POST /api/questions` - Create new question
- `PUT /api/questions/:id` - Update question
- `DELETE /api/questions/:id` - Delete question
- `POST /api/questions/:id/vote` - Vote on question
- `DELETE /api/questions/:id/vote` - Remove vote
- `GET /api/questions/user/:userId` - Get questions by user

### Answers
- `GET /api/answers/question/:questionId` - Get answers for question
- `GET /api/answers/:id` - Get single answer
- `POST /api/answers` - Create new answer
- `PUT /api/answers/:id` - Update answer
- `DELETE /api/answers/:id` - Delete answer
- `POST /api/answers/:id/vote` - Vote on answer
- `DELETE /api/answers/:id/vote` - Remove vote
- `POST /api/answers/:id/accept` - Accept answer
- `POST /api/answers/:id/comments` - Add comment to answer
- `GET /api/answers/user/:userId` - Get answers by user

### Users
- `GET /api/users/:id` - Get user profile
- `GET /api/users/:id/stats` - Get user statistics
- `GET /api/users/:id/activity` - Get user activity
- `GET /api/users/top` - Get top users
- `GET /api/users/search` - Search users
- `PUT /api/users/:id/reputation` - Update user reputation (admin only)

### Tags
- `GET /api/tags` - Get all tags
- `GET /api/tags/popular` - Get popular tags
- `GET /api/tags/search` - Search tags
- `GET /api/tags/:name` - Get tag details
- `GET /api/tags/:name/stats` - Get tag statistics
- `GET /api/tags/:name/related` - Get related tags
- `POST /api/tags` - Create new tag
- `PUT /api/tags/:id` - Update tag (admin/moderator only)

## Database Models

### User Model
- Username, email, password (hashed)
- Avatar, bio, reputation, badges
- Virtual fields for question/answer counts
- Password comparison and public profile methods

### Question Model
- Title, description, author reference
- Tags array, voting system (upvotes/downvotes)
- Views, status, bounty system
- Virtual fields for vote count and answer count
- Methods for voting and activity tracking

### Answer Model
- Content, question reference, author reference
- Voting system, acceptance status
- Edit history, comments
- Methods for voting, acceptance, and editing

### Tag Model
- Name, description, usage count
- Synonyms, moderation status
- Methods for usage tracking and statistics

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs for password security
- **Input Validation**: Express-validator for request validation
- **Rate Limiting**: Prevents abuse with configurable limits
- **CORS Protection**: Configurable cross-origin resource sharing
- **Helmet Security**: Various HTTP headers for security
- **Error Handling**: Centralized error handling with proper status codes

## Development

### Scripts
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm test` - Run tests (when implemented)

### Adding New Features
1. Create/update models in `models/` directory
2. Add controller logic in `controllers/` directory
3. Define routes in `routes/` directory
4. Add validation middleware as needed
5. Update main `index.js` to include new routes

### Database Indexes
The application includes optimized database indexes for:
- Text search on questions
- Tag filtering
- User lookups
- Vote tracking
- Date-based sorting

## Deployment

### Environment Variables for Production
- Set `NODE_ENV=production`
- Use strong `JWT_SECRET`
- Configure production MongoDB URI
- Set appropriate CORS origins
- Configure rate limiting for production load

### MongoDB Atlas Setup
1. Create MongoDB Atlas account
2. Create a new cluster
3. Get connection string
4. Update `MONGODB_URI` in environment variables
5. Configure network access and database users

## Contributing

1. Follow the existing code structure
2. Add proper validation and error handling
3. Include JSDoc comments for complex functions
4. Test all endpoints before submitting
5. Update documentation for new features

## License

MIT License - see LICENSE file for details 