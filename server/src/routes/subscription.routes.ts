import { Router } from 'express';
import * as ctrl from '../controllers/subscription.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Public: get pricing tiers & checkout config
router.get('/pricing', ctrl.getPricing);
router.get('/config', ctrl.getCheckoutConfig);

// Authenticated: subscription management
router.get('/', authenticate, ctrl.getSubscription);
router.post('/checkout', authenticate, ctrl.createCheckout);
router.patch('/change', authenticate, ctrl.changePlan);
router.post('/cancel', authenticate, ctrl.cancelSubscription);
router.post('/reactivate', authenticate, ctrl.reactivateSubscription);
router.get('/payments', authenticate, ctrl.getPaymentHistory);
router.post('/portal', authenticate, ctrl.createPortalSession);
router.post('/verify-razorpay', authenticate, ctrl.verifyRazorpayPayment);

export default router;
