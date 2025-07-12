import User from '../models/User.js';
import Question from '../models/Question.js';
import Answer from '../models/Answer.js';

// @desc    Get user profile
// @route   GET /api/users/:id
// @access  Public
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('questionCount')
      .populate('answerCount');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user.getPublicProfile()
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user statistics
// @route   GET /api/users/:id/stats
// @access  Public
export const getUserStats = async (req, res, next) => {
  try {
    const userId = req.params.id;

    // Get question and answer counts
    const questionCount = await Question.countDocuments({ author: userId });
    const answerCount = await Answer.countDocuments({ author: userId });

    // Get total votes received on questions
    const questions = await Question.find({ author: userId });
    const questionVotes = questions.reduce((total, q) => total + q.voteCount, 0);

    // Get total votes received on answers
    const answers = await Answer.find({ author: userId });
    const answerVotes = answers.reduce((total, a) => total + a.voteCount, 0);

    // Get accepted answers count
    const acceptedAnswers = await Answer.countDocuments({
      author: userId,
      isAccepted: true
    });

    // Get user's reputation
    const user = await User.findById(userId).select('reputation badges');

    res.json({
      success: true,
      data: {
        questionCount,
        answerCount,
        totalVotes: questionVotes + answerVotes,
        acceptedAnswers,
        reputation: user.reputation,
        badges: user.badges
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Public
export const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .sort({ reputation: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('username avatar reputation badges bio createdAt');

    const total = await User.countDocuments();

    res.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get top users
// @route   GET /api/users/top
// @access  Public
export const getTopUsers = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const period = req.query.period || 'all'; // all, week, month

    let dateFilter = {};
    if (period === 'week') {
      dateFilter = { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } };
    } else if (period === 'month') {
      dateFilter = { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } };
    }

    const users = await User.find(dateFilter)
      .sort({ reputation: -1, questionCount: -1 })
      .limit(limit)
      .populate('questionCount')
      .populate('answerCount')
      .select('username avatar reputation badges questionCount answerCount');

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search users
// @route   GET /api/users/search
// @access  Public
export const searchUsers = async (req, res, next) => {
  try {
    const { q: query } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { bio: { $regex: query, $options: 'i' } }
      ]
    })
      .populate('questionCount')
      .populate('answerCount')
      .sort({ reputation: -1 })
      .skip(skip)
      .limit(limit)
      .select('username avatar reputation badges bio questionCount answerCount');

    const total = await User.countDocuments({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { bio: { $regex: query, $options: 'i' } }
      ]
    });

    res.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user reputation
// @route   PUT /api/users/:id/reputation
// @access  Private (Admin only)
export const updateReputation = async (req, res, next) => {
  try {
    const { reputation } = req.body;

    // Check if user is admin (you can implement admin check middleware)
    if (!req.user.badges.includes('admin')) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update reputation'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { reputation },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user activity
// @route   GET /api/users/:id/activity
// @access  Public
export const getUserActivity = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Get recent questions and answers
    const questions = await Question.find({ author: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title createdAt voteCount answerCount');

    const answers = await Answer.find({ author: userId })
      .populate('question', 'title')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('content createdAt voteCount isAccepted question');

    // Combine and sort by date
    const activities = [
      ...questions.map(q => ({ ...q.toObject(), type: 'question' })),
      ...answers.map(a => ({ ...a.toObject(), type: 'answer' }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    next(error);
  }
}; 