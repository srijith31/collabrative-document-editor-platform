import express from 'express';
import {
  getStats,
  getRecentActivityLog,
  getMonthlyCreationStats,
  getDocumentCollaborationStats,
  getUserProductivityStats
} from '../controllers/analyticsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All analytics routes require authentication
router.use(protect);

router.get('/stats', getStats);
router.get('/recent-activity', getRecentActivityLog);
router.get('/monthly-creation', getMonthlyCreationStats);
router.get('/document-stats', getDocumentCollaborationStats);
router.get('/productivity', getUserProductivityStats);

export default router;
