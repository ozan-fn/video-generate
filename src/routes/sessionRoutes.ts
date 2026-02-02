import { Router } from 'express';
import { checkSessionStatus, createSession, getSession, getSessions } from '../controllers/sessionController';

const router = Router();

// create session
router.post('/', createSession);
router.get('/', getSessions);
router.get('/:id', getSession);
router.get('/:id/status', checkSessionStatus);

export default router;
