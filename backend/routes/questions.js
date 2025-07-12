import express from 'express';
import { body } from 'express-validator';
import {
  getQuestions,
  getQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  voteQuestion,
  removeVote,
  getQuestionsByUser
} from '../controllers/questionController.js';
import { protect, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Validation middleware
const questionValidation = [
  body('title')
    .trim()
    .isLength({ min: 10, max: 200 })
    .withMessage('Title must be between 10 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 20 })
    .withMessage('Description must be at least 20 characters'),
  body('tags')
    .isArray({ min: 1, max: 5 })
    .withMessage('Must provide between 1 and 5 tags'),
  body('tags.*')
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage('Each tag must be between 2 and 30 characters')
    .matches(/^[a-zA-Z0-9-]+$/)
    .withMessage('Tags can only contain letters, numbers, and hyphens')
];

const voteValidation = [
  body('voteType')
    .isIn(['upvote', 'downvote'])
    .withMessage('Vote type must be either upvote or downvote')
];

// Public routes
router.get('/', optionalAuth, getQuestions);
router.get('/:id', optionalAuth, getQuestion);
router.get('/user/:userId', getQuestionsByUser);

// Protected routes
router.post('/', protect, questionValidation, createQuestion);
router.put('/:id', protect, questionValidation, updateQuestion);
router.delete('/:id', protect, deleteQuestion);
router.post('/:id/vote', protect, voteValidation, voteQuestion);
router.delete('/:id/vote', protect, removeVote);

export default router; 