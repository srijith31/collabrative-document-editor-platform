import express from 'express';
import { createInvite, acceptInvite } from '../controllers/inviteController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', createInvite);
router.post('/accept/:token', acceptInvite);

export default router;
