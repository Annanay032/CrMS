# CrMS — API Reference

All routes are prefixed with `/api`. Authentication is via JWT Bearer token unless noted.

---

## Auth (`/auth`)

Rate limited: 20 requests per 15 minutes.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | No | Create account (email, password, name, role) |
| POST | `/auth/login` | No | Login, returns access + refresh tokens |
| POST | `/auth/refresh` | No | Rotate tokens |
| POST | `/auth/logout` | Yes | Invalidate refresh token |
| GET | `/auth/me` | Yes | Get current user profile |
| GET | `/auth/google` | No | Initiate Google OAuth flow |
| GET | `/auth/google/callback` | No | Handle Google OAuth callback |

## Users (`/users`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| PUT | `/users/me` | Yes | Update name / avatar |
| POST | `/users/creator-profile` | Creator | Set up creator profile (bio, niche, etc.) |
| POST | `/users/brand-profile` | Brand | Set up brand profile |
| POST | `/users/agency-profile` | Agency | Set up agency profile |
| GET | `/users/` | Admin | List all users |

## Content (`/content`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/content/` | Creator | Create a post |
| PUT | `/content/:id` | Creator | Update a post |
| DELETE | `/content/:id` | Creator | Delete a post |
| GET | `/content/calendar` | Creator | Monthly calendar view |
| GET | `/content/status/:status` | Creator | Filter posts by status |
| GET | `/content/grid/:accountId` | Creator | Instagram grid preview (3-column) |
| PATCH | `/content/reorder` | Creator | Reorder scheduled posts |

## Campaigns (`/campaigns`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/campaigns/` | Brand | Create campaign + matching criteria |
| GET | `/campaigns/` | Yes | List campaigns |
| GET | `/campaigns/my` | Creator | Get campaigns matched to me |
| GET | `/campaigns/discover` | Yes | Discover creators for campaigns |
| GET | `/campaigns/:id` | Yes | Campaign details |
| PUT | `/campaigns/:id` | Brand | Update campaign details |
| PATCH | `/campaigns/:id/status` | Brand | Update campaign status |
| PATCH | `/campaigns/:id/stage` | Brand | Update campaign stage |
| POST | `/campaigns/matches/:matchId/respond` | Creator | Accept/decline match |
| GET | `/campaigns/:id/deliverables` | Yes | List deliverables |
| POST | `/campaigns/:id/deliverables` | Brand | Create a deliverable |
| PUT | `/campaigns/:id/deliverables/:did` | Yes | Update deliverable |
| DELETE | `/campaigns/:id/deliverables/:did` | Brand | Delete deliverable |
| GET | `/campaigns/:id/reports` | Yes | Get campaign reports |

## AI Agents (`/agents`)

Rate limited: 10 requests per minute.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/agents/run` | Yes | Run any agent by type |
| POST | `/agents/chat` | Yes | Natural language chat (NLP → pipeline routing) |
| POST | `/agents/content/generate` | Yes | Generate content ideas |
| POST | `/agents/schedule/optimize` | Yes | Get optimal posting times |
| POST | `/agents/analytics/insights` | Yes | Get analytics insights |
| POST | `/agents/engagement/suggestions` | Yes | Get reply suggestions |
| POST | `/agents/trends` | Yes | Detect trending content |
| POST | `/agents/growth/daily` | Yes | Get daily growth recommendation |
| POST | `/agents/growth/hooks` | Yes | Generate viral hooks |
| POST | `/agents/growth/predict` | Yes | Predict virality of content |
| POST | `/agents/growth/weekly-plan` | Yes | Generate weekly growth plan |
| GET | `/agents/` | Yes | List available agents |
| GET | `/agents/history` | Yes | Agent task history |

## Matching (`/matching`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/matching/find-creators` | Brand/Admin | Run matching algorithm for a campaign |
| GET | `/matching/campaigns/:id/matches` | Yes | Get match results |
| GET | `/matching/creators` | Yes | Discover creators (filtered search) |

## Community (`/community`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/community/` | Creator | Get inbox/social interactions |
| GET | `/community/stats` | Creator | Get community engagement stats |
| GET | `/community/:id` | Creator | Get specific interaction |
| POST | `/community/:id/responded` | Creator | Mark as responded |
| PATCH | `/community/:id/read` | Creator | Mark as read |
| POST | `/community/bulk-read` | Creator | Bulk mark as read |
| GET | `/community/score/current` | Creator | Get community comment score |
| POST | `/community/:id/to-post` | Creator | Create post from reply |
| PATCH | `/community/:id/case` | Creator | Update interaction case |
| PATCH | `/community/:id/assign` | Creator | Assign to team member |
| GET | `/community/saved-replies/list` | Creator | List saved reply templates |
| POST | `/community/saved-replies` | Creator | Create saved reply |
| PATCH | `/community/saved-replies/:id` | Creator | Update saved reply |
| DELETE | `/community/saved-replies/:id` | Creator | Delete saved reply |
| POST | `/community/saved-replies/:id/use` | Creator | Log usage of saved reply |
| GET | `/community/voice-profile/me` | Creator | Get AI voice/tone profile |
| PUT | `/community/voice-profile` | Creator | Update AI voice/tone profile |

## Dashboard (`/dashboard`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/dashboard/stats` | Yes | High-level dashboard stats with sparklines |
| GET | `/dashboard/analytics` | Yes | Detailed analytics data |
| GET | `/dashboard/content-types` | Yes | Content distribution stats |
| GET | `/dashboard/audience` | Yes | Audience demographic insights |
| GET | `/dashboard/reports` | Yes | List generated reports |
| POST | `/dashboard/reports` | Yes | Create report configuration |
| GET | `/dashboard/reports/:id` | Yes | Get report details |
| PUT | `/dashboard/reports/:id` | Yes | Update report (including branding) |
| DELETE | `/dashboard/reports/:id` | Yes | Delete report |
| POST | `/dashboard/reports/:id/generate` | Yes | Trigger report generation |
| GET | `/dashboard/organic-vs-boosted` | Yes | Organic vs boosted post analytics |

## Accounts (`/accounts`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/accounts/` | Yes | List connected social accounts |
| GET | `/accounts/connect/:platform` | Yes | Get OAuth URL for platform |
| GET | `/accounts/callback/:platform` | No | Handle OAuth callback |
| POST | `/accounts/connect/:platform/manual` | Yes | Connect via token/handle |
| DELETE | `/accounts/:provider` | Yes | Disconnect social account |
| POST | `/accounts/:provider/refresh` | Yes | Refresh platform token |

## Ideas (`/ideas`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/ideas/` | Creator | List content ideas |
| GET | `/ideas/:id` | Creator | Get idea details |
| POST | `/ideas/` | Creator | Create idea |
| PUT | `/ideas/:id` | Creator | Update idea |
| DELETE | `/ideas/:id` | Creator | Delete idea |
| GET | `/ideas/tags/all` | Creator | List idea tags |
| POST | `/ideas/tags` | Creator | Create tag |
| PUT | `/ideas/tags/:id` | Creator | Update tag |
| DELETE | `/ideas/tags/:id` | Creator | Delete tag |
| GET | `/ideas/templates/all` | Yes | List content templates |
| POST | `/ideas/templates` | Yes | Create template |
| POST | `/ideas/quick` | Yes | Quick capture from browser extension |

## Teams (`/teams`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/teams/` | Yes | Create a team |
| GET | `/teams/` | Yes | List user's teams |
| GET | `/teams/:id` | Yes | Team details |
| PUT | `/teams/:id` | Yes | Update team |
| DELETE | `/teams/:id` | Yes | Delete team |
| POST | `/teams/:id/members` | Yes | Add/invite member |
| PUT | `/teams/:id/members/:mid` | Yes | Update member role |
| DELETE | `/teams/:id/members/:mid` | Yes | Remove member |
| POST | `/teams/:id/workflows` | Yes | Create approval workflow |
| GET | `/teams/:id/workflows` | Yes | List workflows |
| PUT | `/teams/:id/workflows/:wid` | Yes | Update workflow |
| DELETE | `/teams/:id/workflows/:wid` | Yes | Delete workflow |
| GET | `/teams/:id/calendar` | Yes | Shared team calendar |
| POST | `/teams/posts/:pid/submit` | Yes | Submit post for approval |
| POST | `/teams/posts/:pid/approve` | Yes | Approve post |
| POST | `/teams/posts/:pid/request-changes` | Yes | Request changes |
| POST | `/teams/posts/:pid/reject` | Yes | Reject post |
| POST | `/teams/posts/:pid/comments` | Yes | Comment on post |
| GET | `/teams/posts/:pid/comments` | Yes | Get post comments |

## CRM (`/crm`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/crm/contacts` | Yes | List CRM contacts (filterable by type, platform, score, tags) |
| POST | `/crm/contacts` | Yes | Create contact |
| GET | `/crm/contacts/:id` | Yes | Contact details |
| PUT | `/crm/contacts/:id` | Yes | Update contact |
| DELETE | `/crm/contacts/:id` | Yes | Delete contact |
| GET | `/crm/contacts/:id/interactions` | Yes | Contact interaction history |
| PATCH | `/crm/contacts/:id/tags` | Yes | Update contact tags |
| GET | `/crm/pipeline` | Yes | Deal pipeline Kanban data |
| GET | `/crm/signals` | Yes | Signal Engine results |

## Contracts (`/contracts`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/contracts/` | Yes | List contracts |
| POST | `/contracts/` | Yes | Create contract |
| GET | `/contracts/:id` | Yes | Contract details |
| PUT | `/contracts/:id` | Yes | Update contract |
| DELETE | `/contracts/:id` | Yes | Delete contract |

## Social Listening (`/listening`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/listening/` | Yes | List listening queries |
| POST | `/listening/` | Yes | Create listening query |
| GET | `/listening/:id/mentions` | Yes | Get mentions for query |

## Competitive Intelligence (`/competitive`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/competitive/` | Yes | List monitored competitors |
| POST | `/competitive/` | Yes | Add competitor |
| GET | `/competitive/benchmark` | Yes | Get competitive benchmark |

## Revenue (`/revenue`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/revenue/summary` | Creator | Revenue summary (totals, pipeline, outstanding) |
| GET | `/revenue/post-roi` | Creator | Per-post revenue & ROI data |
| GET | `/revenue/streams` | Creator | List revenue streams |
| POST | `/revenue/streams` | Creator | Create revenue stream |
| PUT | `/revenue/streams/:id` | Creator | Update revenue stream |
| DELETE | `/revenue/streams/:id` | Creator | Delete revenue stream |
| GET | `/revenue/deals` | Creator | List brand deals |
| POST | `/revenue/deals` | Creator | Create brand deal |
| PUT | `/revenue/deals/:id` | Creator | Update brand deal |
| DELETE | `/revenue/deals/:id` | Creator | Delete brand deal |
| GET | `/revenue/invoices` | Creator | List invoices |
| POST | `/revenue/invoices` | Creator | Create invoice |
| PUT | `/revenue/invoices/:id` | Creator | Update invoice |
| DELETE | `/revenue/invoices/:id` | Creator | Delete invoice |

## AI Studio (`/studio`)

Rate limited: 10 requests per minute.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/studio/compose` | Yes | AI-assisted post composition from a topic/idea |
| POST | `/studio/rewrite` | Yes | Rewrite/optimize existing caption |
| POST | `/studio/image/generate` | Yes | Generate image via DALL-E |
| POST | `/studio/media/suggest` | Yes | Get AI media suggestions for post |
| GET | `/studio/integrations` | Yes | List available Studio integrations |
| POST | `/studio/intelligence` | Yes | Content intelligence (score, best times, hashtags, tips) |
| POST | `/studio/video/analyze` | Yes | Analyze video performance + retention |
| POST | `/studio/video/clip` | Yes | Create short clip from longer video |

## Channels (`/channels`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/channels/:provider/overview` | Yes | Per-channel overview (metrics, recent posts) |
| GET | `/channels/:provider/analytics` | Yes | Platform-specific analytics |
| GET | `/channels/:provider/ai-insights` | Yes | AI-generated channel recommendations |

## Start Pages (`/startpages`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/startpages/p/:slug` | No | Public Link-in-bio page |
| GET | `/startpages/` | Yes | List user's pages |

## Notifications, Usage, Settings, Media

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| PATCH | `/notifications/read-all` | Yes | Mark all notifications as read |
| GET | `/notifications/push/vapid-key` | Yes | Get VAPID public key |
| POST | `/notifications/push/subscribe` | Yes | Register push subscription |
| GET | `/usage/` | Yes | AI token budget, usage stats, cost breakdown |
| PATCH | `/usage/tier` | Yes | Update subscription tier |
| PATCH | `/settings/` | Yes | Update user preferences |
| POST | `/media/assets` | Yes | Upload media asset (rate limited: 30/min) |

## RSS Feeds (`/rss`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/rss/` | Creator | List subscribed RSS feeds |
| POST | `/rss/` | Creator | Subscribe to an RSS feed |
| DELETE | `/rss/:id` | Creator | Unsubscribe from a feed |
| PATCH | `/rss/:id/toggle` | Creator | Enable/disable auto-import |

## Public API (`/public`)

Uses API key authentication (SHA-256 hashed, scoped).

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/public/keys` | JWT | Create an API key (with scopes) |
| GET | `/public/keys` | JWT | List user's API keys |
| DELETE | `/public/keys/:id` | JWT | Revoke an API key |
| GET | `/public/posts` | API Key | List posts (external access) |
| POST | `/public/posts` | API Key | Create post (external access) |
| GET | `/public/posts/:id` | API Key | Get post details |
| GET | `/public/analytics` | API Key | Get analytics data |

## Subscriptions (`/subscriptions`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/subscriptions/pricing` | No | Get plan pricing for all tiers |
| GET | `/subscriptions/config` | No | Get public checkout config |
| GET | `/subscriptions/` | Yes | Get current subscription + billing |
| POST | `/subscriptions/checkout` | Yes | Create Stripe/Razorpay checkout session |
| PATCH | `/subscriptions/change` | Yes | Change plan tier or billing cycle |
| POST | `/subscriptions/cancel` | Yes | Cancel subscription at period end |
| POST | `/subscriptions/reactivate` | Yes | Reactivate canceled subscription |
| GET | `/subscriptions/payments` | Yes | Get payment history |
| POST | `/subscriptions/portal` | Yes | Create Stripe billing portal session |
| POST | `/subscriptions/verify-razorpay` | Yes | Verify Razorpay payment signature |

## Cloud Imports (`/cloud-import`)

Rate limited: 30 requests per minute.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/cloud-import/google-drive` | Yes (PRO) | Import media from Google Drive |
| POST | `/cloud-import/dropbox` | Yes (PRO) | Import media from Dropbox |
| POST | `/cloud-import/canva` | Yes (PRO) | Import designs from Canva |

## Webhooks (`/webhooks`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/webhooks/stripe` | No | Stripe webhook (signature verified) |
| POST | `/webhooks/razorpay` | No | Razorpay webhook (HMAC verified) |
| GET | `/webhooks/whatsapp` | No | WhatsApp webhook verification |
| POST | `/webhooks/whatsapp` | No | WhatsApp incoming message ingestion |

## Admin

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/queues` | — | Bull Board dashboard (job queue monitoring) |
