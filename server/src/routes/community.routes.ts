import { Router } from 'express';
import * as communityController from '../controllers/community.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { Role } from '../types/enums.js';

const router = Router();
const auth = [authenticate, authorize(Role.CREATOR)] as const;

/* Inbox / interactions */
router.get('/', ...auth, communityController.getInteractions);
router.get('/stats', ...auth, communityController.getStats);
router.get('/:id', ...auth, communityController.getInteractionById);
router.post('/:id/responded', ...auth, communityController.markResponded);
router.patch('/:id/read', ...auth, communityController.markRead);
router.post('/bulk-read', ...auth, communityController.markBulkRead);
router.patch('/:id/case', ...auth, communityController.updateCase);
router.patch('/:id/assign', ...auth, communityController.assignInteraction);

/* Saved replies */
router.get('/saved-replies/list', ...auth, communityController.getSavedReplies);
router.post('/saved-replies', ...auth, communityController.createSavedReply);
router.patch('/saved-replies/:id', ...auth, communityController.updateSavedReply);
router.delete('/saved-replies/:id', ...auth, communityController.deleteSavedReply);
router.post('/saved-replies/:id/use', ...auth, communityController.useSavedReply);

/* Voice profile */
router.get('/voice-profile/me', ...auth, communityController.getVoiceProfile);
router.put('/voice-profile', ...auth, communityController.upsertVoiceProfile);

/* Threads */
router.get('/threads', ...auth, communityController.getThreads);

/* Inbox channels */
router.get('/channels', ...auth, communityController.getChannels);
router.post('/channels', ...auth, communityController.upsertChannel);
router.delete('/channels/:type', ...auth, communityController.deleteChannel);

/* Star / Unstar */
router.post('/:id/star', ...auth, communityController.starInteraction);
router.delete('/:id/star', ...auth, communityController.unstarInteraction);

export default router;
