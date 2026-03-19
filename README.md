# CrMS — Creator Management System

AI-powered platform for managing creators, brands, campaigns, and community engagement across Instagram, YouTube, and TikTok. Inspired by [Buffer](https://buffer.com).

---

## Tech Stack

| Layer        | Technology |
|-------------|------------|
| Frontend    | React 19, TypeScript, Vite 8, Tailwind CSS 4, Redux Toolkit (RTK Query), Ant Design 6, React Router 7, Recharts, SCSS Modules |
| Backend     | Node.js, TypeScript, Express 5, Prisma 6 ORM, Zod validation |
| Database    | PostgreSQL 16, Redis 7 |
| AI          | OpenAI GPT-4 (12 specialized agents with orchestrator, pipelines & NLP routing) |
| Job Queue   | BullMQ (publishing, analytics, trends, social listening, competitive intel, reports) |
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
│       ├── routes/                 # API route definitions (18 modules)
│       │   ├── auth.routes.ts      #   Register, login, refresh, logout, Google OAuth
│       │   ├── user.routes.ts      #   Profile management (creator/brand/agency)
│       │   ├── content.routes.ts   #   CRUD posts + calendar + filter by status
│       │   ├── campaign.routes.ts  #   Campaigns, matches, deliverables, reports
│       │   ├── agent.routes.ts     #   AI agent endpoints (run, chat, generate, insights)
│       │   ├── matching.routes.ts  #   Find creators, match results, discover directory
│       │   ├── community.routes.ts #   Interactions, saved replies, voice profiles
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
│       │   └── index.ts            #   Mounts all route groups under /api
│       │
│       ├── controllers/            # Request handlers
│       │   ├── auth.controller.ts
│       │   ├── user.controller.ts
│       │   ├── content.controller.ts
│       │   ├── campaign.controller.ts
│       │   ├── agent.controller.ts
│       │   ├── matching.controller.ts
│       │   ├── community.controller.ts
│       │   ├── dashboard.controller.ts
│       │   └── account.controller.ts
│       │
│       ├── services/               # Business logic
│       │   ├── auth.service.ts     #   Register, login, JWT + refresh token rotation
│       │   ├── user.service.ts     #   Profile management (creator/brand/agency)
│       │   ├── content.service.ts  #   Post CRUD, calendar, scheduling
│       │   ├── campaign.service.ts #   Campaign lifecycle + creator matching
│       │   ├── community.service.ts#   Interactions, saved replies, voice profiles
│       │   ├── dashboard.service.ts#   Dashboard stats, analytics, reports
│       │   ├── account.service.ts  #   Social account connections
│       │   ├── platform.service.ts #   Instagram/YouTube/TikTok API abstraction
│       │   └── index.ts
│       │
│       ├── agents/                 # AI Agent system (12 agents)
│       │   ├── base.ts             #   BaseAgent abstract class (execute → run)
│       │   ├── content.agent.ts    #   Content generation (captions, hashtags, ideas)
│       │   ├── scheduling.agent.ts #   Optimal posting time recommendations
│       │   ├── analytics.agent.ts  #   Performance insights + trend analysis
│       │   ├── engagement.agent.ts #   Community reply suggestions
│       │   ├── trends.agent.ts     #   Trending content detection
│       │   ├── matching.agent.ts   #   Brand-creator matching with AI re-ranking
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
│       │   └── trends.job.ts       #   Periodic trend scanning
│       │
│       ├── prisma/
│       │   ├── schema.prisma       #   Database schema (45+ models)
│       │   ├── seed.ts             #   Sample data seeder
│       │   └── migrations/         #   Database migration history
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
        ├── App.tsx                 # Route definitions (20+ pages)
        │
        ├── store/                  # Redux Toolkit state management
        │   ├── index.ts            #   Store configuration
        │   ├── api.ts              #   RTK Query base API
        │   ├── auth.slice.ts       #   Auth state slice
        │   ├── ai.slice.ts         #   AI activity state slice
        │   └── endpoints/          #   RTK Query endpoint modules
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
        │       └── media.ts
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
        │   │   └── AiInsightCard.tsx
        │   └── layout/             # Application layout
        │       ├── AppLayout.tsx    #   Auth-protected layout wrapper
        │       ├── Sidebar.tsx      #   Role-based navigation
        │       ├── TopBar.tsx       #   Header with notifications
        │       └── NotificationCenter.tsx
        │
        ├── pages/
        │   ├── auth/
        │   │   ├── LoginPage.tsx
        │   │   ├── RegisterPage.tsx
        │   │   └── OAuthCallbackPage.tsx
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
        │   ├── ai/
        │   │   └── AiAssistantPage.tsx
        │   ├── media/
        │   │   └── MediaLibraryPage.tsx  # Asset management
        │   ├── usage/
        │   │   └── UsagePage.tsx         # AI token budget
        │   └── settings/
        │       ├── SettingsPage.tsx
        │       └── TeamSettingsPage.tsx
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
| PATCH | `/settings/` | Yes | Update user preferences |
| POST | `/media/assets` | Yes | Upload media asset (file upload) |

---

## AI Agents

The platform includes 12 specialized AI agents powered by OpenAI, coordinated by an orchestrator with pipeline execution and NLP routing:

| Agent | Type Key | What It Does |
|-------|----------|-------------|
| Content Generation | `CONTENT_GENERATION` | Generates captions, hashtags, and content ideas per platform |
| Publishing | `PUBLISHING` | Manages post publishing workflows and platform-specific formatting |
| Scheduling | `SCHEDULING` | Analyzes past performance to recommend optimal posting times |
| Matching | `MATCHING` | Scores and ranks creator-brand matches using multi-factor algorithm + AI |
| Analytics | `ANALYTICS` | Summarizes engagement data with insights and recommendations |
| Engagement | `ENGAGEMENT` | Suggests replies to comments/DMs with tone matching via voice profiles |
| Trend Detection | `TREND_DETECTION` | Identifies trending topics by niche and platform |
| Social Listening | `LISTENING` | Monitors brand mentions, keywords, and sentiment across platforms |
| Competitive Intel | `COMPETITIVE` | Tracks competitor performance and generates benchmark reports |
| Collaboration | `COLLABORATION` | Manages team workflows, approvals, and content review processes |
| Campaign | `CAMPAIGN` | Assists with campaign briefs, deliverable tracking, and ROI analysis |
| Link-in-Bio | `LINK_IN_BIO` | Helps build and optimize Start Page (link-in-bio) layouts |

### Orchestrator Features

- **Agent Registry**: All 12 agents registered and dispatched by type
- **Multi-Step Pipelines**: Chain agents together (e.g., Analytics → Content Generation, Trend Detection → Content Generation)
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

---

## User Roles

| Role | Capabilities |
|------|-------------|
| **Creator** | Manage content & ideas, view calendar/analytics, engage community, access AI agents, respond to campaign matches, build Link-in-Bio pages, manage media library |
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
