import express from 'express';
import { getActivityLog } from '../controllers/activityController.js';
import { protect } from '../middleware/auth.js';
import { requireDocumentRole } from '../middleware/rbac.js';

const router = express.Router();

router.use(protect);

router.get('/:documentId', requireDocumentRole('VIEWER'), getActivityLog);

export default router;
