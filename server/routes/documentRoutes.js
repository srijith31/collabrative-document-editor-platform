import express from 'express';
import { 
  createDocument, 
  getDocuments, 
  getDocumentById, 
  updateDocument, 
  deleteDocument, 
  shareDocument,
  toggleStar,
} from '../controllers/documentController.js';
import { protect } from '../middleware/auth.js';
import { requireDocumentRole } from '../middleware/rbac.js';

const router = express.Router();

router.use(protect); // All routes protected by JWT auth

router.post('/', createDocument);
router.get('/', getDocuments);
router.get('/:id', requireDocumentRole('VIEWER'), getDocumentById);
router.put('/:id', requireDocumentRole('EDITOR'), updateDocument);
router.delete('/:id', requireDocumentRole('VIEWER'), deleteDocument);
router.put('/:id/share', requireDocumentRole('OWNER'), shareDocument);
router.put('/:id/star', requireDocumentRole('VIEWER'), toggleStar);

export default router;
