# CrMS — Architecture & Project Structure

## Project Structure

```
CrMS/
├── package.json              # Root monorepo config (npm workspaces)
├── tsconfig.base.json        # Shared TypeScript config
├── docker-compose.yml        # Dev stack (Postgres + Redis + API + UI)
├── .env.example              # Environment variable template
├── .github/
│   └── workflows/
│       └── ci.yml            # GitHub Actions CI/CD pipeline
│
├── server/                   # ── Backend (Express + TypeScript) ──
│   ├── Dockerfile            # Dev image
│   ├── Dockerfile.prod       # Multi-stage production image (non-root user)
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts                # App entry (Express + Socket.IO + workers + Bull Board)
│       │
│       ├── config/                 # Configuration layer
│       │   ├── env.ts              #   Zod-validated env variables
│       │   ├── database.ts         #   Prisma client singleton
│       │   ├── redis.ts            #   ioredis client
│       │   ├── openai.ts           #   OpenAI SDK client
│       │   ├── passport.ts         #   Passport.js strategies (JWT + Google OAuth)
│       │   ├── logger.ts           #   Winston logger
│       │   ├── websocket.ts        #   Socket.IO setup
│       │   ├── bull-board.ts       #   Bull Board admin dashboard (all 15 queues)
│       │   └── index.ts            #   Re-exports
│       │
│       ├── types/                  # TypeScript types & enums
│       │   ├── enums.ts            #   Role, Platform, PostStatus, AgentType, etc.
│       │   ├── common.ts           #   JwtPayload, AuthRequest, ApiResponse
│       │   ├── express.d.ts        #   Express type augmentation
│       │   └── index.ts
│       │
│       ├── middleware/             # Express middleware
│       │   ├── auth.ts             #   JWT authentication + RBAC + team roles
│       │   ├── api-key.ts          #   SHA-256 hashed API key auth
│       │   ├── plan-gate.ts        #   Subscription tier gating
│       │   ├── rate-limit.ts       #   Per-route rate limiters (auth, AI, upload)
│       │   ├── validate.ts         #   Zod schema validation
│       │   ├── error.ts            #   Global error handler + 404
│       │   └── index.ts
│       │
│       ├── routes/                 # API route definitions (30 modules)
│       │   ├── auth.routes.ts      #   Register, login, refresh, logout, Google OAuth
│       │   ├── user.routes.ts      #   Profile management (creator/brand/agency)
│       │   ├── content.routes.ts   #   CRUD posts + calendar + filter by status
│       │   ├── campaign.routes.ts  #   Campaigns, matches, deliverables, reports
│       │   ├── agent.routes.ts     #   AI agent endpoints (run, chat, generate, insights)
│       │   ├── matching.routes.ts  #   Find creators, match results, discover directory
│       │   ├── community.routes.ts #   Interactions, saved replies, voice profiles, threads
│       │   ├── dashboard.routes.ts #   Stats, analytics, audience, reports
│       │   ├── account.routes.ts   #   Connected social accounts (OAuth connect/disconnect)
│       │   ├── idea.routes.ts      #   Content ideas, tags, templates
│       │   ├── listening.routes.ts #   Social listening queries + mentions + signals
│       │   ├── competitive.routes.ts # Competitor monitoring + benchmarks
│       │   ├── team.routes.ts      #   Teams, members, workflows, approvals, comments
│       │   ├── startpage.routes.ts #   Link-in-bio pages (public + management)
│       │   ├── notification.routes.ts # In-app notifications
│       │   ├── usage.routes.ts     #   AI token budget & usage stats + cost tracking
│       │   ├── settings.routes.ts  #   User preferences & polling settings
│       │   ├── media.routes.ts     #   Media library (folders + asset uploads)
│       │   ├── revenue.routes.ts   #   Revenue streams, brand deals, invoices, post ROI
│       │   ├── contract.routes.ts  #   Contracts lifecycle + deliverable tracking
│       │   ├── crm.routes.ts       #   CRM contacts, pipeline, signals
│       │   ├── channel.routes.ts   #   Per-channel analytics + AI insights
│       │   ├── webhook.routes.ts   #   Stripe + Razorpay + WhatsApp webhook ingestion
│       │   ├── studio.routes.ts    #   AI Studio (compose, rewrite, image gen, video)
│       │   ├── rss.routes.ts       #   RSS feed management
│       │   ├── public-api.routes.ts #  Public API (API key auth)
│       │   ├── subscription.routes.ts # Subscription management, checkout, billing
│       │   ├── admin.routes.ts     #   Admin endpoints
│       │   ├── cloud-import.routes.ts # Cloud media imports (Google Drive, Dropbox, Canva)
│       │   └── index.ts            #   Mounts all route groups under /api
│       │
│       ├── controllers/            # Request handlers (26 modules)
│       │   ├── auth.controller.ts
│       │   ├── user.controller.ts
│       │   ├── content.controller.ts
│       │   ├── campaign.controller.ts
│       │   ├── agent.controller.ts
│       │   ├── matching.controller.ts
│       │   ├── community.controller.ts
│       │   ├── dashboard.controller.ts
│       │   ├── account.controller.ts
│       │   ├── idea.controller.ts
│       │   ├── listening.controller.ts
│       │   ├── competitive.controller.ts
│       │   ├── team.controller.ts
│       │   ├── startpage.controller.ts
│       │   ├── notification.controller.ts
│       │   ├── usage.controller.ts
│       │   ├── settings.controller.ts
│       │   ├── media.controller.ts
│       │   ├── revenue.controller.ts
│       │   ├── contract.controller.ts
│       │   ├── crm.controller.ts
│       │   ├── channel.controller.ts
│       │   ├── studio.controller.ts
│       │   ├── subscription.controller.ts
│       │   ├── rss.controller.ts
│       │   └── cloud-import.controller.ts
│       │
│       ├── services/               # Business logic (37 modules)
│       │   ├── auth.service.ts     #   Register, login, JWT + refresh token rotation
│       │   ├── user.service.ts     #   Profile management (creator/brand/agency)
│       │   ├── content.service.ts  #   Post CRUD, calendar, scheduling
│       │   ├── campaign.service.ts #   Campaign lifecycle + creator matching
│       │   ├── community.service.ts#   Interactions, saved replies, voice profiles
│       │   ├── dashboard.service.ts#   Dashboard stats, analytics, sparklines
│       │   ├── account.service.ts  #   Social account connections
│       │   ├── platform.service.ts #   Platform API abstraction (11 platforms)
│       │   ├── revenue.service.ts  #   Revenue streams, brand deals, invoices, post ROI
│       │   ├── contract.service.ts #   Contract lifecycle management
│       │   ├── crm.service.ts      #   CRM contacts, deal pipeline, relationship scoring
│       │   ├── channel.service.ts  #   Per-channel analytics + AI insights
│       │   ├── trends-data.service.ts # Real trend data (Google, YouTube, TikTok, Instagram)
│       │   ├── email-inbox.service.ts # IMAP email polling → CommunityInteraction
│       │   ├── whatsapp-inbox.service.ts # WhatsApp Cloud API → CommunityInteraction
│       │   ├── idea.service.ts     #   Content ideas, tags, template management
│       │   ├── listening.service.ts #  Social listening queries + mention tracking
│       │   ├── competitive.service.ts # Competitor monitoring + benchmarks
│       │   ├── team.service.ts     #   Teams, members, approval workflows
│       │   ├── invite.service.ts   #   Team invitation management
│       │   ├── startpage.service.ts#   Link-in-bio page CRUD + analytics
│       │   ├── notification.service.ts # In-app notification delivery
│       │   ├── usage.service.ts    #   AI token budget + cost tracking per model
│       │   ├── settings.service.ts #   User preferences + polling settings
│       │   ├── media.service.ts    #   Media library CRUD (folders + assets)
│       │   ├── media-processing.service.ts # Image/video processing pipeline
│       │   ├── storage.service.ts  #   Local/S3 file storage abstraction
│       │   ├── report.service.ts   #   Analytics report generation
│       │   ├── rss.service.ts      #   RSS feed management + import
│       │   ├── hashtag-analytics.service.ts # Hashtag performance tracking
│       │   ├── integration-hub.service.ts # Third-party integration management
│       │   ├── subscription.service.ts # Subscription lifecycle, trials, tier changes
│       │   ├── stripe.service.ts   #   Stripe Checkout + webhook handling
│       │   ├── razorpay.service.ts #   Razorpay subscriptions + webhook handling
│       │   ├── web-push.service.ts #   VAPID web push notifications
│       │   ├── cloud-import.service.ts # Google Drive, Dropbox, Canva imports
│       │   └── platforms/
│       │       └── gbp.service.ts  #   Google Business Profile publish + insights
│       │
│       ├── agents/                 # AI Agent system (14 agents + orchestrator)
│       │   ├── base.ts             #   BaseAgent abstract class (execute → run)
│       │   ├── content.agent.ts    #   Content generation (captions, hashtags, ideas)
│       │   ├── scheduling.agent.ts #   Optimal posting time recommendations
│       │   ├── analytics.agent.ts  #   Performance insights + trend analysis
│       │   ├── engagement.agent.ts #   Community reply suggestions
│       │   ├── trends.agent.ts     #   Trending content detection
│       │   ├── matching.agent.ts   #   Brand-creator matching with AI re-ranking
│       │   ├── growth.agent.ts     #   Daily recommendations, hooks, virality
│       │   ├── publishing.agent.ts #   Multi-platform publishing + formatting
│       │   ├── listening.agent.ts  #   Social listening, sentiment, signal detection
│       │   ├── competitive.agent.ts#   Competitor analysis, battle cards, gap reports
│       │   ├── campaign.agent.ts   #   Campaign strategy, briefs, ROI analysis
│       │   ├── collaboration.agent.ts # Team workflows, approvals, partnership vetting
│       │   ├── linkinbio.agent.ts  #   Start Page layout optimization
│       │   ├── studio.agent.ts     #   AI Studio (compose, rewrite, image gen, video)
│       │   └── orchestrator.ts     #   Agent registry, pipelines, NLP routing
│       │
│       ├── matching/               # Multi-factor matching algorithm
│       │   ├── scoring.ts          #   Weighted scoring (niche, engagement, etc.)
│       │   └── matching.service.ts #   Campaign matching + creator discovery
│       │
│       ├── jobs/                   # Background job processing (BullMQ)
│       │   ├── index.ts            #   15 queues, workers, schedules, default job opts
│       │   ├── publish.job.ts      #   Auto-publish scheduled posts
│       │   ├── first-comment.job.ts#   Post first comment after publish
│       │   ├── analytics.job.ts    #   Fetch post analytics + creator snapshots
│       │   ├── trends.job.ts       #   Periodic trend scanning
│       │   ├── growth.job.ts       #   Daily AI growth recommendations
│       │   ├── inbox.job.ts        #   IMAP email inbox polling
│       │   ├── listening.job.ts    #   Social listening mention polling
│       │   ├── competitive.job.ts  #   Competitor metrics collection
│       │   ├── report.job.ts       #   Scheduled analytics report generation
│       │   ├── recurring-post.job.ts #  Clone + schedule recurring posts
│       │   ├── rss-import.job.ts   #   RSS feed sync → content ideas
│       │   ├── signal.job.ts       #   Signal Engine pipeline (intent → scoring → CRM)
│       │   ├── subscription.job.ts #   Subscription expiry checks
│       │   └── token-refresh.job.ts#   OAuth token refresh
│       │
│       ├── prisma/
│       │   ├── schema/             # Multi-file Prisma schema (19 files)
│       │   │   ├── base.prisma, user.prisma, creator.prisma, brand-agency.prisma
│       │   │   ├── content.prisma, campaign.prisma, community.prisma
│       │   │   ├── analytics.prisma, competitive.prisma, listening.prisma
│       │   │   ├── team.prisma, startpage.prisma, media.prisma
│       │   │   ├── revenue.prisma, usage.prisma, workflow.prisma
│       │   │   ├── notification.prisma, agent.prisma, subscription.prisma
│       │   │   └── migrations/
│       │   ├── seed.ts             #   Sample data seeder (orchestrator)
│       │   └── seed/               #   Modular seed files
│       │
│       └── utils/
│           ├── crypto.ts           #   AES-256-GCM encrypt/decrypt for OAuth tokens
│           ├── helpers.ts          #   paginate, slugify, sanitizeString
│           └── index.ts
│
└── ui/                        # ── Frontend (React + Vite) ──
    ├── Dockerfile             # Dev image
    ├── Dockerfile.prod        # Multi-stage production image (nginx)
    ├── nginx.conf             # Production nginx config (SPA, API proxy, gzip)
    ├── package.json
    ├── vite.config.ts
    ├── index.html
    └── src/
        ├── main.tsx                # App entry (Redux Provider + BrowserRouter)
        ├── App.tsx                 # Route definitions (30+ pages)
        │
        ├── store/                  # Redux Toolkit state management
        │   ├── index.ts            #   Store configuration
        │   ├── api.ts              #   RTK Query base API
        │   ├── auth.slice.ts       #   Auth state slice
        │   ├── ai.slice.ts         #   AI activity state slice
        │   └── endpoints/          #   RTK Query endpoint modules (22+)
        │       ├── auth.ts, content.ts, dashboard.ts, campaigns.ts
        │       ├── matching.ts, community.ts, agents.ts, accounts.ts
        │       ├── ideas.ts, listening.ts, competitive.ts, teams.ts
        │       ├── startpages.ts, notifications.ts, usage.ts, settings.ts
        │       ├── media.ts, revenue.ts, growth.ts, studio.ts
        │       ├── subscription.ts, crm.ts, contracts.ts, channels.ts
        │       └── ...
        │
        ├── hooks/
        │   ├── store.ts            #   Typed useAppSelector / useAppDispatch
        │   └── usePlanGate.ts      #   Feature gating hook (tier check)
        │
        ├── components/
        │   ├── ai/                 # AI-related components
        │   │   ├── AiActivityIndicator.tsx
        │   │   └── FloatingAiAssistant.tsx  # Chat-to-create with action buttons
        │   ├── common/             # Shared UI components
        │   │   ├── PageHeader.tsx, StatCard.tsx, AiInsightCard.tsx
        │   │   └── GlobalSearch.tsx
        │   ├── content/            # Content editing components
        │   │   ├── MediaCropper.tsx, RichTextEditor.tsx, ThreadComposer.tsx
        │   │   ├── ThumbnailPicker.tsx, CalendarNoteModal.tsx
        │   │   ├── IdeasSidePanel.tsx, TemplateDrawer.tsx
        │   │   └── ...
        │   └── layout/             # Application layout
        │       ├── AppLayout.tsx    #   Auth-protected layout wrapper
        │       ├── Sidebar.tsx      #   Collapsible grouped nav + tier badges
        │       ├── Sidebar.module.scss
        │       ├── TopBar.tsx       #   Search (⌘K), quick-create, notifications
        │       ├── TopBar.module.scss
        │       └── NotificationCenter.tsx
        │
        ├── constants/
        │   ├── navigation.ts       #   Grouped nav items per role + team filtering
        │   └── features.ts         #   Tier config, feature gates & plan comparison
        │
        ├── pages/
        │   ├── auth/               # Login, Register, OAuth callback
        │   ├── pricing/            # Tier comparison + checkout
        │   ├── dashboard/          # Role-based dashboards with sparklines
        │   ├── content/            # Content library (grid/list), calendar (drag-drop)
        │   ├── create/             # Ideas workspace (quick-to-post)
        │   ├── analytics/          # Global + per-post analytics
        │   ├── campaigns/          # Campaign management
        │   ├── discover/           # Creator discovery
        │   ├── community/          # Unified inbox (all platforms)
        │   ├── trends/             # Trend discovery with niche filters
        │   ├── listening/          # Social listening + Signal Engine
        │   ├── competitive/        # Competitor benchmarks + gap analysis
        │   ├── crm/                # CRM contacts, pipeline Kanban, signals
        │   ├── channel/            # Per-channel overview + AI insights
        │   ├── bio/                # Link-in-bio page editor
        │   ├── revenue/            # Revenue dashboard (charts, streams, deals)
        │   ├── growth/             # Growth Copilot
        │   ├── ai/                 # Full-page AI assistant
        │   ├── media/              # Media library (bulk select, storage meter)
        │   ├── usage/              # AI usage + cost tracking
        │   ├── studio/             # AI Content Studio (compose, media lab, templates, video)
        │   ├── settings/           # Settings (sidebar nav, 8 tabs)
        │   ├── teams/              # Team management + approval workflows
        │   └── admin/              # Admin panel
        │
        ├── types/                  # Global TypeScript types
        ├── utils/                  # Global utility functions
        └── styles/
            ├── main.scss           # Global styles
            └── abstracts/          # Design tokens (_variables.scss, _mixins.scss)
```

---

## Database Schema (Key Models)

### Auth & Profiles

| Model | Purpose |
|-------|---------|
| `User` | Core user (email, password, role, tier) |
| `OAuthAccount` | Connected platform accounts (encrypted tokens) |
| `CreatorProfile` | Bio, niche, location, languages |
| `CreatorPlatformStats` | Per-platform followers, engagement, avg metrics |
| `BrandProfile` | Company info, industry, budget range, target audience |
| `AgencyProfile` | Agency info + managed creators |
| `AgencyCreator` | Agency → Creator management relationship |

### Content & Scheduling

| Model | Purpose |
|-------|---------|
| `ContentIdea` | Content sparks and drafts before becoming posts |
| `ContentTag` | Categorization labels for ideas |
| `ContentTemplate` | Reusable caption/post structures per platform |
| `ContentPost` | Posts with status workflow (Idea → Draft → Review → Scheduled → Published) |
| `PostingSchedule` | Preferred posting days/times per platform |
| `PostAnalytics` | Impressions, reach, likes, comments, shares per post |

### Analytics & Reporting

| Model | Purpose |
|-------|---------|
| `CreatorAnalyticsSnapshot` | Daily follower/engagement snapshots for growth tracking |
| `AnalyticsReport` | Generated PDF/CSV report metadata |
| `AudienceInsight` | Demographic breakdowns (age, location, interests) |

### Campaigns

| Model | Purpose |
|-------|---------|
| `Campaign` | Brand campaigns with target niche, platforms, budget |
| `MatchCriteria` | Configurable scoring weights per campaign |
| `CampaignMatch` | Creator-campaign match records with scores and AI reasoning |
| `CampaignDeliverable` | Tasks assigned within a campaign |
| `CampaignReport` | Aggregated ROI and performance summary |

### CRM & Revenue

| Model | Purpose |
|-------|---------|
| `Contact` | CRM contacts (brands, fans, creators) with relationship scoring |
| `RevenueStream` | Recurring/one-time income sources |
| `BrandDeal` | Brand deal CRM (PROSPECT → NEGOTIATING → ACTIVE → COMPLETED) |
| `Contract` | Contract terms, dates, deliverables, payment schedule |
| `Invoice` | Invoices tied to brand deals (DRAFT → SENT → PAID/OVERDUE) |

### Community & Engagement

| Model | Purpose |
|-------|---------|
| `CommunityInteraction` | Comments/DMs with sentiment and AI-suggested replies |
| `SavedReply` | Template responses for frequent queries |
| `CommentScore` | Creator responsiveness and engagement metrics |
| `UserVoiceProfile` | AI tone/vocabulary settings for automated replies |
| `InboxChannel` | Connected inbox channels (Instagram DM, WhatsApp, Email) |

### Social Listening & Competitive

| Model | Purpose |
|-------|---------|
| `ListeningQuery` | Keywords/platforms tracked for monitoring |
| `Mention` | Keyword mentions with intent, urgency, influence scoring |
| `Signal` | High-value leads, risks, trends, viral opportunities |
| `SentimentSnapshot` | Aggregated mood tracking over time |
| `Competitor` | External accounts monitored for benchmarking |
| `CompetitorSnapshot` | Competitor performance metrics and activity |

### Collaboration

| Model | Purpose |
|-------|---------|
| `Team` | Groups of users collaborating on content |
| `TeamMember` | Membership and role definitions (Owner, Admin, Editor, Contributor, Viewer) |
| `ApprovalWorkflow` | Multi-stage content review processes |
| `PostComment` | Internal collaboration comments on posts |

### Features

| Model | Purpose |
|-------|---------|
| `StartPage` | Customizable Link-in-Bio landing pages |
| `StartPageLink` | Individual links/blocks on a start page |
| `StartPageAnalytics` | Traffic and click tracking |
| `Notification` | In-app alerts |
| `MediaFolder` | Organizational folders for uploaded assets |
| `MediaAsset` | Image/video metadata and URLs |

### AI & Workflows

| Model | Purpose |
|-------|---------|
| `WorkflowTemplate` | Blueprints for multi-agent autonomous tasks |
| `WorkflowRun` | Execution history |
| `AgentTask` | AI agent execution logs (input, output, tokens, status) |
| `UsageBudget` | Token limits and consumption by user tier |
| `AgentUsageLog` | Detailed AI model usage ledger (auto-cleaned after 90 days) |

### Subscription & Billing

| Model | Purpose |
|-------|---------|
| `Subscription` | Per-user subscription (tier, cycle, status, trial, provider IDs) |
| `PaymentTransaction` | Payment records (amount, currency, provider, invoice URL) |

### System

| Model | Purpose |
|-------|---------|
| `PlatformRateLimit` | API quota tracking for social platforms |
| `UserSettings` | Notification and polling preferences |

---

## User Roles

| Role | Capabilities |
|------|-------------|
| **Creator** | Manage content & ideas, calendar, analytics, community inbox, AI agents, campaign matches, Link-in-Bio, media library, revenue & brand deals, CRM contacts & pipeline, Growth Copilot, Studio |
| **Brand** | Create campaigns, define matching criteria, discover creators, manage contracts & deliverables, view match results |
| **Agency** | Manage multiple creators, aggregated analytics |
| **Admin** | Full access — manage users, view all data, system configuration |

### Team Roles

| Role | Access Groups |
|------|--------------|
| **Owner / Admin** | All sections |
| **Editor** | Home, Content, Intelligence, Communication, Channels, AI & Growth |
| **Contributor** | Home, Content, Communication |
| **Viewer** | Home, Intelligence |

---

## AI Agent System

14 specialized agents + Studio agent, powered by OpenAI GPT-4 and coordinated by an orchestrator:

| Agent | Type Key | What It Does |
|-------|----------|-------------|
| Content Generation | `CONTENT_GENERATION` | Generates captions, hashtags, and content ideas per platform |
| Publishing | `PUBLISHING` | Multi-platform post formatting + adaptation |
| Scheduling | `SCHEDULING` | Optimal posting time recommendations from past performance |
| Matching | `MATCHING` | Creator-brand matching with multi-factor scoring + AI re-ranking |
| Analytics | `ANALYTICS` | Engagement insights and recommendations |
| Engagement | `ENGAGEMENT` | Reply suggestions with tone matching via voice profiles |
| Trend Detection | `TREND_DETECTION` | Trending topics by niche and platform |
| Social Listening | `LISTENING` | Brand mentions, sentiment, intent detection, signal scoring |
| Competitive Intel | `COMPETITIVE` | Competitor tracking, battle cards, gap analysis |
| Collaboration | `COLLABORATION` | Team workflows, approvals, partnership vetting |
| Campaign | `CAMPAIGN` | Campaign briefs, deliverable tracking, ROI analysis |
| Link-in-Bio | `LINK_IN_BIO` | Start Page layout optimization, A/B suggestions |
| Growth | `GROWTH` | Daily recommendations, viral hooks, virality prediction |
| **Studio** | *(via `/studio` routes)* | AI compose, caption rewrite, DALL-E image gen, content intelligence, video analysis |

### Orchestrator Features

- **Agent Registry**: All agents registered and dispatched by type
- **Multi-Step Pipelines**: Chain agents (e.g., Analytics → Content, Trends → Growth)
- **NLP Routing**: Natural language messages routed to appropriate agent/pipeline via `routeMessage`
- **Budget Gating**: Token usage checked against tier budgets before execution
- **Cost Tracking**: Per-model pricing (GPT-4, GPT-4o, GPT-4o-mini) with estimated cost calculation
- **Event-Driven**: WebSocket notifications on task completion

---

## Sidebar Navigation

Collapsible category groups, role-specific:

| Role | Groups |
|------|--------|
| **Creator** | Home, Content, Monetization, Intelligence, AI & Growth, Communication, Account |
| **Brand** | Home, Campaigns, Intelligence, Tools, Account |
| **Agency** | Home, Management, Intelligence, Account |
| **Admin** | Home, Administration, Intelligence, Account |

Single-item groups render inline without a header. Collapsed state persists in `localStorage`. Items requiring a higher tier show colored PRO/ENT badges. Team role-based filtering restricts groups per team role.
