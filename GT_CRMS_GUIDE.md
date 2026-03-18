# Gas Town + CrMS — Complete Operations Guide

## Platform Overview

**CrMS (Creator Management System)** is an influencer/creator marketing platform that connects social media creators (Instagram, YouTube, TikTok) with brands for campaign collaborations. It features content management, scheduling, analytics, community engagement, AI-powered matching, and 6 specialized GPT-4 agents.

### Tech Stack

| Layer | Stack |
|---|---|
| Backend | Node.js, Express 5, TypeScript, Prisma 6.5, BullMQ, ioredis, OpenAI SDK |
| Frontend | React 19, Vite 8, TypeScript, TailwindCSS 4, React Router 7, TanStack Query, Zustand, Recharts |
| Database | PostgreSQL 16 |
| Cache/Queue | Redis 7 |
| AI | OpenAI GPT-4 (6 specialized agents) |
| Auth | JWT (access + refresh), bcrypt |
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
│  UI (React 19 + Vite 8)                                     │
│  ├── Auth (Login/Register)                                   │
│  ├── Dashboard                                               │
│  ├── Content Calendar + Post Creator                         │
│  ├── Campaign Management                                     │
│  ├── Creator Discovery                                       │
│  ├── Analytics + Trends                                      │
│  ├── Community Engagement                                    │
│  ├── AI Assistant                                            │
│  └── Settings                                                │
├──────────────────────────────────────────────────────────────┤
│  API Server (Express 5 + TypeScript)                         │
│  ├── Routes: auth, users, content, campaigns, matching, AI   │
│  ├── Services: auth, user, content, campaign, matching       │
│  ├── AI Agents (6): content, schedule, match, analytics,     │
│  │   engagement, trends                                      │
│  ├── Background Jobs: publish, analytics, trends             │
│  └── Middleware: auth JWT, validation, error, rate-limit     │
├──────────────────────────────────────────────────────────────┤
│  Data Layer                                                  │
│  ├── PostgreSQL 16 (Prisma ORM, 15 models)                  │
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
| 1 | UI pages are skeletal — need polished, production-quality designs | **CRITICAL** | UI |
| 2 | No reusable UI component library (buttons, cards, modals, forms, tables) | **CRITICAL** | UI |
| 3 | No consistent design system (colors, spacing, typography, shadows) | **HIGH** | UI |
| 4 | Platform services are stubs (Instagram, YouTube, TikTok) | HIGH | Server |
| 5 | OAuth flows not wired (Passport installed but unused) | HIGH | Server |
| 6 | No file upload handling (multer not configured) | MEDIUM | Server |
| 7 | No WebSocket/real-time (notifications, community) | MEDIUM | Both |
| 8 | No admin dashboard UI | MEDIUM | UI |
| 9 | No email/notification service | MEDIUM | Server |
| 10 | Trend detection has no real data source | MEDIUM | Server |
| 11 | Seed data incomplete | LOW | Server |
| 12 | Agency features minimal (models exist, no routes/UI) | LOW | Both |
| 13 | No payment/billing system | LOW | Server |
| 14 | dotenv not loaded in entry point | LOW | Server |

### Multi-Agent Improvement Workflows

#### Sprint 1: Design System + Core UI

```bash
cd ~/gt/CrMS/crew/annanay

# Build reusable component library first
gt sling "Create a reusable UI component library in ui/src/components/common/: Button (variants: primary, secondary, outline, ghost, danger; sizes: sm, md, lg), Card (with header, body, footer slots), Modal (with overlay, close button, sizes), Input (with label, error, helper text), Select, Textarea, Badge (status colors), Avatar, Spinner, EmptyState, Tooltip. Use TailwindCSS 4, export all from index.ts. Every component must accept className prop for overrides." --agent claude

# Design tokens and layout system
gt sling "Create design system in ui/src/styles/: design-tokens.css with CSS variables for colors (brand, neutral, success, warning, error), spacing scale, font sizes, border radius, shadows, transitions. Create AppLayout component with responsive sidebar navigation (collapsible), top header bar with user avatar+dropdown, breadcrumbs, and main content area. Create PageHeader component with title, description, and action buttons slot. All using TailwindCSS 4." --agent copilot

# Fix server foundation
gt sling "Fix dotenv loading in server/src/index.ts, complete seed.ts with realistic demo data for all 15 Prisma models: 5 creators with platform stats, 3 brands with campaigns, sample content posts across statuses, campaign matches with score breakdowns, community interactions." --agent gemini
```

#### Sprint 2: Page Builds (UI-Heavy)

```bash
# Dashboard — the hero page
gt sling "Build polished Dashboard page using reusable components: stat cards grid (total followers, engagement rate, posts this month, active campaigns), Recharts line chart for follower growth, bar chart for engagement by platform, recent posts list with status badges, upcoming scheduled posts, top performing content cards. Responsive grid layout, loading skeletons, empty states." --agent claude

# Content management pages
gt sling "Build polished Content Calendar page: monthly calendar grid with posts shown as colored dots/cards by platform, click to view post detail in a slide-over panel. Build Create/Edit Post form: platform selector with preview mockup (IG post, YT thumbnail, TT video), rich caption editor with character count, hashtag suggestions, media upload dropzone, schedule date picker, draft/publish actions. Use react-hook-form + zod." --agent copilot

# Campaign & Discovery pages
gt sling "Build polished Campaigns page: campaign list with status filters (tabs: active, draft, completed), campaign cards showing budget, niche tags, matched creators count, progress bar. Campaign detail page with matched creators table (score, breakdown radar chart, accept/reject). Build Discover page: creator search with filters sidebar (niche, platform, follower range, engagement rate, location), creator cards grid with avatar, stats, niche tags, view profile action." --agent gemini
```

#### Sprint 3: Remaining Pages + Server Features

```bash
# Analytics + Trends pages
gt sling "Build polished Analytics page: date range selector, KPI cards row (impressions, reach, engagement, clicks), Recharts area chart for metrics over time, platform breakdown pie chart, top posts table with thumbnails and metrics, growth rate indicator. Build Trends page: trending topics cards with relevance score bars, trending audio/hashtags lists, content opportunity suggestions with urgency badges." --agent claude

# Community + AI Assistant pages
gt sling "Build polished Community page: interaction feed (comments, DMs, mentions) with sentiment color coding, AI reply suggestions shown as expandable cards with one-click copy, filter by platform/type/sentiment, unread count badges. Build AI Assistant page: chat-like interface with prompt input, agent type selector dropdown, response cards with markdown rendering, history sidebar." --agent copilot

# Server integrations
gt sling "Wire up Passport Google OAuth strategy with callback routes. Implement Instagram Graph API integration in platform.service.ts (publish post, get analytics, get comments). Add multer middleware for media uploads with file validation and size limits. Add Socket.io for real-time notifications on new matches, comments, and campaign updates." --agent gemini
```

#### Sprint 4: Polish + Advanced Features

```bash
# Settings + Auth pages polish
gt sling "Build polished Settings page: tabbed layout (Profile, Connected Accounts, Notifications, Security). Profile tab with avatar upload, bio editor, niche tag selector. Connected Accounts tab showing OAuth status per platform with connect/disconnect buttons. Polish Login/Register pages with split layout (form left, hero image right), social login buttons, form validation feedback." --agent claude

# Admin + Agency
gt sling "Build admin dashboard: user management data table with search/sort/pagination, campaign oversight with status pipeline view, platform health status cards, agent task audit log with filters. Build agency management pages: managed creators table, add/remove creators, aggregate analytics across managed creators." --agent copilot

# Remaining server features
gt sling "Implement YouTube Data API v3 and TikTok API integrations in platform.service.ts. Add Nodemailer with email templates for: welcome, campaign invitation, match notification, weekly digest. Wire trend detection to real platform trending APIs where available." --agent gemini
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

## API Endpoints Quick Reference

| Route Group | Base Path | Key Endpoints |
|---|---|---|
| Auth | `/api/auth` | register, login, refresh, logout, me |
| Users | `/api/users` | update profile, upsert creator/brand/agency profile |
| Content | `/api/content` | CRUD posts, calendar view, filter by status |
| Campaigns | `/api/campaigns` | CRUD campaigns, my matches, accept/reject match |
| Matching | `/api/matching` | find-creators, get matches, discover creators |
| AI Agents | `/api/agents` | run agent, generate content, optimize schedule, insights, trends |

## Security Reminders

- Never embed access tokens in Git remote URLs
- Sanitize all user inputs (Zod validation on all routes)
- OAuth tokens encrypted with AES at app layer
- Rate limiting: 200 req/15min per IP
- JWT access tokens expire in 15 minutes
- Refresh tokens stored in Redis with 7-day TTL
- Use credential helpers instead of plaintext tokens
