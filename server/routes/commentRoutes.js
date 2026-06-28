import express from 'express';
import { getComments, createComment, replyComment, resolveComment } from '../controllers/commentController.js';
import { protect } from '../middleware/auth.js';
import { requireDocumentRole } from '../middleware/rbac.js';

const router = express.Router();

router.use(protect);

router.get('/:documentId', requireDocumentRole('VIEWER'), getComments);
router.post('/:documentId', requireDocumentRole('COMMENTER'), createComment);
router.post('/:documentId/:commentId/reply', requireDocumentRole('COMMENTER'), replyComment);
router.put('/:documentId/:commentId/resolve', requireDocumentRole('VIEWER'), resolveComment);

export default router;
