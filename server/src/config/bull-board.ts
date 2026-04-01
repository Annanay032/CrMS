import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import {
  publishQueue,
  analyticsQueue,
  trendsQueue,
  listeningQueue,
  competitiveQueue,
  reportQueue,
  growthQueue,
  inboxEmailQueue,
  tokenRefreshQueue,
  recurringPostQueue,
  rssImportQueue,
  subscriptionQueue,
  firstCommentQueue,
  signalQueue,
} from '../jobs/index.js';

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [
    new BullMQAdapter(publishQueue),
    new BullMQAdapter(analyticsQueue),
    new BullMQAdapter(trendsQueue),
    new BullMQAdapter(listeningQueue),
    new BullMQAdapter(competitiveQueue),
    new BullMQAdapter(reportQueue),
    new BullMQAdapter(growthQueue),
    new BullMQAdapter(inboxEmailQueue),
    new BullMQAdapter(tokenRefreshQueue),
    new BullMQAdapter(recurringPostQueue),
    new BullMQAdapter(rssImportQueue),
    new BullMQAdapter(subscriptionQueue),
    new BullMQAdapter(firstCommentQueue),
    new BullMQAdapter(signalQueue),
  ],
  serverAdapter,
});

export { serverAdapter as bullBoardAdapter };
