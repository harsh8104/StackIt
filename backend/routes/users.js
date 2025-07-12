import express from 'express';
import {
  getAllUsers,
  getUserProfile,
  getUserStats,
  getTopUsers,
  searchUsers,
  updateReputation,
  getUserActivity
} from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getAllUsers);
router.get('/top', getTopUsers);
router.get('/search', searchUsers);
router.get('/:id', getUserProfile);
router.get('/:id/stats', getUserStats);
router.get('/:id/activity', getUserActivity);

// Protected routes (admin only)
router.put('/:id/reputation', protect, updateReputation);

export default router; 