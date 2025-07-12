import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Question from './models/Question.js';
import Answer from './models/Answer.js';
import Tag from './models/Tag.js';

// Load environment variables
dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

const createSampleData = async () => {
  try {
    console.log('🚀 Creating sample data...');

    // Create sample tags
    const tags = await Tag.create([
      { name: 'react', description: 'React.js framework', usageCount: 0 },
      { name: 'javascript', description: 'JavaScript programming language', usageCount: 0 },
      { name: 'nodejs', description: 'Node.js runtime environment', usageCount: 0 },
      { name: 'mongodb', description: 'MongoDB database', usageCount: 0 },
      { name: 'express', description: 'Express.js web framework', usageCount: 0 },
      { name: 'authentication', description: 'User authentication and authorization', usageCount: 0 },
      { name: 'api', description: 'Application Programming Interface', usageCount: 0 },
      { name: 'testing', description: 'Software testing and quality assurance', usageCount: 0 }
    ]);

    console.log('✅ Tags created');

    // Create sample users
    const users = await User.create([
      {
        username: 'john_doe',
        email: 'john@example.com',
        password: 'password123',
        bio: 'Full-stack developer with 5 years of experience',
        reputation: 150,
        badges: ['regular']
      },
      {
        username: 'jane_smith',
        email: 'jane@example.com',
        password: 'password123',
        bio: 'Frontend specialist and React enthusiast',
        reputation: 200,
        badges: ['expert']
      },
      {
        username: 'dev_expert',
        email: 'expert@example.com',
        password: 'password123',
        bio: 'Senior developer and community contributor',
        reputation: 500,
        badges: ['expert', 'moderator']
      }
    ]);

    console.log('✅ Users created');

    // Create sample questions
    const questions = await Question.create([
      {
        title: 'How to implement JWT authentication in React?',
        description: 'I\'m building a React application and need to implement JWT token-based authentication. What\'s the best approach for storing tokens securely and handling authentication state? I\'ve heard about localStorage vs httpOnly cookies, but I\'m not sure which is better for security.',
        author: users[0]._id,
        tags: ['react', 'javascript', 'authentication'],
        votes: {
          upvotes: [{ user: users[1]._id }, { user: users[2]._id }],
          downvotes: []
        },
        views: 45
      },
      {
        title: 'MongoDB vs PostgreSQL for a new project',
        description: 'I\'m starting a new web application and can\'t decide between MongoDB and PostgreSQL. What are the key differences in terms of performance, scalability, and ease of use? My app will handle user data, posts, and comments.',
        author: users[1]._id,
        tags: ['mongodb', 'api', 'database'],
        votes: {
          upvotes: [{ user: users[0]._id }],
          downvotes: []
        },
        views: 32
      },
      {
        title: 'Best practices for React component testing',
        description: 'What are the current best practices for testing React components? Should I use Jest, React Testing Library, or something else? I want to ensure good test coverage and maintainable tests.',
        author: users[2]._id,
        tags: ['react', 'testing', 'javascript'],
        votes: {
          upvotes: [{ user: users[0]._id }, { user: users[1]._id }],
          downvotes: []
        },
        views: 28
      }
    ]);

    console.log('✅ Questions created');

    // Create sample answers
    const answers = await Answer.create([
      {
        content: 'For JWT authentication in React, I recommend using a combination of localStorage for token storage and Context API for state management. Here\'s a comprehensive approach:\n\n1. Store JWT tokens in localStorage\n2. Create an AuthContext to manage authentication state\n3. Use axios interceptors for automatic token attachment\n4. Implement token refresh logic\n\nHowever, for better security, consider using httpOnly cookies to prevent XSS attacks.',
        question: questions[0]._id,
        author: users[1]._id,
        votes: {
          upvotes: [{ user: users[0]._id }, { user: users[2]._id }],
          downvotes: []
        },
        isAccepted: true
      },
      {
        content: 'While localStorage is common, consider using httpOnly cookies for better security. This prevents XSS attacks from accessing your tokens. You can also implement a token refresh mechanism using a refresh token stored in httpOnly cookies.',
        question: questions[0]._id,
        author: users[2]._id,
        votes: {
          upvotes: [{ user: users[1]._id }],
          downvotes: []
        }
      },
      {
        content: 'MongoDB is great for flexible schemas and rapid development, while PostgreSQL excels at complex queries and ACID compliance. Choose MongoDB if you need schema flexibility, and PostgreSQL if you need complex relationships and transactions.',
        question: questions[1]._id,
        author: users[0]._id,
        votes: {
          upvotes: [{ user: users[1]._id }],
          downvotes: []
        }
      }
    ]);

    console.log('✅ Answers created');

    // Update tag usage counts
    for (const question of questions) {
      for (const tagName of question.tags) {
        const tag = await Tag.findOne({ name: tagName });
        if (tag) {
          await tag.incrementUsage();
        }
      }
    }

    console.log('✅ Tag usage counts updated');

    console.log('\n🎉 Sample data created successfully!');
    console.log('\nSample users:');
    console.log('- john_doe (john@example.com) / password123');
    console.log('- jane_smith (jane@example.com) / password123');
    console.log('- dev_expert (expert@example.com) / password123');

  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  }
};

const main = async () => {
  await connectDB();
  await createSampleData();
  process.exit(0);
};

main(); 