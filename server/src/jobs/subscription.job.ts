import { handleTrialExpiry } from '../services/subscription.service.js';
import { logger } from '../config/logger.js';

/** Daily job: check for expired trials and canceled subscriptions past their period. */
export async function processSubscriptionExpiry() {
  try {
    const result = await handleTrialExpiry();
    if (result.expiredTrials > 0 || result.expiredCanceled > 0) {
      logger.info(
        `Subscription expiry: ${result.expiredTrials} trials expired, ${result.expiredCanceled} cancellations finalized`,
      );
    }
  } catch (err) {
    logger.error('Subscription expiry job failed', err);
  }
}
