# CrMS — Creator Management System

AI-powered platform for managing creators, brands, campaigns, and community engagement across Instagram, YouTube, TikTok, Twitter/X, LinkedIn, Threads, Bluesky, Facebook, Pinterest, and Reddit. Inspired by [Buffer](https://buffer.com).

---

## Tech Stack

| Layer        | Technology |
|-------------|------------|
| Frontend    | React 19, TypeScript, Vite 8, Tailwind CSS 4, Redux Toolkit (RTK Query), Ant Design 6, React Router 7, Recharts, SCSS Modules |
| Backend     | Node.js, TypeScript, Express 5, Prisma 6 ORM, Zod validation |
| Database    | PostgreSQL 16, Redis 7 |
| AI          | OpenAI GPT-4 (13 specialized agents with orchestrator, pipelines & NLP routing) |
| Job Queue   | BullMQ (publishing, analytics, trends, social listening, competitive intel, reports, growth, inbox, token refresh) |
| Real-Time   | Socket.IO (WebSocket notifications & live agent activity) |
| Auth        | JWT (access + refresh tokens via Redis), bcrypt, Passport.js, Google OAuth |
| Infra       | Docker Compose, npm workspaces monorepo |

---

## Prerequisites

- **Node.js** >= 20
- **npm** >= 10
- **Docker** & **Docker Compose** (for PostgreSQL + Redis, or run them natively)
- **OpenAI API Key** (optional — AI features degrade gracefully without it)

---

## Quick Start (Docker)

The fastest way to get everything running:

```bash
# 1. Clone & enter the repo
git clone <repo-url> && cd CrMS

# 2. Copy the environment file
cp .env.example .env

# 3. (Optional) Add your OpenAI key in .env
#    OPENAI_API_KEY=sk-...

# 4. Start all services
docker compose up --build
```

| Service    | URL |
|-----------|-----|
| Frontend  | http://localhost:5173 |
| API       | http://localhost:3001/api |
| Prisma Studio | (run manually, see below) |

---

## Quick Start (Local Development)

### 1. Install dependencies

```bash
npm install
```

This installs dependencies for both the `ui/` and `server/` workspaces.

### 2. Start PostgreSQL & Redis

Using Docker (databases only):

```bash
docker compose up postgres redis -d
```

Or point `DATABASE_URL` and `REDIS_URL` in `.env` to your existing instances.

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env with your values (see Environment Variables section below)
```

### 4. Set up the database

```bash
# Generate Prisma client
npm run db:generate --workspace=server

# Run migrations
npm run db:migrate

# Seed sample data (admin, creator, brand, campaign)
npm run db:seed
```

### 5. Start development servers

```bash
# Both server + client in one terminal
npm run dev

# Or separately:
npm run dev:server   # API on :3001
npm run dev:client   # UI on :5173
```

---

## Default Seed Accounts

| Role    | Email               | Password        |
|---------|---------------------|-----------------|
| Admin   | admin@crms.local    | admin123456     |
| Creator | creator@crms.local  | creator123456   |
| Brand   | brand@crms.local    | brand123456     |

---

## Environment Variables

See [.env.example](.env.example) for the full list. Key variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://crms:crms_secret@localhost:5432/crms_db` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `JWT_SECRET` | Secret for signing JWT tokens (min 32 chars) | *(must change in prod)* |
| `JWT_EXPIRES_IN` | Access token lifetime | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifetime | `7d` |
| `ENCRYPTION_KEY` | 64-hex-char key for AES-256-GCM encryption of OAuth tokens at rest | *(must change in prod)* |
| `OPENAI_API_KEY` | OpenAI API key for AI agents | *(optional)* |
| `OPENAI_MODEL` | Model to use | `gpt-4` |
| `CLIENT_URL` | Frontend URL (CORS allowlist) | `http://localhost:5173` |
| `UPLOAD_DIR` | Directory for file uploads | `./uploads` |
| `MAX_FILE_SIZE` | Maximum upload file size | `52428800` (50 MB) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | *(optional)* |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | *(optional)* |
| `INSTAGRAM_APP_ID` | Instagram app ID | *(optional)* |
| `YOUTUBE_CLIENT_ID` | YouTube client ID | *(optional)* |
| `TIKTOK_CLIENT_KEY` | TikTok client key | *(optional)* |

---

## Available Scripts

Run from the project root:

| Script | Description |
|--------|-------------|
| `npm run dev` | Start both server and client in dev mode |
| `npm run dev:server` | Start only the API server (hot reload via tsx) |
| `npm run dev:client` | Start only the Vite dev server |
| `npm run build` | Build both workspaces for production |
| `npm run db:migrate` | Run Prisma database migrations |
| `npm run db:seed` | Seed sample data |
| `npm run db:studio` | Open Prisma Studio (database GUI) |
| `npm run db:generate` | Regenerate Prisma client |

---

## Project Structure

```
CrMS/
├── package.json              # Root monorepo config (npm workspaces)
├── tsconfig.base.json        # Shared TypeScript config
├── docker-compose.yml        # Full-stack Docker setup
├── .env.example              # Environment variable template
│
├── server/                   # ── Backend (Express + TypeScript) ──
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts                # App entry (Express + Socket.IO + workers)
│       │
│       ├── config/                 # Configuration layer
│       │   ├── env.ts              #   Zod-validated env variables
│       │   ├── database.ts         #   Prisma client singleton
│       │   ├── redis.ts            #   ioredis client
│       │   ├── passport.ts         #   Passport.js strategies (JWT + Google OAuth)
│       │   ├── logger.ts           #   Winston logger
│       │   └── index.ts            #   Re-exports
│       │
│       ├── types/                  # TypeScript types & enums
│       │   ├── enums.ts            #   Role, Platform, PostStatus, AgentType, etc.
│       │   ├── common.ts           #   JwtPayload, AuthRequest, ApiResponse
│       │   ├── express.d.ts        #   Express type augmentation
│       │   └── index.ts
│       │
│       ├── middleware/             # Express middleware
│       │   ├── auth.ts             #   JWT authentication + role-based authorization
│       │   ├── validate.ts         #   Zod schema validation
│       │   ├── error.ts            #   Global error handler + 404
│       │   └── index.ts
│       │
│       ├── routes/                 # API route definitions (24 modules)
│       │   ├── auth.routes.ts      #   Register, login, refresh, logout, Google OAuth
│       │   ├── user.routes.ts      #   Profile management (creator/brand/agency)
│       │   ├── content.routes.ts   #   CRUD posts + calendar + filter by status
│       │   ├── campaign.routes.ts  #   Campaigns, matches, deliverables, reports
│       │   ├── agent.routes.ts     #   AI agent endpoints (run, chat, generate, insights, growth)
│       │   ├── matching.routes.ts  #   Find creators, match results, discover directory
│       │   ├── community.routes.ts #   Interactions, saved replies, voice profiles, threads, channels
│       │   ├── dashboard.routes.ts #   Stats, analytics, audience, reports
│       │   ├── account.routes.ts   #   Connected social accounts (OAuth connect/disconnect)
│       │   ├── idea.routes.ts      #   Content ideas, tags, templates
│       │   ├── listening.routes.ts #   Social listening queries + mentions
│       │   ├── competitive.routes.ts # Competitor monitoring + benchmarks
│       │   ├── team.routes.ts      #   Teams, members, workflows, approvals, comments
│       │   ├── startpage.routes.ts #   Link-in-bio pages (public + management)
│       │   ├── notification.routes.ts # In-app notifications
│       │   ├── usage.routes.ts     #   AI token budget & usage stats
│       │   ├── settings.routes.ts  #   User preferences & polling settings
│       │   ├── media.routes.ts     #   Media library (folders + asset uploads)
│       │   ├── revenue.routes.ts   #   Revenue streams, brand deals, invoices, post ROI
│       │   ├── webhook.routes.ts   #   WhatsApp webhook verification & message ingestion
│       │   ├── studio.routes.ts    #   AI Studio (compose, rewrite, image gen, intelligence, video)
│       │   ├── rss.routes.ts       #   RSS feed management (import content ideas)
│       │   ├── public-api.routes.ts #  Public API (API key auth, external post/analytics access)
│       │   └── index.ts            #   Mounts all route groups under /api
│       │
│       ├── controllers/            # Request handlers (19 modules)
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
│       │   └── studio.controller.ts #   AI Studio endpoints (compose, rewrite, image gen, etc.)
│       │
│       ├── services/               # Business logic (27 modules)
│       │   ├── auth.service.ts     #   Register, login, JWT + refresh token rotation
│       │   ├── user.service.ts     #   Profile management (creator/brand/agency)
│       │   ├── content.service.ts  #   Post CRUD, calendar, scheduling
│       │   ├── campaign.service.ts #   Campaign lifecycle + creator matching
│       │   ├── community.service.ts#   Interactions, saved replies, voice profiles, threads, channels
│       │   ├── dashboard.service.ts#   Dashboard stats, analytics, reports
│       │   ├── account.service.ts  #   Social account connections
│       │   ├── platform.service.ts #   Instagram/YouTube/TikTok API abstraction (real endpoints)
│       │   ├── revenue.service.ts  #   Revenue streams, brand deals, invoices, post ROI
│       │   ├── trends-data.service.ts # Real trend data (Google Trends, YouTube, TikTok, Instagram)
│       │   ├── email-inbox.service.ts # IMAP email polling → CommunityInteraction
│       │   ├── whatsapp-inbox.service.ts # WhatsApp Cloud API → CommunityInteraction
│       │   ├── idea.service.ts     #   Content ideas, tags, template management
│       │   ├── listening.service.ts #  Social listening queries + mention tracking
│       │   ├── competitive.service.ts # Competitor monitoring + benchmarks
│       │   ├── team.service.ts     #   Teams, members, approval workflows
│       │   ├── startpage.service.ts #  Link-in-bio page CRUD + analytics
│       │   ├── notification.service.ts # In-app notification delivery
│       │   ├── usage.service.ts    #   AI token budget tracking + tier management
│       │   ├── settings.service.ts #   User preferences + polling settings
│       │   ├── media.service.ts    #   Media library CRUD (folders + assets)
│       │   ├── media-processing.service.ts # Image/video processing pipeline
│       │   ├── report.service.ts   #   Analytics report generation
│       │   ├── rss.service.ts      #   RSS feed management + import
│       │   ├── hashtag-analytics.service.ts # Hashtag performance tracking
│       │   ├── integration-hub.service.ts # Third-party integration management
│       │   └── index.ts
│       │
│       ├── agents/                 # AI Agent system (14 agents + orchestrator)
│       │   ├── base.ts             #   BaseAgent abstract class (execute → run)
│       │   ├── content.agent.ts    #   Content generation (captions, hashtags, ideas)
│       │   ├── scheduling.agent.ts #   Optimal posting time recommendations
│       │   ├── analytics.agent.ts  #   Performance insights + trend analysis
│       │   ├── engagement.agent.ts #   Community reply suggestions
│       │   ├── trends.agent.ts     #   Trending content detection
│       │   ├── matching.agent.ts   #   Brand-creator matching with AI re-ranking
│       │   ├── growth.agent.ts     #   Daily recommendations, hooks, virality, weekly plan
│       │   ├── publishing.agent.ts #   Multi-platform publishing + formatting
│       │   ├── listening.agent.ts  #   Social listening, sentiment, signal detection
│       │   ├── competitive.agent.ts #  Competitor analysis, battle cards, gap reports
│       │   ├── campaign.agent.ts   #   Campaign strategy, briefs, ROI analysis
│       │   ├── collaboration.agent.ts # Team workflows, approvals, partnership vetting
│       │   ├── linkinbio.agent.ts  #   Start Page layout optimization + A/B suggestions
│       │   └── orchestrator.ts     #   Agent registry, pipelines, NLP routing
│       │
│       ├── matching/               # Multi-factor matching algorithm
│       │   ├── scoring.ts          #   Weighted scoring (niche, engagement, etc.)
│       │   └── matching.service.ts #   Campaign matching + creator discovery
│       │
│       ├── jobs/                   # Background job processing (BullMQ)
│       │   ├── index.ts            #   Queue definitions, workers, recurring schedules
│       │   ├── publish.job.ts      #   Auto-publish scheduled posts
│       │   ├── analytics.job.ts    #   Fetch post analytics + creator snapshots
│       │   ├── trends.job.ts       #   Periodic trend scanning
│       │   ├── growth.job.ts       #   Daily AI growth recommendations for creators
│       │   ├── inbox.job.ts        #   IMAP email inbox polling
│       │   ├── listening.job.ts    #   Social listening mention polling
│       │   ├── competitive.job.ts  #   Competitor metrics collection
│       │   ├── report.job.ts       #   Scheduled analytics report generation
│       │   ├── recurring-post.job.ts #  Clone + schedule recurring posts
│       │   ├── rss-import.job.ts   #   RSS feed sync → content ideas
│       │   └── token-refresh.job.ts#   OAuth token refresh for connected accounts
│       │
│       ├── prisma/
│       │   ├── schema/             #   Multi-file Prisma schema (19 files)
│       │   │   ├── base.prisma, user.prisma, creator.prisma, brand-agency.prisma
│       │   │   ├── content.prisma, campaign.prisma, community.prisma
│       │   │   ├── analytics.prisma, competitive.prisma, listening.prisma
│       │   │   ├── team.prisma, startpage.prisma, media.prisma
│       │   │   ├── revenue.prisma, usage.prisma, workflow.prisma
│       │   │   ├── notification.prisma, agent.prisma
│       │   │   └── migrations/
│       │   ├── seed.ts             #   Sample data seeder (orchestrator)
│       │   └── seed/               #   Modular seed files
│       │       ├── users.ts, content.ts, campaigns.ts, community.ts
│       │       ├── platform.ts, revenue.ts, collaboration.ts
│       │       ├── intelligence.ts, context.ts
│       │       └── index.ts
│       │
│       └── utils/
│           ├── crypto.ts           #   AES-256-GCM encrypt/decrypt for OAuth tokens
│           ├── helpers.ts          #   paginate, slugify, sanitizeString
│           └── index.ts
│
└── ui/                        # ── Frontend (React + Vite) ──
    ├── Dockerfile
    ├── package.json
    ├── vite.config.ts              # Vite config with SCSS + API proxy
    ├── index.html
    └── src/
        ├── main.tsx                # App entry (Redux Provider + BrowserRouter)
        ├── App.tsx                 # Route definitions (25+ pages)
        │
        ├── store/                  # Redux Toolkit state management
        │   ├── index.ts            #   Store configuration
        │   ├── api.ts              #   RTK Query base API
        │   ├── auth.slice.ts       #   Auth state slice
        │   ├── ai.slice.ts         #   AI activity state slice
        │   └── endpoints/          #   RTK Query endpoint modules (20)
        │       ├── auth.ts
        │       ├── content.ts
        │       ├── dashboard.ts
        │       ├── campaigns.ts
        │       ├── matching.ts
        │       ├── community.ts
        │       ├── agents.ts
        │       ├── accounts.ts
        │       ├── ideas.ts
        │       ├── listening.ts
        │       ├── competitive.ts
        │       ├── teams.ts
        │       ├── startpages.ts
        │       ├── notifications.ts
        │       ├── usage.ts
        │       ├── settings.ts
        │       ├── media.ts
        │       ├── revenue.ts      #   Revenue streams, deals, invoices, post ROI
        │       ├── growth.ts       #   Growth Copilot (daily, hooks, predict, plan)
        │       └── studio.ts       #   AI Studio (compose, rewrite, image gen, intelligence)
        │
        ├── hooks/
        │   └── store.ts            #   Typed useAppSelector / useAppDispatch
        │
        ├── components/
        │   ├── ai/                 # AI-related components
        │   │   ├── AiActivityIndicator.tsx
        │   │   └── FloatingAiAssistant.tsx
        │   ├── common/             # Shared UI components
        │   │   ├── PageHeader.tsx
        │   │   ├── StatCard.tsx
        │   │   ├── AiInsightCard.tsx
        │   │   └── GlobalSearch.tsx  #   Command-palette style search
        │   ├── content/            # Content editing components
        │   │   ├── MediaCropper.tsx  #   Image crop modal per platform
        │   │   ├── RichTextEditor.tsx #  Rich text editing with formatting
        │   │   ├── ThreadComposer.tsx #  Multi-post thread builder
        │   │   ├── ThumbnailPicker.tsx # Video thumbnail selector
        │   │   ├── CalendarNoteModal.tsx
        │   │   ├── IdeasSidePanel.tsx
        │   │   └── TemplateDrawer.tsx
        │   └── layout/             # Application layout
        │       ├── AppLayout.tsx    #   Auth-protected layout wrapper
        │       ├── Sidebar.tsx      #   Collapsible grouped navigation with tier badges
        │       ├── TopBar.tsx       #   Header with notifications
        │       └── NotificationCenter.tsx
        │
        ├── constants/
        │   ├── navigation.ts       #   Grouped nav items per role (NavGroup[])
        │   └── features.ts         #   Tier config, feature gates & plan comparison
        │
        ├── pages/
        │   ├── auth/
        │   │   ├── LoginPage.tsx
        │   │   ├── RegisterPage.tsx
        │   │   └── OAuthCallbackPage.tsx
        │   ├── pricing/
        │   │   └── PricingPage.tsx       # Public tier comparison (no auth)
        │   ├── dashboard/
        │   │   └── DashboardPage.tsx
        │   ├── content/
        │   │   ├── CalendarPage.tsx
        │   │   └── CreatePostPage.tsx
        │   ├── create/
        │   │   └── CreatePage.tsx       # Content idea workspace
        │   ├── analytics/
        │   │   └── AnalyticsPage.tsx
        │   ├── campaigns/
        │   │   └── CampaignsPage.tsx
        │   ├── discover/
        │   │   └── DiscoverPage.tsx
        │   ├── community/
        │   │   └── CommunityPage.tsx
        │   ├── trends/
        │   │   └── TrendsPage.tsx
        │   ├── listening/
        │   │   └── ListeningPage.tsx    # Social listening dashboard
        │   ├── competitive/
        │   │   └── CompetitivePage.tsx   # Competitor tracking
        │   ├── bio/
        │   │   └── BioBuilderPage.tsx    # Link-in-bio page editor
        │   ├── revenue/
        │   │   └── RevenuePage.tsx       # Revenue dashboard (streams, deals, invoices, ROI)
        │   ├── growth/
        │   │   └── GrowthCopilotPage.tsx # Daily recommendations, hooks, virality, plan
        │   ├── ai/
        │   │   └── AiAssistantPage.tsx
        │   ├── media/
        │   │   └── MediaLibraryPage.tsx  # Asset management
        │   ├── usage/
        │   │   └── UsagePage.tsx         # AI token budget
        │   ├── studio/                  # ── AI Content Studio ──
        │   │   ├── StudioLayout.tsx      #   Sidebar + tab-based Studio shell
        │   │   ├── StudioCompose.tsx     #   Re-export → compose/ module
        │   │   ├── StudioMediaLab.tsx    #   Media library browser + editor
        │   │   ├── StudioTemplates.tsx   #   Caption/post template manager
        │   │   ├── StudioAiCopilot.tsx   #   Full-screen AI chat interface
        │   │   ├── StudioVideoLab.tsx    #   Video editing tools + clip creation
        │   │   ├── StudioVideoAnalysis.tsx # Video performance deep-dive
        │   │   └── compose/             #   Modular compose editor (15 files)
        │   │       ├── StudioComposeView.tsx # Slim orchestrator — tabbed layout
        │   │       ├── useComposeForm.ts #   Custom hook: all state + mutations
        │   │       ├── types.ts          #   Shared types, schema, constants
        │   │       ├── ComposeToolbar.tsx #   Platform/postType selects + AI actions
        │   │       ├── MediaZone.tsx      #   Post-type dispatcher
        │   │       ├── ImageUploader.tsx, CarouselUploader.tsx
        │   │       ├── VideoUploader.tsx, StoryUploader.tsx
        │   │       ├── ThreadEditor.tsx   #   Multi-post thread chain editor
        │   │       ├── ChatPanel.tsx      #   AI copilot chat panel
        │   │       ├── IntelPanel.tsx     #   Intelligence (score, hashtags, tips)
        │   │       ├── SettingsPanel.tsx  #   Schedule, recurring, platform overrides
        │   │       └── compose.module.scss
        │   └── settings/
        │       ├── SettingsPage.tsx      # Profile, accounts, plan card, preferences
        │       ├── TeamSettingsPage.tsx
        │       └── components/
        │           └── PlanCard.tsx      # Current plan & upgrade CTA
        │
        └── styles/
            ├── main.scss               # Global styles
            └── abstracts/              # Design tokens (variables, mixins)
```

---

## API Endpoints

All routes are prefixed with `/api`.

### Auth (`/auth`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | No | Create account (email, password, name, role) |
| POST | `/auth/login` | No | Login, returns access + refresh tokens |
| POST | `/auth/refresh` | No | Rotate tokens |
| POST | `/auth/logout` | Yes | Invalidate refresh token |
| GET | `/auth/me` | Yes | Get current user profile |
| GET | `/auth/google` | No | Initiate Google OAuth flow |
| GET | `/auth/google/callback` | No | Handle Google OAuth callback |

### Users (`/users`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| PUT | `/users/me` | Yes | Update name / avatar |
| POST | `/users/creator-profile` | Creator | Set up creator profile (bio, niche, etc.) |
| POST | `/users/brand-profile` | Brand | Set up brand profile |
| POST | `/users/agency-profile` | Agency | Set up agency profile |
| GET | `/users/` | Admin | List all users |

### Content (`/content`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/content/` | Creator | Create a post |
| PUT | `/content/:id` | Creator | Update a post |
| DELETE | `/content/:id` | Creator | Delete a post |
| GET | `/content/calendar` | Creator | Monthly calendar view |
| GET | `/content/status/:status` | Creator | Filter posts by status |

### Campaigns (`/campaigns`)
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

### AI Agents (`/agents`)
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

### Matching (`/matching`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/matching/find-creators` | Brand/Admin | Run matching algorithm for a campaign |
| GET | `/matching/campaigns/:id/matches` | Yes | Get match results |
| GET | `/matching/creators` | Yes | Discover creators (filtered search) |

### Community (`/community`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/community/` | Creator | Get inbox/social interactions |
| GET | `/community/stats` | Creator | Get community engagement stats |
| GET | `/community/:id` | Creator | Get specific interaction |
| POST | `/community/:id/responded` | Creator | Mark as responded |
| PATCH | `/community/:id/read` | Creator | Mark as read |
| POST | `/community/bulk-read` | Creator | Bulk mark as read |
| PATCH | `/community/:id/case` | Creator | Update interaction case |
| PATCH | `/community/:id/assign` | Creator | Assign to team member |
| GET | `/community/saved-replies/list` | Creator | List saved reply templates |
| POST | `/community/saved-replies` | Creator | Create saved reply |
| PATCH | `/community/saved-replies/:id` | Creator | Update saved reply |
| DELETE | `/community/saved-replies/:id` | Creator | Delete saved reply |
| POST | `/community/saved-replies/:id/use` | Creator | Log usage of saved reply |
| GET | `/community/voice-profile/me` | Creator | Get AI voice/tone profile |
| PUT | `/community/voice-profile` | Creator | Update AI voice/tone profile |

### Dashboard (`/dashboard`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/dashboard/stats` | Yes | High-level dashboard stats |
| GET | `/dashboard/analytics` | Yes | Detailed analytics data |
| GET | `/dashboard/content-types` | Yes | Content distribution stats |
| GET | `/dashboard/audience` | Yes | Audience demographic insights |
| GET | `/dashboard/reports` | Yes | List generated reports |
| POST | `/dashboard/reports` | Yes | Create report configuration |
| GET | `/dashboard/reports/:id` | Yes | Get report details |
| PUT | `/dashboard/reports/:id` | Yes | Update report |
| DELETE | `/dashboard/reports/:id` | Yes | Delete report |
| POST | `/dashboard/reports/:id/generate` | Yes | Trigger report generation |

### Accounts (`/accounts`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/accounts/` | Yes | List connected social accounts |
| GET | `/accounts/connect/:platform` | Yes | Get OAuth URL for platform |
| GET | `/accounts/callback/:platform` | No | Handle OAuth callback |
| POST | `/accounts/connect/:platform/manual` | Yes | Connect via token/handle |
| DELETE | `/accounts/:provider` | Yes | Disconnect social account |
| POST | `/accounts/:provider/refresh` | Yes | Refresh platform token |

### Ideas (`/ideas`)
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

### Teams (`/teams`)
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

### Social Listening (`/listening`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/listening/` | Yes | List listening queries |
| POST | `/listening/` | Yes | Create listening query |
| GET | `/listening/:id/mentions` | Yes | Get mentions for query |

### Competitive Intelligence (`/competitive`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/competitive/` | Yes | List monitored competitors |
| POST | `/competitive/` | Yes | Add competitor |
| GET | `/competitive/benchmark` | Yes | Get competitive benchmark |

### Start Pages (`/startpages`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/startpages/p/:slug` | No | Public Link-in-bio page |
| GET | `/startpages/` | Yes | List user's pages |

### Notifications, Usage, Settings, Media
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| PATCH | `/notifications/read-all` | Yes | Mark all notifications as read |
| GET | `/usage/` | Yes | Get AI token budget & usage stats |
| PATCH | `/usage/tier` | Yes | Update subscription tier |
| PATCH | `/settings/` | Yes | Update user preferences |
| POST | `/media/assets` | Yes | Upload media asset (file upload) |

### Revenue (`/revenue`)
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

### Webhooks (`/webhooks`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/webhooks/whatsapp` | No | WhatsApp webhook verification (challenge) |
| POST | `/webhooks/whatsapp` | No | WhatsApp incoming message ingestion |

### AI Studio (`/studio`)
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

### RSS Feeds (`/rss`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/rss/` | Creator | List subscribed RSS feeds |
| POST | `/rss/` | Creator | Subscribe to an RSS feed |
| DELETE | `/rss/:id` | Creator | Unsubscribe from a feed |
| PATCH | `/rss/:id/toggle` | Creator | Enable/disable auto-import |

### Public API (`/public`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/public/keys` | JWT | Create an API key (with scopes) |
| GET | `/public/keys` | JWT | List user's API keys |
| DELETE | `/public/keys/:id` | JWT | Revoke an API key |
| GET | `/public/posts` | API Key | List posts (external access) |
| POST | `/public/posts` | API Key | Create post (external access) |
| GET | `/public/posts/:id` | API Key | Get post details |
| GET | `/public/analytics` | API Key | Get analytics data |

---

## AI Agents

The platform includes 14 specialized AI agents plus a Studio agent, powered by OpenAI and coordinated by an orchestrator with pipeline execution and NLP routing:

| Agent | Type Key | What It Does |
|-------|----------|-------------|
| Content Generation | `CONTENT_GENERATION` | Generates captions, hashtags, and content ideas per platform |
| Publishing | `PUBLISHING` | Manages post publishing workflows, multi-platform formatting + adaptation |
| Scheduling | `SCHEDULING` | Analyzes past performance to recommend optimal posting times |
| Matching | `MATCHING` | Scores and ranks creator-brand matches using multi-factor algorithm + AI |
| Analytics | `ANALYTICS` | Summarizes engagement data with insights and recommendations |
| Engagement | `ENGAGEMENT` | Suggests replies to comments/DMs with tone matching via voice profiles |
| Trend Detection | `TREND_DETECTION` | Identifies trending topics by niche and platform |
| Social Listening | `LISTENING` | Monitors brand mentions, keywords, and sentiment across platforms |
| Competitive Intel | `COMPETITIVE` | Tracks competitor performance, battle cards, gap analysis |
| Collaboration | `COLLABORATION` | Team workflows, approvals, partnership vetting |
| Campaign | `CAMPAIGN` | Assists with campaign briefs, deliverable tracking, and ROI analysis |
| Link-in-Bio | `LINK_IN_BIO` | Start Page layout optimization, A/B testing suggestions |
| Growth | `GROWTH` | Daily recommendations, viral hooks, virality prediction, weekly growth plans grounded in real trend data |
| **Studio** | *(via `/studio` routes)* | AI-assisted compose from topic, caption rewrite, DALL-E image gen, media suggestions, content intelligence (score, best times, hashtags, audience tips), video analysis + clip creation |

### Orchestrator Features

- **Agent Registry**: All 14 agents + Studio agent registered and dispatched by type
- **Multi-Step Pipelines**: Chain agents together (e.g., Analytics → Content Generation, Trend Detection → Growth)
- **NLP Routing**: Natural language messages automatically routed to the appropriate agent or pipeline via `routeMessage`
- **Budget Gating**: Token usage checked against tier-based budgets before execution
- **Event-Driven**: Emits events for real-time WebSocket notifications on task completion

All agents log their tasks (input, output, tokens used) to the `AgentTask` table for auditing.

---

## Database Schema (Key Models)

| Model | Purpose |
|-------|---------|
| **Auth & Profiles** | |
| `User` | Core user (email, password, role) |
| `OAuthAccount` | Connected platform accounts (encrypted tokens) |
| `CreatorProfile` | Bio, niche, location, languages |
| `CreatorPlatformStats` | Per-platform followers, engagement, avg metrics |
| `BrandProfile` | Company info, industry, budget range, target audience |
| `AgencyProfile` | Agency info + managed creators |
| `AgencyCreator` | Agency → Creator management relationship |
| **Content & Scheduling** | |
| `ContentIdea` | Content sparks and drafts before becoming posts |
| `ContentTag` | Categorization labels for ideas |
| `ContentTemplate` | Reusable caption/post structures per platform |
| `ContentPost` | Posts with status workflow (Idea → Draft → Review → Scheduled → Published) |
| `PostingSchedule` | Preferred posting days/times per platform |
| `PostAnalytics` | Impressions, reach, likes, comments, shares per post |
| **Analytics & Reporting** | |
| `CreatorAnalyticsSnapshot` | Daily follower/engagement snapshots for growth tracking |
| `AnalyticsReport` | Generated PDF/CSV report metadata |
| `AudienceInsight` | Demographic breakdowns (age, location, interests) |
| **Campaigns** | |
| `Campaign` | Brand campaigns with target niche, platforms, budget |
| `MatchCriteria` | Configurable scoring weights per campaign |
| `CampaignMatch` | Creator-campaign match records with scores and AI reasoning |
| `CampaignDeliverable` | Tasks (posts, stories, reels) assigned within a campaign |
| `CampaignReport` | Aggregated ROI and performance summary |
| **Community & Engagement** | |
| `CommunityInteraction` | Comments/DMs with sentiment and AI-suggested replies |
| `SavedReply` | Template responses for frequent queries |
| `CommentScore` | Creator responsiveness and engagement metrics |
| `UserVoiceProfile` | AI tone/vocabulary settings for automated replies |
| **Social Listening & Competitive** | |
| `ListeningQuery` | Keywords/platforms tracked for monitoring |
| `Mention` | Individual keyword mentions found via listening |
| `SentimentSnapshot` | Aggregated mood tracking over time |
| `Competitor` | External accounts monitored for benchmarking |
| `CompetitorSnapshot` | Competitor performance metrics and activity |
| **Collaboration** | |
| `Team` | Groups of users collaborating on content |
| `TeamMember` | Membership and role definitions (Admin, Editor, Viewer) |
| `ApprovalWorkflow` | Multi-stage content review processes |
| `PostComment` | Internal collaboration comments on posts |
| **Features** | |
| `StartPage` | Customizable Link-in-Bio landing pages |
| `StartPageLink` | Individual links/blocks on a start page |
| `StartPageAnalytics` | Traffic and click tracking |
| `Notification` | In-app alerts (system events, agent completions, approvals) |
| **AI & Workflows** | |
| `WorkflowTemplate` | Blueprints for multi-agent autonomous tasks |
| `WorkflowRun` | Execution history of running workflows |
| `AgentTask` | AI agent execution logs (input, output, tokens, status) |
| `UsageBudget` | Token limits and consumption by user tier |
| `AgentUsageLog` | Detailed AI model usage ledger |
| **System** | |
| `PlatformRateLimit` | API quota tracking for social platforms |
| `UserSettings` | Notification and polling frequency preferences |
| `MediaFolder` | Organizational folders for uploaded assets |
| `MediaAsset` | Image/video metadata and URLs |
| **Revenue & Monetization** | |
| `RevenueStream` | Recurring/one-time income sources (sponsorships, ads, merch, etc.) |
| `BrandDeal` | Brand deal CRM with status tracking (PROSPECT → NEGOTIATING → ACTIVE → COMPLETED) |
| `Invoice` | Invoices tied to brand deals (DRAFT → SENT → PAID/OVERDUE) |
| **Unified Inbox** | |
| `InboxChannel` | Connected inbox channels (Instagram DM, WhatsApp, Email, Brand Inquiry) |

---

## User Roles

| Role | Capabilities |
|------|-------------|
| **Creator** | Manage content & ideas, view calendar/analytics, engage community, access AI agents, respond to campaign matches, build Link-in-Bio pages, manage media library, track revenue & brand deals, use Growth Copilot |
| **Brand** | Create campaigns, define matching criteria, discover creators, trigger matching algorithm, view match results, manage deliverables |
| **Agency** | Manage multiple creators, view aggregated analytics |
| **Admin** | Full access — manage users, view all data, system configuration |

---

## Background Jobs

| Queue | Schedule | Description |
|-------|----------|-------------|
| `publish` | Every 60 seconds | Checks for scheduled posts within a 2-min window and publishes via platform APIs |
| `analytics` | Every 6 hours | Fetches post analytics from platform APIs and updates creator snapshots |
| `trends` | On-demand | Scans for trending content by niche/platform |
| `listening` | Every 15 minutes | Polls social platforms for brand mentions and keyword matches |
| `competitive` | Daily | Collects competitor metrics and activity for benchmarking |
| `reports` | Every 6 hours | Processes scheduled analytics report generation |
| `growth-daily` | Daily (8 AM) | Generates AI-powered daily growth recommendations for all active creators |
| `inbox-email-poll` | Every 5 minutes | Polls connected IMAP email accounts, imports messages as interactions |
| `recurring-post` | Every 60 seconds | Clones and schedules next occurrence of recurring posts |
| `rss-import` | Every 30 minutes | Syncs subscribed RSS feeds, imports new items as content ideas |
| `token-refresh` | Daily | Refreshes OAuth tokens expiring within 7 days (Google, Instagram, TikTok) |

---

## Subscription Tiers

The platform uses a soft-wall pricing model with three tiers. All features remain navigable on every tier — gated items show upgrade badges in the sidebar but are not hard-blocked.

| Feature | Free | Pro (₹1,499/mo) | Enterprise (₹4,999/mo) |
|---------|------|------------------|------------------------|
| AI tokens per day | 50k | 200k | 1M |
| Team members | 2 | 10 | Unlimited |
| Post creation | 5/day | Unlimited | Unlimited |
| Media storage | 500 MB | 10 GB | 100 GB |
| Revenue tracking | — | ✓ | ✓ |
| Brand deal CRM | — | ✓ | ✓ |
| Link-in-Bio builder | — | ✓ | ✓ |
| Trend detection | — | ✓ | ✓ |
| Social listening | — | ✓ | ✓ |
| Growth Copilot | — | ✓ | ✓ |
| Competitive intel | — | — | ✓ |
| Approval workflows | — | ✓ | ✓ |
| Dedicated support | — | — | ✓ |

Tier is stored on the `UsageBudget` model (`FREE`, `PRO`, `ENTERPRISE`) and returned with the user session. The existing `updateTier` mutation on the Usage page handles tier changes for demo purposes (no Stripe integration yet).

A public `/pricing` page is accessible without authentication and displays a full feature comparison matrix.

---

## Sidebar Navigation

The sidebar uses collapsible category groups (not a flat link list). Groups are role-specific:

**Creator:** Home, Content, Monetization, Intelligence, AI & Growth, Communication, Account
**Brand:** Home, Campaigns, Intelligence, Tools, Account
**Agency:** Home, Management, Intelligence, Account
**Admin:** Home, Administration, Intelligence, Account

Single-item groups (e.g., Home, Communication) render inline without a header. Collapsed state is persisted in `localStorage`. Nav items requiring a higher tier than the user's current plan show a colored PRO/ENT badge.

---

## Production Considerations

- Change `JWT_SECRET` and `ENCRYPTION_KEY` to strong random values
- Set `NODE_ENV=production`
- Use managed PostgreSQL and Redis services
- Configure real OAuth credentials for Google, Instagram, YouTube, TikTok
- Set a valid `OPENAI_API_KEY`
- Put the API behind a reverse proxy (nginx/Caddy) with TLS
- Rate limiting is already configured via `express-rate-limit` (200 req/15 min)
- Helmet security headers are enabled by default
- Configure `UPLOAD_DIR` and `MAX_FILE_SIZE` for media library storage
- Consider code-splitting for the frontend bundle (currently ~2.2 MB)

---

## License

Private — all rights reserved.
