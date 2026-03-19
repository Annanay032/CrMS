# Gas Town + CrMS — Complete Operations Guide

## Platform Overview

**CrMS (Creator Management System)** is an influencer/creator marketing platform that connects social media creators (Instagram, YouTube, TikTok, Twitter/X, LinkedIn, Threads, Bluesky, Facebook, Pinterest, Reddit, Google Business Profile) with brands for campaign collaborations. It features an AI Content Studio, content management, scheduling, analytics, community engagement, AI-powered matching, revenue tracking, a Growth Copilot, unified inbox, public API, RSS feed import, subscription billing (Stripe + Razorpay), cloud media imports (Google Drive, Dropbox, Canva), and 14 specialized GPT-4 agents plus a Studio agent.

### Tech Stack

| Layer | Stack |
|---|---|
| Backend | Node.js, Express 5, TypeScript, Prisma 6, BullMQ, ioredis, OpenAI SDK, Stripe, Razorpay, web-push |
| Frontend | React 19, Vite 8, TypeScript, Ant Design 6, React Router 7, Redux Toolkit (RTK Query), Recharts, SCSS Modules |
| Database | PostgreSQL 16 |
| Cache/Queue | Redis 7 |
| AI | OpenAI GPT-4 (14 specialized agents + Studio agent, with orchestrator, pipelines & NLP routing) |
| Auth | JWT (access + refresh), bcrypt, Passport.js, Google OAuth |
| Containerization | Docker Compose (4 services) |

---

## Gas Town Setup for CrMS

| Config | Value |
|---|---|
| GT Root | `~/gt` |
| Rig | `CrMS` |
| Crew | `annanay` |
| Default Agent | `copilot` |
| Crew Workspace | `~/gt/CrMS/crew/annanay` |
| Remote | `https://github.com/Annanay032/CrMS.git` |

### Available Agents

| Agent | Description |
|---|---|
| `copilot` | GitHub Copilot (default) |
| `claude` | Claude Code |
| `codex` | OpenAI Codex |
| `gemini` | Google Gemini |
| `amp` | Amp agent |
| `auggie` | Auggie agent |
| `cursor` | Cursor agent |
| `omp` | OMP agent |
| `opencode` | OpenCode agent |
| `pi` | Pi agent |

---

## Quick Reference — All GT Commands

### Starting & Connecting

```bash
# Always work from the crew workspace
cd ~/gt/CrMS/crew/annanay

# Mayor (your main coordinator session)
gt mayor start --agent copilot     # Start Mayor
gt mayor attach                    # Attach to running Mayor
gt mayor stop                      # Stop Mayor
gt mayor status                    # Check status
```

### Dispatching Work to Agents

```bash
# Assign work to specific agents (THE key command)
gt sling "task description" --agent claude
gt sling "task description" --agent copilot
gt sling "task description" --agent gemini

# Create and assign a work bead
gt assign "task description"

# Mark work done
gt done

# Close a bead
gt close <bead-id>
```

### Running Multiple Agents in Parallel

```bash
# Spawn polecat (parallel agent session)
gt polecat start --agent claude
gt polecat start --agent gemini
gt polecat start --agent codex

# List all running agents
gt agents

# See what's ready
gt ready

# Track recent activity
gt trail
```

### Monitoring & Diagnostics

```bash
gt feed              # Real-time activity feed
gt status            # Overall town status
gt vitals            # Health dashboard
gt agents            # List active agent sessions
gt doctor            # Run health checks
gt costs             # Show Claude session costs
gt dashboard         # Web dashboard
gt log               # View activity log
gt audit             # Query work history by actor
```

### Work Management (Beads)

```bash
gt bead list         # List all work items
gt show <bead-id>    # Show bead details
gt cat <bead-id>     # Display bead content
gt ready             # Show work ready across town
gt trail             # Recent agent activity
gt orphans           # Find lost polecat work
```

### Merge Queue & Code Integration

```bash
gt mq                        # Merge queue operations
gt refinery start             # Start merge queue processor
gt refinery status            # Check refinery status
gt convoy                     # Track batches of work
gt commit                     # Git commit with agent identity
gt done                       # Signal work ready to merge
```

### Memory & Context

```bash
gt remember "fact about the codebase"    # Store a memory
gt memories                              # List stored memories
gt forget <memory-id>                    # Remove a memory
gt prime                                 # Output role context
gt seance                                # Talk to predecessor sessions
```

### Configuration

```bash
gt config default-agent copilot   # Set default agent
gt config agent list              # List all agents
gt rig list                       # List all rigs
gt info                           # Show GT information
gt whoami                         # Show current identity
```

### Session Management

```bash
gt handoff                   # Hand off to fresh session
gt resume                    # Check for handoff messages
gt cycle                     # Cycle between sessions
gt checkpoint                # Manage session checkpoints
```

### Workflow Formulas

```bash
gt formula list              # List available formulas
gt formula run <name>        # Run a formula workflow
gt mol                       # Agent molecule workflows
gt mountain                  # Stage and launch an epic
```

### Cleanup & Maintenance

```bash
gt cleanup                   # Clean up orphaned processes
gt compact                   # Clean up expired wisps
gt prune-branches            # Remove stale branches
gt release                   # Release stuck issues
gt warrant                   # Manage stuck agents
```

---

## CrMS Continuous Improvement Plan

### Architecture Map

```
┌──────────────────────────────────────────────────────────────┐
│                         CrMS Platform                        │
├──────────────────────────────────────────────────────────────┤
│  UI (React 19 + Vite 8 + SCSS Modules)                       │
│  ├── Auth (Login/Register/OAuth)                              │
│  ├── Dashboard                                               │
│  ├── Content Calendar + Post Creator                          │
│  ├── AI Studio (Compose, Media Lab, Video Lab, AI Copilot,    │
│  │   Templates, Video Analysis) ─ modular compose/ module     │
│  ├── Campaign Management                                     │
│  ├── Creator Discovery                                       │
│  ├── Analytics + Trends                                      │
│  ├── Community Engagement (Unified Inbox)                     │
│  ├── Social Listening + Competitive Intel                     │
│  ├── Revenue (Streams, Brand Deals, Invoices, ROI)             │
│  ├── Growth Copilot                                          │
│  ├── Link-in-Bio Builder                                     │
│  ├── Media Library                                           │
│  ├── AI Assistant                                            │
│  ├── Pricing (public) + Checkout (Stripe/Razorpay)              │
│  └── Settings (Profile, Teams, Usage, Plan & Billing)           │
├──────────────────────────────────────────────────────────────┤
│  API Server (Express 5 + TypeScript)                         │
│  ├── Routes (27): auth, users, content, campaigns, matching, │
│  │   agents, community, dashboard, accounts, ideas,          │
│  │   listening, competitive, teams, startpages, notifications,│
│  │   usage, settings, media, revenue, webhooks, studio, rss,  │
│  │   public-api, subscription, cloud-import                   │
│  ├── Services (33): full business logic layer                  │
│  ├── AI Agents (14 + Studio): content, scheduling, analytics, │
│  │   engagement, trends, matching, growth, publishing,        │
│  │   listening, competitive, campaign, collaboration,         │
│  │   linkinbio + Studio (compose/rewrite/image/intel/video)   │
│  ├── Background Jobs (12): publish, analytics, trends,        │
│  │   listening, competitive, reports, growth, inbox, rss,     │
│  │   recurring-post, token-refresh                            │
│  └── Middleware: auth JWT, validation, error, rate-limit       │
├──────────────────────────────────────────────────────────────┤
│  Data Layer                                                  │
│  ├── PostgreSQL 16 (Prisma ORM, 20 schema files, 40+ models) │
│  └── Redis 7 (sessions, queues, cache)                       │
└──────────────────────────────────────────────────────────────┘
```

### How Gas Town Knows About This Project

Gas Town **does not auto-read this MD file**. This guide is a reference for you to copy-paste commands.

What agents DO read automatically:
- **`gt remember` memories** — stored via the commands below, persisted in the rig
- **`gt prime` context** — outputs role context for the current directory
- **Agent bead context** — when you `gt sling` a task, the bead carries the description

To update what agents know:
```bash
gt remember "new fact about the codebase"
gt memories                                  # verify
gt forget <memory-id>                        # remove outdated ones
```

### Known Gaps (Improvement Backlog)

| # | Gap | Priority | Area |
|---|---|---|---|
| 1 | Platform services are stubs (Instagram, YouTube, TikTok OAuth publish) | HIGH | Server |
| 2 | OAuth flows not fully wired (Passport installed, Google works, social pending) | HIGH | Server |
| 3 | ~~No payment/billing system~~ **DONE** — Stripe (USD) + Razorpay (INR) with webhooks, 14-day trials, subscription lifecycle | ✅ | Server+UI |
| 4 | Agency features minimal (models exist, limited routes/UI) | LOW | Both |
| 5 | Admin dashboard UI is basic | LOW | UI |

### Multi-Agent Improvement Workflows

> **Note:** Sprints 1-4 (design system, core UI pages, page builds, server integrations) are **complete**. The following are remaining improvement areas:

#### Next Sprint: Platform API Integration + Production Hardening

```bash
cd ~/gt/CrMS/crew/annanay

# Wire real social platform APIs
gt sling "Implement Instagram Graph API publish + analytics in platform.service.ts. Wire YouTube Data API v3 for uploads and analytics. Implement TikTok Content Posting API. All behind the existing ConnectedAccount OAuth tokens." --agent claude

# Payment/billing integration - COMPLETED
# Stripe (USD) + Razorpay (INR) are fully wired with:
#   - Checkout sessions, inline Razorpay modal, webhook verification
#   - Subscription lifecycle (trials, activation, cancellation, renewal)
#   - requirePlan() middleware + usePlanGate() hook for feature gating
#   - PricingPage auth-aware CTAs, PlanCard with billing status

# Agency features expansion
gt sling "Build agency dashboard: managed creators table with aggregated analytics, bulk content scheduling, cross-creator performance reports. Extend existing AgencyProfile and AgencyCreator models." --agent gemini
```

### Monitoring Your Agents

```bash
# Watch all agent activity in real-time
gt feed

# Check what's been completed
gt trail

# See all active agents
gt agents

# View work ready for merge
gt ready

# Health check
gt vitals
```

---

## Daily Workflow

```bash
# 1. Navigate to workspace
cd ~/gt/CrMS/crew/annanay

# 2. Start Mayor if not running
gt mayor start --agent copilot

# 3. Check current status
gt status
gt ready

# 4. Dispatch today's work
gt sling "today's task for server" --agent claude
gt sling "today's task for UI" --agent copilot

# 5. Monitor
gt feed
gt trail

# 6. When work is done
gt done
gt mq   # merge queue

# 7. End of day
gt mayor stop
```

## Data Models Quick Reference

| Model | Key Fields |
|---|---|
| User | email, name, role (CREATOR/BRAND/AGENCY/ADMIN), avatarUrl |
| CreatorProfile | bio, niche[], location, languages[], availability |
| CreatorPlatformStats | platform, followers, avgLikes, engagementRate |
| BrandProfile | companyName, industry, targetAudience (JSON), budgetRange |
| ContentPost | platform, type, caption, hashtags, mediaUrls, status, scheduledAt |
| PostAnalytics | impressions, reach, likes, comments, shares, saves, clicks |
| Campaign | title, description, budget, targetNiche[], platforms[], status |
| MatchCriteria | nicheWeight, engagementWeight, followerWeight, etc. |
| CampaignMatch | score, status, scoreBreakdown (JSON), aiReasoning |
| CommunityInteraction | platform, type, content, sentiment, aiReplySuggestion |
| AgentTask | agentType, input, output, tokensUsed, status |
| StartPage | slug, title, links, theme |
| RevenueStream | type, amount, recurring |
| BrandDeal | brand, status (PROSPECT→NEGOTIATING→ACTIVE→COMPLETED), value |
| Invoice | status (DRAFT→SENT→PAID/OVERDUE), amount |
| Subscription | tier, billingCycle, status, currency, providerSubscriptionId, trialEnd |
| PaymentTransaction | subscriptionId, amount, currency, provider, status, invoiceUrl |
| ApiKey | name, scopes, hashedKey |

## API Endpoints Quick Reference

| Route Group | Base Path | Key Endpoints |
|---|---|---|
| Auth | `/api/auth` | register, login, refresh, logout, me |
| Users | `/api/users` | update profile, upsert creator/brand/agency profile |
| Content | `/api/content` | CRUD posts, calendar view, filter by status |
| Campaigns | `/api/campaigns` | CRUD campaigns, my matches, accept/reject match |
| Matching | `/api/matching` | find-creators, get matches, discover creators |
| AI Agents | `/api/agents` | run agent, generate content, optimize schedule, insights, trends |
| Studio | `/api/studio` | compose, rewrite, image/generate, media/suggest, intelligence, video/analyze, video/clip |
| RSS | `/api/rss` | list feeds, subscribe, unsubscribe, toggle auto-import |
| Public API | `/api/public` | API key management, external post/analytics access |

## Security Reminders

- Never embed access tokens in Git remote URLs
- Sanitize all user inputs (Zod validation on all routes)
- OAuth tokens encrypted with AES at app layer
- Rate limiting: 200 req/15min per IP
- JWT access tokens expire in 15 minutes
- Refresh tokens stored in Redis with 7-day TTL
- Use credential helpers instead of plaintext tokens
