import express from 'express';
import { 
  getSuggestions, 
  createSuggestion, 
  acceptSuggestion, 
  rejectSuggestion 
} from '../controllers/suggestionController.js';
import { protect } from '../middleware/auth.js';
import { requireDocumentRole } from '../middleware/rbac.js';

const router = express.Router();

router.use(protect);

router.get('/:documentId', requireDocumentRole('VIEWER'), getSuggestions);
router.post('/:documentId', requireDocumentRole('COMMENTER'), createSuggestion);
router.put('/:documentId/:suggestionId/accept', requireDocumentRole('EDITOR'), acceptSuggestion);
router.put('/:documentId/:suggestionId/reject', requireDocumentRole('EDITOR'), rejectSuggestion);

export default router;
