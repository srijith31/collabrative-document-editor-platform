import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/auth.js';
import {
  importPdfToTemplate,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  getUserTemplates
} from '../controllers/templateController.js';

const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router();

router.use(protect); // All routes protected by JWT auth

router.post('/import-pdf', upload.single('file'), importPdfToTemplate);
router.get('/', getUserTemplates);
router.get('/:id', getTemplateById);
router.put('/:id', updateTemplate);
router.delete('/:id', deleteTemplate);

export default router;
