# CrMS — Creator Management System

AI-powered platform for managing creators, brands, campaigns, and community engagement across Instagram, YouTube, and TikTok. Inspired by [Buffer](https://buffer.com).

---

## Tech Stack

| Layer        | Technology |
|-------------|------------|
| Frontend    | React 19, TypeScript, Vite, Tailwind CSS 4, Zustand, TanStack Query, React Router, Recharts |
| Backend     | Node.js, TypeScript, Express 5, Prisma ORM, Zod validation |
| Database    | PostgreSQL 16, Redis 7 |
| AI          | OpenAI GPT-4 (6 specialized agents) |
| Job Queue   | BullMQ (publishing, analytics, trend detection) |
| Auth        | JWT (access + refresh tokens via Redis), bcrypt, Passport.js |
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
| `JWT_SECRET` | Secret for signing JWT tokens | *(must change in prod)* |
| `ENCRYPTION_KEY` | 64-hex-char key for AES-256-GCM encryption of OAuth tokens at rest | *(must change in prod)* |
| `OPENAI_API_KEY` | OpenAI API key for AI agents | *(optional)* |
| `OPENAI_MODEL` | Model to use | `gpt-4` |
| `CLIENT_URL` | Frontend URL (CORS allowlist) | `http://localhost:5173` |

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
│       ├── index.ts                # App entry point (Express server + workers)
│       │
│       ├── config/                 # Configuration layer
│       │   ├── env.ts              #   Zod-validated env variables
│       │   ├── database.ts         #   Prisma client singleton
│       │   ├── redis.ts            #   ioredis client
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
│       ├── routes/                 # API route definitions
│       │   ├── auth.routes.ts      #   POST /register, /login, /refresh, /logout; GET /me
│       │   ├── user.routes.ts      #   PUT /me; POST /creator-profile, /brand-profile, /agency-profile
│       │   ├── content.routes.ts   #   CRUD posts + calendar + filter by status
│       │   ├── campaign.routes.ts  #   CRUD campaigns + match responses
│       │   ├── agent.routes.ts     #   AI agent endpoints (run, generate, schedule, insights, trends)
│       │   ├── matching.routes.ts  #   Find creators, match results, discover directory
│       │   └── index.ts            #   Mounts all route groups under /api
│       │
│       ├── controllers/            # Request handlers
│       │   ├── auth.controller.ts
│       │   ├── user.controller.ts
│       │   ├── content.controller.ts
│       │   ├── campaign.controller.ts
│       │   ├── agent.controller.ts
│       │   └── matching.controller.ts
│       │
│       ├── services/               # Business logic
│       │   ├── auth.service.ts     #   Register, login, JWT + refresh token rotation
│       │   ├── user.service.ts     #   Profile management (creator/brand/agency)
│       │   ├── content.service.ts  #   Post CRUD, calendar, scheduling
│       │   ├── campaign.service.ts #   Campaign lifecycle + creator matching
│       │   ├── platform.service.ts #   Instagram/YouTube/TikTok API abstraction (stubs)
│       │   └── index.ts
│       │
│       ├── agents/                 # AI Agent system
│       │   ├── base.ts             #   BaseAgent abstract class (execute → run pattern)
│       │   ├── content.agent.ts    #   Content generation (captions, hashtags, ideas)
│       │   ├── scheduling.agent.ts #   Optimal posting time recommendations
│       │   ├── analytics.agent.ts  #   Performance insights + trend analysis
│       │   ├── engagement.agent.ts #   Community reply suggestions
│       │   ├── trends.agent.ts     #   Trending content detection
│       │   ├── matching.agent.ts   #   Brand-creator matching with AI re-ranking
│       │   └── orchestrator.ts     #   Agent registry + dispatcher
│       │
│       ├── matching/               # Multi-factor matching algorithm
│       │   ├── scoring.ts          #   Weighted scoring (niche, engagement, followers, location, budget)
│       │   └── matching.service.ts #   Campaign matching + creator discovery
│       │
│       ├── jobs/                   # Background job processing (BullMQ)
│       │   ├── index.ts            #   Queue definitions, workers, recurring schedules
│       │   ├── publish.job.ts      #   Auto-publish scheduled posts to platforms
│       │   ├── analytics.job.ts    #   Fetch post analytics + creator snapshots
│       │   └── trends.job.ts       #   Periodic trend scanning
│       │
│       ├── prisma/
│       │   ├── schema.prisma       #   Database schema (15+ models)
│       │   └── seed.ts             #   Sample data seeder
│       │
│       └── utils/
│           ├── crypto.ts           #   AES-256-GCM encrypt/decrypt for OAuth tokens
│           ├── helpers.ts          #   paginate, slugify, sanitizeString
│           └── index.ts
│
└── ui/                        # ── Frontend (React + Vite) ──
    ├── Dockerfile
    ├── package.json
    ├── vite.config.ts              # Vite config with Tailwind plugin + API proxy
    ├── index.html
    └── src/
        ├── main.tsx                # App entry (QueryClientProvider + BrowserRouter)
        ├── App.tsx                 # Route definitions
        ├── index.css               # Tailwind imports + CSS custom properties
        │
        ├── lib/
        │   ├── api.ts              # Axios instance with JWT interceptors + token refresh
        │   └── utils.ts            # cn() utility (clsx + tailwind-merge)
        │
        ├── stores/
        │   └── auth.store.ts       # Zustand auth state (user, tokens, logout)
        │
        ├── components/
        │   ├── ui/                 # Shared UI primitives
        │   │   ├── Button.tsx      #   5 variants, 3 sizes, loading state
        │   │   ├── Input.tsx       #   With label + error display
        │   │   ├── Card.tsx        #   Card, CardHeader, CardContent
        │   │   └── Badge.tsx       #   5 color variants
        │   └── layout/
        │       ├── AppLayout.tsx   #   Auth-protected layout wrapper
        │       ├── Sidebar.tsx     #   Role-based navigation (Creator/Brand/Agency/Admin)
        │       └── TopBar.tsx      #   Header with notifications + logout
        │
        └── pages/
            ├── auth/
            │   ├── LoginPage.tsx       # Email/password login
            │   └── RegisterPage.tsx    # Registration with role selection
            ├── dashboard/
            │   └── DashboardPage.tsx   # Role-specific dashboard (Creator vs Brand)
            ├── content/
            │   ├── CalendarPage.tsx     # Monthly calendar grid with post indicators
            │   └── CreatePostPage.tsx   # Post editor with AI assist panel
            ├── analytics/
            │   └── AnalyticsPage.tsx    # Charts + AI-generated insights
            ├── campaigns/
            │   └── CampaignsPage.tsx    # Campaign list (role-aware)
            ├── discover/
            │   └── DiscoverPage.tsx     # Creator directory with filters
            ├── community/
            │   └── CommunityPage.tsx    # Interactions hub with AI reply suggestions
            ├── trends/
            │   └── TrendsPage.tsx       # Trending content with urgency badges
            ├── ai/
            │   └── AiAssistantPage.tsx  # Chat-based AI agent interface
            └── settings/
                └── SettingsPage.tsx     # Profile editing + connected accounts
```

---

## API Endpoints

All routes are prefixed with `/api`.

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | No | Create account (email, password, name, role) |
| POST | `/auth/login` | No | Login, returns access + refresh tokens |
| POST | `/auth/refresh` | No | Rotate tokens |
| POST | `/auth/logout` | Yes | Invalidate refresh token |
| GET | `/auth/me` | Yes | Get current user profile |

### Users
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| PUT | `/users/me` | Yes | Update name / avatar |
| POST | `/users/creator-profile` | Creator | Set up creator profile (bio, niche, etc.) |
| POST | `/users/brand-profile` | Brand | Set up brand profile |
| POST | `/users/agency-profile` | Agency | Set up agency profile |
| GET | `/users/` | Admin | List all users |

### Content
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/content/` | Creator | Create a post |
| PUT | `/content/:id` | Creator | Update a post |
| DELETE | `/content/:id` | Creator | Delete a post |
| GET | `/content/calendar` | Creator | Monthly calendar view |
| GET | `/content/status/:status` | Creator | Filter posts by status |

### Campaigns
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/campaigns/` | Brand | Create campaign + matching criteria |
| GET | `/campaigns/` | Yes | List campaigns |
| GET | `/campaigns/my` | Creator | Get campaigns matched to me |
| GET | `/campaigns/:id` | Yes | Campaign details |
| PATCH | `/campaigns/:id/status` | Brand | Update campaign status |
| POST | `/campaigns/matches/:matchId/respond` | Creator | Accept/decline match |

### AI Agents
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/agents/run` | Yes | Run any agent by type |
| POST | `/agents/content/generate` | Yes | Generate content ideas |
| POST | `/agents/schedule/optimize` | Yes | Get optimal posting times |
| POST | `/agents/analytics/insights` | Yes | Get analytics insights |
| POST | `/agents/engagement/suggestions` | Yes | Get reply suggestions |
| POST | `/agents/trends` | Yes | Detect trending content |
| GET | `/agents/` | Yes | List available agents |
| GET | `/agents/history` | Yes | Agent task history |

### Matching
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/matching/find-creators` | Brand/Admin | Run matching algorithm for a campaign |
| GET | `/matching/campaigns/:campaignId/matches` | Yes | Get match results |
| GET | `/matching/creators` | Yes | Discover creators (filtered search) |

---

## AI Agents

The platform includes 6 specialized AI agents powered by OpenAI:

| Agent | Type Key | What It Does |
|-------|----------|-------------|
| Content Generation | `CONTENT_GENERATION` | Generates captions, hashtags, and content ideas per platform |
| Scheduling | `SCHEDULING` | Analyzes past performance to recommend optimal posting times |
| Analytics | `ANALYTICS` | Summarizes engagement data with insights and recommendations |
| Engagement | `ENGAGEMENT` | Suggests replies to comments/DMs with appropriate tone |
| Trend Detection | `TREND_DETECTION` | Identifies trending topics by niche and platform |
| Matching | `MATCHING` | Scores and ranks creator-brand matches using multi-factor algorithm + AI |

All agents log their tasks (input, output, tokens used) to the `AgentTask` table for auditing.

---

## Database Schema (Key Models)

| Model | Purpose |
|-------|---------|
| `User` | Core user (email, password, role) |
| `OAuthAccount` | Connected platform accounts (encrypted tokens) |
| `CreatorProfile` | Bio, niche, location, languages |
| `CreatorPlatformStats` | Per-platform followers, engagement, avg metrics |
| `BrandProfile` | Company info, industry, budget range, target audience |
| `AgencyProfile` | Agency info + managed creators |
| `ContentPost` | Posts with status workflow (Idea → Draft → Review → Scheduled → Published) |
| `PostAnalytics` | Impressions, reach, likes, comments, shares per post |
| `CreatorAnalyticsSnapshot` | Daily follower/engagement snapshots for growth tracking |
| `Campaign` | Brand campaigns with target niche, platforms, budget |
| `MatchCriteria` | Configurable scoring weights per campaign |
| `CampaignMatch` | Creator-campaign match records with scores and AI reasoning |
| `CommunityInteraction` | Comments/DMs with sentiment and AI-suggested replies |
| `AgentTask` | AI agent execution logs |

---

## User Roles

| Role | Capabilities |
|------|-------------|
| **Creator** | Manage content, view calendar/analytics, engage community, access AI agents, respond to campaign matches |
| **Brand** | Create campaigns, define matching criteria, discover creators, trigger matching algorithm, view match results |
| **Agency** | Manage multiple creators, view aggregated analytics |
| **Admin** | Full access — manage users, view all data, system configuration |

---

## Background Jobs

| Queue | Schedule | Description |
|-------|----------|-------------|
| `publish` | Every 60 seconds | Checks for scheduled posts within a 2-min window and publishes them via platform APIs |
| `analytics` | Every 6 hours | Fetches post analytics from platform APIs and updates creator snapshots |
| `trends` | On-demand | Scans for trending content by niche/platform |

---

## Production Considerations

- Change `JWT_SECRET` and `ENCRYPTION_KEY` to strong random values
- Set `NODE_ENV=production`
- Use managed PostgreSQL and Redis services
- Configure real OAuth credentials for Instagram, YouTube, TikTok
- Set a valid `OPENAI_API_KEY`
- Put the API behind a reverse proxy (nginx/Caddy) with TLS
- Rate limiting is already configured via `express-rate-limit`

---

## License

Private — all rights reserved.
