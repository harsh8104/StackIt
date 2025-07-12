import Question from '../models/Question.js';
import Answer from '../models/Answer.js';
import Tag from '../models/Tag.js';

// @desc    Get all questions
// @route   GET /api/questions
// @access  Public
export const getQuestions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sort = req.query.sort || 'newest'; // newest, votes, views, unanswered
    const search = req.query.search || '';
    const tags = req.query.tags ? req.query.tags.split(',') : [];
    const status = req.query.status || 'open';

    const skip = (page - 1) * limit;

    // Build query
    let query = {};

    // Search functionality
    if (search) {
      query.$text = { $search: search };
    }

    // Filter by tags
    if (tags.length > 0) {
      query.tags = { $all: tags };
    }

    // Filter by status
    if (status !== 'all') {
      query.status = status;
    }

    // Build sort object
    let sortObj = {};
    switch (sort) {
      case 'votes':
        sortObj = { voteCount: -1, createdAt: -1 };
        break;
      case 'views':
        sortObj = { views: -1, createdAt: -1 };
        break;
      case 'unanswered':
        query.answerCount = 0;
        sortObj = { createdAt: -1 };
        break;
      case 'newest':
      default:
        sortObj = { createdAt: -1 };
        break;
    }

    const questions = await Question.find(query)
      .populate('author', 'username avatar reputation badges')
      .populate('answerCount')
      .populate('acceptedAnswer')
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const total = await Question.countDocuments(query);

    res.json({
      success: true,
      data: questions,
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

// @desc    Get single question
// @route   GET /api/questions/:id
// @access  Public
export const getQuestion = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id)
      .populate('author', 'username avatar reputation badges')
      .populate('answerCount')
      .populate('acceptedAnswer');

    if (!question) {
      return res.status(404).json({
        success: false,
        error: 'Question not found'
      });
    }

    // Increment view count
    await question.addView();

    res.json({
      success: true,
      data: question
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create question
// @route   POST /api/questions
// @access  Private
export const createQuestion = async (req, res, next) => {
  try {
    const { title, description, tags } = req.body;

    // Process tags
    const processedTags = [];
    for (const tagName of tags) {
      const tag = await Tag.findOrCreate(tagName);
      processedTags.push(tag.name);
    }

    const question = await Question.create({
      title,
      description,
      tags: processedTags,
      author: req.user._id
    });

    // Populate author info
    await question.populate('author', 'username avatar reputation badges');

    res.status(201).json({
      success: true,
      data: question
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update question
// @route   PUT /api/questions/:id
// @access  Private
export const updateQuestion = async (req, res, next) => {
  try {
    const { title, description, tags } = req.body;

    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({
        success: false,
        error: 'Question not found'
      });
    }

    // Check ownership
    if (question.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this question'
      });
    }

    // Process tags if provided
    let processedTags = question.tags;
    if (tags) {
      processedTags = [];
      for (const tagName of tags) {
        const tag = await Tag.findOrCreate(tagName);
        processedTags.push(tag.name);
      }
    }

    // Update question
    question.title = title || question.title;
    question.description = description || question.description;
    question.tags = processedTags;
    question.lastActivity = new Date();

    await question.save();
    await question.populate('author', 'username avatar reputation badges');

    res.json({
      success: true,
      data: question
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete question
// @route   DELETE /api/questions/:id
// @access  Private
export const deleteQuestion = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({
        success: false,
        error: 'Question not found'
      });
    }

    // Check ownership
    if (question.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this question'
      });
    }

    // Delete associated answers
    await Answer.deleteMany({ question: question._id });

    // Decrement tag usage counts
    for (const tagName of question.tags) {
      const tag = await Tag.findOne({ name: tagName });
      if (tag) {
        await tag.decrementUsage();
      }
    }

    await question.deleteOne();

    res.json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Vote on question
// @route   POST /api/questions/:id/vote
// @access  Private
export const voteQuestion = async (req, res, next) => {
  try {
    const { voteType } = req.body; // 'upvote' or 'downvote'

    if (!['upvote', 'downvote'].includes(voteType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid vote type'
      });
    }

    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({
        success: false,
        error: 'Question not found'
      });
    }

    // Check if user is voting on their own question
    if (question.author.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        error: 'Cannot vote on your own question'
      });
    }

    await question.addVote(req.user._id, voteType);

    res.json({
      success: true,
      data: {
        voteCount: question.voteCount,
        hasUpvoted: question.hasUserVoted(req.user._id, 'upvote'),
        hasDownvoted: question.hasUserVoted(req.user._id, 'downvote')
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove vote from question
// @route   DELETE /api/questions/:id/vote
// @access  Private
export const removeVote = async (req, res, next) => {
  try {
    const { voteType } = req.query; // 'upvote' or 'downvote'

    if (!['upvote', 'downvote'].includes(voteType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid vote type'
      });
    }

    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({
        success: false,
        error: 'Question not found'
      });
    }

    await question.removeVote(req.user._id, voteType);

    res.json({
      success: true,
      data: {
        voteCount: question.voteCount,
        hasUpvoted: question.hasUserVoted(req.user._id, 'upvote'),
        hasDownvoted: question.hasUserVoted(req.user._id, 'downvote')
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get questions by user
// @route   GET /api/questions/user/:userId
// @access  Public
export const getQuestionsByUser = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const questions = await Question.find({ author: req.params.userId })
      .populate('author', 'username avatar reputation badges')
      .populate('answerCount')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Question.countDocuments({ author: req.params.userId });

    res.json({
      success: true,
      data: questions,
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