import Tag from '../models/Tag.js';
import Question from '../models/Question.js';

// @desc    Get all tags
// @route   GET /api/tags
// @access  Public
export const getTags = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const sort = req.query.sort || 'popular'; // popular, name, newest
    const skip = (page - 1) * limit;

    // Build sort object
    let sortObj = {};
    switch (sort) {
      case 'name':
        sortObj = { name: 1 };
        break;
      case 'newest':
        sortObj = { createdAt: -1 };
        break;
      case 'popular':
      default:
        sortObj = { usageCount: -1, name: 1 };
        break;
    }

    const tags = await Tag.find({ isModerated: false })
      .sort(sortObj)
      .skip(skip)
      .limit(limit);

    const total = await Tag.countDocuments({ isModerated: false });

    res.json({
      success: true,
      data: tags,
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

// @desc    Get popular tags
// @route   GET /api/tags/popular
// @access  Public
export const getPopularTags = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    const tags = await Tag.getPopularTags(limit);

    res.json({
      success: true,
      data: tags
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search tags
// @route   GET /api/tags/search
// @access  Public
export const searchTags = async (req, res, next) => {
  try {
    const { q: query } = req.query;
    const limit = parseInt(req.query.limit) || 10;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const tags = await Tag.searchTags(query, limit);

    res.json({
      success: true,
      data: tags
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get tag details
// @route   GET /api/tags/:name
// @access  Public
export const getTagDetails = async (req, res, next) => {
  try {
    const tagName = req.params.name.toLowerCase();

    const tag = await Tag.findOne({ name: tagName });

    if (!tag) {
      return res.status(404).json({
        success: false,
        error: 'Tag not found'
      });
    }

    // Get questions with this tag
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sort = req.query.sort || 'newest'; // newest, votes, unanswered
    const skip = (page - 1) * limit;

    // Build sort object
    let sortObj = {};
    switch (sort) {
      case 'votes':
        sortObj = { voteCount: -1, createdAt: -1 };
        break;
      case 'unanswered':
        sortObj = { createdAt: -1 };
        break;
      case 'newest':
      default:
        sortObj = { createdAt: -1 };
        break;
    }

    let query = { tags: tagName };
    if (sort === 'unanswered') {
      query.answerCount = 0;
    }

    const questions = await Question.find(query)
      .populate('author', 'username avatar reputation badges')
      .populate('answerCount')
      .sort(sortObj)
      .skip(skip)
      .limit(limit);

    const total = await Question.countDocuments(query);

    res.json({
      success: true,
      data: {
        tag,
        questions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create tag
// @route   POST /api/tags
// @access  Private
export const createTag = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    // Check if tag already exists
    const existingTag = await Tag.findOne({ name: name.toLowerCase() });
    if (existingTag) {
      return res.status(400).json({
        success: false,
        error: 'Tag already exists'
      });
    }

    const tag = await Tag.create({
      name: name.toLowerCase(),
      description,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      data: tag
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update tag
// @route   PUT /api/tags/:id
// @access  Private (Admin/Moderator)
export const updateTag = async (req, res, next) => {
  try {
    const { description, synonyms } = req.body;

    // Check if user is admin or moderator
    if (!req.user.badges.some(badge => ['admin', 'moderator'].includes(badge))) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update tags'
      });
    }

    const tag = await Tag.findByIdAndUpdate(
      req.params.id,
      {
        description: description || tag.description,
        synonyms: synonyms || tag.synonyms
      },
      { new: true, runValidators: true }
    );

    if (!tag) {
      return res.status(404).json({
        success: false,
        error: 'Tag not found'
      });
    }

    res.json({
      success: true,
      data: tag
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get tag statistics
// @route   GET /api/tags/:name/stats
// @access  Public
export const getTagStats = async (req, res, next) => {
  try {
    const tagName = req.params.name.toLowerCase();

    const tag = await Tag.findOne({ name: tagName });
    if (!tag) {
      return res.status(404).json({
        success: false,
        error: 'Tag not found'
      });
    }

    // Get question count
    const questionCount = await Question.countDocuments({ tags: tagName });

    // Get answer count for questions with this tag
    const questions = await Question.find({ tags: tagName }).select('_id');
    const questionIds = questions.map(q => q._id);
    const answerCount = await Question.aggregate([
      { $match: { _id: { $in: questionIds } } },
      { $lookup: { from: 'answers', localField: '_id', foreignField: 'question', as: 'answers' } },
      { $unwind: '$answers' },
      { $count: 'total' }
    ]);

    // Get top users for this tag
    const topUsers = await Question.aggregate([
      { $match: { tags: tagName } },
      { $group: { _id: '$author', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { username: '$user.username', avatar: '$user.avatar', questionCount: '$count' } }
    ]);

    res.json({
      success: true,
      data: {
        tag,
        questionCount,
        answerCount: answerCount.length > 0 ? answerCount[0].total : 0,
        topUsers
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get related tags
// @route   GET /api/tags/:name/related
// @access  Public
export const getRelatedTags = async (req, res, next) => {
  try {
    const tagName = req.params.name.toLowerCase();
    const limit = parseInt(req.query.limit) || 10;

    // Find questions with this tag and get other tags used with it
    const relatedTags = await Question.aggregate([
      { $match: { tags: tagName } },
      { $unwind: '$tags' },
      { $match: { tags: { $ne: tagName } } },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
      { $project: { name: '$_id', count: 1, _id: 0 } }
    ]);

    res.json({
      success: true,
      data: relatedTags
    });
  } catch (error) {
    next(error);
  }
}; 