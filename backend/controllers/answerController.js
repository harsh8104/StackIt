import Answer from '../models/Answer.js';
import Question from '../models/Question.js';
import Notification from '../models/Notification.js';

// @desc    Get answers for a question
// @route   GET /api/answers/question/:questionId
// @access  Public
export const getAnswers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sort = req.query.sort || 'votes'; // votes, newest, oldest
    const skip = (page - 1) * limit;

    // Build sort object
    let sortObj = {};
    switch (sort) {
      case 'newest':
        sortObj = { createdAt: -1 };
        break;
      case 'oldest':
        sortObj = { createdAt: 1 };
        break;
      case 'votes':
      default:
        sortObj = { voteCount: -1, createdAt: -1 };
        break;
    }

    const answers = await Answer.find({ question: req.params.questionId })
      .populate('author', 'username avatar reputation badges')
      .populate('comments.author', 'username avatar')
      .sort(sortObj)
      .skip(skip)
      .limit(limit);

    const total = await Answer.countDocuments({ question: req.params.questionId });

    res.json({
      success: true,
      data: answers,
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

// @desc    Get single answer
// @route   GET /api/answers/:id
// @access  Public
export const getAnswer = async (req, res, next) => {
  try {
    const answer = await Answer.findById(req.params.id)
      .populate('author', 'username avatar reputation badges')
      .populate('comments.author', 'username avatar')
      .populate('question', 'title');

    if (!answer) {
      return res.status(404).json({
        success: false,
        error: 'Answer not found'
      });
    }

    res.json({
      success: true,
      data: answer
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create answer
// @route   POST /api/answers
// @access  Private
export const createAnswer = async (req, res, next) => {
  try {
    const { content, questionId } = req.body;

    // Check if question exists
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        error: 'Question not found'
      });
    }

    // Check if user has already answered this question
    const existingAnswer = await Answer.findOne({
      question: questionId,
      author: req.user._id
    });

    if (existingAnswer) {
      return res.status(400).json({
        success: false,
        error: 'You have already answered this question'
      });
    }

    const answer = await Answer.create({
      content,
      question: questionId,
      author: req.user._id
    });

    // Update question's last activity
    await question.updateLastActivity();

    // Create notification for question author (if not answering their own question)
    if (question.author.toString() !== req.user._id.toString()) {
      await Notification.createNotification({
        recipient: question.author,
        sender: req.user._id,
        type: 'answer',
        question: questionId,
        content: `Someone answered your question "${question.title}"`,
        metadata: {
          questionTitle: question.title,
          answerPreview: content.substring(0, 100) + (content.length > 100 ? '...' : '')
        }
      });
    }

    // Populate author info
    await answer.populate('author', 'username avatar reputation badges');

    res.status(201).json({
      success: true,
      data: answer
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update answer
// @route   PUT /api/answers/:id
// @access  Private
export const updateAnswer = async (req, res, next) => {
  try {
    const { content } = req.body;

    const answer = await Answer.findById(req.params.id);

    if (!answer) {
      return res.status(404).json({
        success: false,
        error: 'Answer not found'
      });
    }

    // Check ownership
    if (answer.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this answer'
      });
    }

    // Update answer with edit history
    await answer.editAnswer(content, req.user._id);

    // Update question's last activity
    const question = await Question.findById(answer.question);
    if (question) {
      await question.updateLastActivity();
    }

    await answer.populate('author', 'username avatar reputation badges');

    res.json({
      success: true,
      data: answer
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete answer
// @route   DELETE /api/answers/:id
// @access  Private
export const deleteAnswer = async (req, res, next) => {
  try {
    const answer = await Answer.findById(req.params.id);

    if (!answer) {
      return res.status(404).json({
        success: false,
        error: 'Answer not found'
      });
    }

    // Check ownership
    if (answer.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this answer'
      });
    }

    // Update question's last activity
    const question = await Question.findById(answer.question);
    if (question) {
      await question.updateLastActivity();
    }

    await answer.deleteOne();

    res.json({
      success: true,
      message: 'Answer deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Vote on answer
// @route   POST /api/answers/:id/vote
// @access  Private
export const voteAnswer = async (req, res, next) => {
  try {
    const { voteType } = req.body; // 'upvote' or 'downvote'

    if (!['upvote', 'downvote'].includes(voteType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid vote type'
      });
    }

    const answer = await Answer.findById(req.params.id);

    if (!answer) {
      return res.status(404).json({
        success: false,
        error: 'Answer not found'
      });
    }

    // Check if user is voting on their own answer
    if (answer.author.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        error: 'Cannot vote on your own answer'
      });
    }

    await answer.addVote(req.user._id, voteType);

    res.json({
      success: true,
      data: {
        voteCount: answer.voteCount,
        hasUpvoted: answer.hasUserVoted(req.user._id, 'upvote'),
        hasDownvoted: answer.hasUserVoted(req.user._id, 'downvote')
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove vote from answer
// @route   DELETE /api/answers/:id/vote
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

    const answer = await Answer.findById(req.params.id);

    if (!answer) {
      return res.status(404).json({
        success: false,
        error: 'Answer not found'
      });
    }

    await answer.removeVote(req.user._id, voteType);

    res.json({
      success: true,
      data: {
        voteCount: answer.voteCount,
        hasUpvoted: answer.hasUserVoted(req.user._id, 'upvote'),
        hasDownvoted: answer.hasUserVoted(req.user._id, 'downvote')
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Accept answer
// @route   POST /api/answers/:id/accept
// @access  Private
export const acceptAnswer = async (req, res, next) => {
  try {
    const answer = await Answer.findById(req.params.id);

    if (!answer) {
      return res.status(404).json({
        success: false,
        error: 'Answer not found'
      });
    }

    // Check if user owns the question
    const question = await Question.findById(answer.question);
    if (!question) {
      return res.status(404).json({
        success: false,
        error: 'Question not found'
      });
    }

    if (question.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Only the question author can accept answers'
      });
    }

    await answer.acceptAnswer();

    // Update question's accepted status
    question.isAccepted = true;
    await question.save();

    res.json({
      success: true,
      message: 'Answer accepted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add comment to answer
// @route   POST /api/answers/:id/comments
// @access  Private
export const addComment = async (req, res, next) => {
  try {
    const { content } = req.body;

    const answer = await Answer.findById(req.params.id);

    if (!answer) {
      return res.status(404).json({
        success: false,
        error: 'Answer not found'
      });
    }

    await answer.addComment(req.user._id, content);

    // Populate comment author
    await answer.populate('comments.author', 'username avatar');

    res.json({
      success: true,
      data: answer.comments[answer.comments.length - 1]
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get answers by user
// @route   GET /api/answers/user/:userId
// @access  Public
export const getAnswersByUser = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const answers = await Answer.find({ author: req.params.userId })
      .populate('author', 'username avatar reputation badges')
      .populate('question', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Answer.countDocuments({ author: req.params.userId });

    res.json({
      success: true,
      data: answers,
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