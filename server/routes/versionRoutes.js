import express from 'express';
import { getVersions, createVersion, restoreVersion } from '../controllers/versionController.js';
import { protect } from '../middleware/auth.js';
import { requireDocumentRole } from '../middleware/rbac.js';

const router = express.Router();

router.use(protect);

router.get('/:documentId', requireDocumentRole('EDITOR'), getVersions);
router.post('/:documentId', requireDocumentRole('EDITOR'), createVersion);
router.post('/:documentId/:versionId/restore', requireDocumentRole('EDITOR'), restoreVersion);

export default router;
