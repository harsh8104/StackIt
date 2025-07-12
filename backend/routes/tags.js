import express from 'express';
import { body } from 'express-validator';
import {
  getTags,
  getPopularTags,
  searchTags,
  getTagDetails,
  createTag,
  updateTag,
  getTagStats,
  getRelatedTags
} from '../controllers/tagController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Validation middleware
const tagValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage('Tag name must be between 2 and 30 characters')
    .matches(/^[a-zA-Z0-9-]+$/)
    .withMessage('Tag name can only contain letters, numbers, and hyphens'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Tag description cannot exceed 500 characters')
];

// Public routes
router.get('/', getTags);
router.get('/popular', getPopularTags);
router.get('/search', searchTags);
router.get('/:name', getTagDetails);
router.get('/:name/stats', getTagStats);
router.get('/:name/related', getRelatedTags);

// Protected routes
router.post('/', protect, tagValidation, createTag);
router.put('/:id', protect, tagValidation, updateTag);

export default router; 