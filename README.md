# CrMS — Creator Management System

AI-powered platform for managing creators, brands, campaigns, and community engagement across Instagram, YouTube, TikTok, Twitter/X, LinkedIn, Threads, Bluesky, Facebook, Pinterest, Reddit, and Google Business Profile.

## Documentation

| Document | Contents |
|----------|----------|
| **This file** | Tech stack, quick start, setup, environment variables |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Project structure, database schema, user roles, AI agents, navigation |
| [docs/API.md](docs/API.md) | Complete API endpoint reference (30 route modules) |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Production Docker, CI/CD, security, background jobs, billing, storage |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite 8, SCSS Modules, Redux Toolkit (RTK Query), Ant Design 6, React Router 7, Recharts |
| Backend | Node.js, TypeScript, Express 5, Prisma 6 ORM, Zod validation |
| Database | PostgreSQL 16, Redis 7 |
| AI | OpenAI GPT-4 / GPT-4o (14 specialized agents + orchestrator with NLP routing & pipelines) |
| Job Queue | BullMQ (15 queues — publishing, analytics, trends, listening, signals, competitive, growth, inbox, cleanup, and more) |
| Real-Time | Socket.IO (WebSocket notifications & live agent activity) |
| Auth | JWT (access + refresh via Redis), bcrypt, Passport.js, Google OAuth |
| Payments | Stripe (USD), Razorpay (INR), webhook-verified subscriptions |
| Push | Web Push (VAPID / web-push) |
| Storage | Local disk (default) or S3-compatible (Cloudflare R2, AWS S3, MinIO) |
| CI/CD | GitHub Actions (lint, build, audit, Docker) |
| Infra | Docker Compose, production Dockerfiles (multi-stage), nginx reverse proxy |

---

## Features

### Content & Publishing
- **AI Studio** — compose, rewrite, DALL-E image generation, content intelligence scoring, video analysis
- **Content Library** — grid/list views, bulk actions, status filtering
- **Calendar** — month/week/day views, drag-and-drop rescheduling, quick-create from slots
- **Ideas** — idea workspace with quick-to-post conversion, RSS feed import
- **Multi-Platform Publishing** — schedule & auto-publish to 11 platforms with first-comment support

### CRM & Revenue
- **Signal Engine** — AI-powered intent detection on social mentions, automatic lead scoring
- **CRM** — contacts, deal pipeline Kanban (PROSPECT → WON/LOST), relationship scoring
- **Revenue Dashboard** — income tracking, brand deal management, invoice generation (PDF)
- **Contracts** — deliverable tracking, payment schedules, calendar overlays

### Intelligence
- **Analytics** — cross-platform metrics, per-post drill-down, per-channel insights with AI recommendations
- **Social Listening** — keyword monitoring, sentiment analysis, signal categorization
- **Competitive Intel** — benchmarking, battle cards, gap analysis
- **Trends** — niche/platform filtering, create-from-trend

### Community & Collaboration
- **Unified Inbox** — comments, DMs, emails, WhatsApp across all platforms
- **AI Replies** — voice-profile-matched reply suggestions
- **Teams** — role-based access (Owner/Admin/Editor/Contributor/Viewer), approval workflows
- **Growth Copilot** — daily AI recommendations, viral hooks, weekly growth plans

### Platform
- **Subscription Tiers** — Free / Pro / Enterprise with Stripe + Razorpay checkout
- **Media Library** — folders, bulk upload, storage meter, cloud imports (Google Drive, Dropbox, Canva)
- **Link-in-Bio** — customizable start pages with analytics
- **Settings** — sidebar-navigated settings (profile, channels, AI preferences, privacy, billing)
- **AI Usage** — token budget tracking with per-model cost estimation
- **Bull Board** — job queue monitoring dashboard at `/admin/queues`

---

## Prerequisites

- **Node.js** >= 20
- **npm** >= 10
- **Docker** & **Docker Compose** (for PostgreSQL + Redis, or run them natively)
- **OpenAI API Key** (optional — AI features degrade gracefully without it)

---

## Quick Start (Docker)

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

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| API | http://localhost:3001/api |
| Bull Board | http://localhost:3001/admin/queues |

---

## Quick Start (Local Development)

### 1. Install dependencies

```bash
npm install
```

This installs dependencies for both the `ui/` and `server/` workspaces.

### 2. Start PostgreSQL & Redis

```bash
docker compose up postgres redis -d
```

Or point `DATABASE_URL` and `REDIS_URL` in `.env` to existing instances.

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env with your values
```

### 4. Set up the database

```bash
npm run db:generate --workspace=server
npm run db:migrate
npm run db:seed
```

### 5. Start development servers

```bash
# Both server + client
npm run dev

# Or separately:
npm run dev:server   # API on :3001
npm run dev:client   # UI on :5173
```

---

## Default Seed Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@crms.local | admin123456 |
| Creator | creator@crms.local | creator123456 |
| Brand | brand@crms.local | brand123456 |

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
| `ENCRYPTION_KEY` | 64-hex-char key for AES-256-GCM encryption | *(must change in prod)* |
| `OPENAI_API_KEY` | OpenAI API key for AI agents | *(optional)* |
| `OPENAI_MODEL` | Model to use | `gpt-4` |
| `CLIENT_URL` | Frontend URL (CORS allowlist) | `http://localhost:5173` |
| `UPLOAD_DIR` | Directory for file uploads | `./uploads` |
| `MAX_FILE_SIZE` | Maximum upload file size | `52428800` (50 MB) |

<details>
<summary>OAuth & Social Platform Keys</summary>

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `INSTAGRAM_APP_ID` | Instagram app ID |
| `YOUTUBE_CLIENT_ID` | YouTube client ID |
| `TIKTOK_CLIENT_KEY` | TikTok client key |
| `TWITTER_CLIENT_ID` / `TWITTER_CLIENT_SECRET` | Twitter/X OAuth 2.0 |
| `LINKEDIN_CLIENT_ID` / `LINKEDIN_CLIENT_SECRET` | LinkedIn OAuth |
| `FACEBOOK_APP_ID` / `FACEBOOK_APP_SECRET` | Facebook app |
| `THREADS_APP_ID` / `THREADS_APP_SECRET` | Threads (Meta) |
| `PINTEREST_APP_ID` / `PINTEREST_APP_SECRET` | Pinterest app |
| `GOOGLE_BUSINESS_CLIENT_ID` / `GOOGLE_BUSINESS_CLIENT_SECRET` | Google Business Profile |

All social platform keys are optional. Connect platforms as needed.

</details>

<details>
<summary>Payment & Billing Keys</summary>

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (sent to frontend) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `RAZORPAY_KEY_ID` | Razorpay key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay key secret |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay webhook signing secret |

</details>

<details>
<summary>Cloud Import & Storage Keys</summary>

| Variable | Description |
|----------|-------------|
| `GOOGLE_DRIVE_API_KEY` | Google Drive API key |
| `DROPBOX_APP_KEY` | Dropbox app key |
| `CANVA_API_KEY` | Canva API key |
| `S3_ENDPOINT` | S3-compatible storage endpoint |
| `S3_ACCESS_KEY_ID` | S3 access key ID |
| `S3_SECRET_ACCESS_KEY` | S3 secret access key |
| `S3_BUCKET` | S3 bucket name |
| `S3_REGION` | S3 region (`auto` for R2) |
| `S3_PUBLIC_URL` | Public URL prefix for serving files |

When S3 vars are not set, the system uses local disk storage.

</details>

<details>
<summary>Push Notification Keys</summary>

| Variable | Description |
|----------|-------------|
| `VAPID_PUBLIC_KEY` | VAPID public key for web push |
| `VAPID_PRIVATE_KEY` | VAPID private key |
| `VAPID_CONTACT_EMAIL` | Contact email for VAPID |

</details>

---

## Available Scripts

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

## License
