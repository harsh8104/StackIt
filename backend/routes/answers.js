import express from 'express';
import { body } from 'express-validator';
import {
  getAnswers,
  getAnswer,
  createAnswer,
  updateAnswer,
  deleteAnswer,
  voteAnswer,
  removeVote,
  acceptAnswer,
  addComment,
  getAnswersByUser
} from '../controllers/answerController.js';
import { protect, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Validation middleware
const answerValidation = [
  body('content')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Answer must be at least 10 characters'),
  body('questionId')
    .isMongoId()
    .withMessage('Valid question ID is required')
];

const commentValidation = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Comment must be between 1 and 500 characters')
];

const voteValidation = [
  body('voteType')
    .isIn(['upvote', 'downvote'])
    .withMessage('Vote type must be either upvote or downvote')
];

// Public routes
router.get('/question/:questionId', optionalAuth, getAnswers);
router.get('/:id', optionalAuth, getAnswer);
router.get('/user/:userId', getAnswersByUser);

// Protected routes
router.post('/', protect, answerValidation, createAnswer);
router.put('/:id', protect, answerValidation, updateAnswer);
router.delete('/:id', protect, deleteAnswer);
router.post('/:id/vote', protect, voteValidation, voteAnswer);
router.delete('/:id/vote', protect, removeVote);
router.post('/:id/accept', protect, acceptAnswer);
router.post('/:id/comments', protect, commentValidation, addComment);

export default router; 