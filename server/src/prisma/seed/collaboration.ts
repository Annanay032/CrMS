import { TeamRole } from '@prisma/client';
import { ContentPost } from '@prisma/client';
import { SeedContext } from './context.js';

export async function seedCollaboration(ctx: SeedContext, posts: ContentPost[]) {
  const { prisma, users } = ctx;
  const { creator1, creator2, testUser } = users;

  // ── Teams & Collaboration ─────────────────────────────────
  await prisma.team.create({
    data: {
      name: 'Jane\'s Content Team', ownerId: creator1.id,
      members: {
        create: [
          { userId: creator1.id, role: TeamRole.OWNER },
          { userId: creator2.id, role: TeamRole.EDITOR },
          { userId: testUser.id, role: TeamRole.CONTRIBUTOR },
        ],
      },
      workflows: {
        create: {
          name: 'Standard Review',
          stages: [
            { name: 'Editor Review', approverRoles: ['EDITOR'] },
            { name: 'Owner Sign-off', approverRoles: ['OWNER', 'ADMIN'] },
          ],
          isDefault: true, isActive: true,
        },
      },
    },
  });

  // Post comments on Jane's published/review posts
  await prisma.postComment.createMany({
    data: [
      { postId: posts[0].id, userId: creator2.id, body: 'Great reel! The transitions are smooth. Ready to publish.', isApproval: true, approvalAction: 'approve' },
      { postId: posts[0].id, userId: creator1.id, body: 'Thanks Alex! Scheduling it for Monday morning.' },
      { postId: posts[6].id, userId: creator2.id, body: 'Protein powder section needs more detail on ingredients. Can you add comparison table?', isApproval: true, approvalAction: 'request_changes' },
    ],
  });
  console.log('Teams & collaboration seeded ✓');
}
