# CrMS — Deployment & Operations

## Production Docker Images

### API Server (`server/Dockerfile.prod`)

Multi-stage build:
1. **Builder**: Installs deps, generates Prisma client, compiles TypeScript
2. **Production**: Runs as non-root `crms` user, includes healthcheck

```bash
docker build -f server/Dockerfile.prod -t crms-api ./server
```

### Frontend (`ui/Dockerfile.prod`)

Multi-stage build:
1. **Builder**: Installs deps, runs `npm run build`
2. **Production**: nginx:alpine serving static files with security headers, gzip, and API proxy

```bash
docker build -f ui/Dockerfile.prod -t crms-ui ./ui
```

### nginx Configuration (`ui/nginx.conf`)

- Security headers: `X-Frame-Options DENY`, `X-Content-Type-Options nosniff`, `Referrer-Policy`
- Gzip compression for text assets
- 1-year immutable cache for `/assets/` (Vite hashed filenames)
- API proxy: `/api/` → `http://api:3001`
- WebSocket proxy: `/socket.io/` → `http://api:3001`
- SPA fallback: `try_files` → `/index.html`

---

## CI/CD (GitHub Actions)

Pipeline defined in `.github/workflows/ci.yml`:

| Job | Trigger | What it does |
|-----|---------|-------------|
| `ui-lint` | Push/PR | TypeScript type-check + ESLint |
| `server-lint` | Push/PR | Prisma generate + TypeScript type-check |
| `ui-build` | After lint | Vite production build + artifact upload |
| `server-build` | After lint | TypeScript compilation |
| `audit` | Push/PR | `npm audit --audit-level=high` for both workspaces |
| `docker` | Push to `main` | Build production Docker images |

Uses Node 22 with npm caching.

---

## Security

### Helmet CSP

Full Content Security Policy configured in `server/src/index.ts`:
- `defaultSrc`: `'self'`
- `scriptSrc`: `'self'`, `'unsafe-inline'` (for Vite dev)
- `styleSrc`: `'self'`, `'unsafe-inline'`
- `imgSrc`: `'self'`, `data:`, `blob:`, `https:`
- `connectSrc`: `'self'`, client URL, `wss:`, OpenAI API
- `objectSrc`: `'none'`
- `frameAncestors`: `'none'`
- Cross-Origin Embedder Policy disabled (for external images)

### Rate Limiting

Global: 200 requests per 15 minutes.

Per-route limiters in `server/src/middleware/rate-limit.ts`:

| Limiter | Scope | Limit |
|---------|-------|-------|
| `authLimiter` | `/auth` routes | 20 requests / 15 min |
| `aiLimiter` | `/agents`, `/studio` routes | 10 requests / min |
| `uploadLimiter` | `/media`, `/cloud-import` routes | 30 requests / min |

### Authentication

- JWT access tokens (15 min) + refresh token rotation (7 days)
- Refresh tokens stored in Redis (revocable)
- OAuth tokens encrypted at rest with AES-256-GCM (`utils/crypto.ts`)
- API keys hashed with SHA-256 (scoped access)
- Google OAuth via Passport.js

### Middleware Stack

| Middleware | File | Purpose |
|-----------|------|---------|
| `authenticate` | `auth.ts` | JWT verification + user hydration |
| `authorize(...roles)` | `auth.ts` | Role-based access control |
| `requireTeamRole(...roles)` | `auth.ts` | Team role authorization |
| `authenticateApiKey` | `api-key.ts` | SHA-256 API key verification |
| `requirePlan(...tiers)` | `plan-gate.ts` | Subscription tier gating |
| `validate(schema)` | `validate.ts` | Zod request validation |

---

## Background Jobs

15 BullMQ queues with default retry policy: 3 attempts, exponential backoff (30s base), `removeOnComplete: 500`, `removeOnFail: 200`.

| Queue | Schedule | Description |
|-------|----------|-------------|
| `publish` | Every 60s | Publishes scheduled posts via platform APIs. Non-retryable errors skip retries. Falls back to web push notification |
| `first-comment` | On publish (90s delay) | Posts first comment on published videos (5 retries) |
| `analytics` | Every 6 hours | Fetches post analytics from platform APIs, updates creator snapshots |
| `trends` | On-demand | Scans for trending content by niche/platform |
| `listening` | Every 15 min | Polls platforms for brand mentions and keyword matches |
| `competitive` | Daily | Collects competitor metrics and activity |
| `reports` | Every 6 hours | Processes scheduled report generation |
| `growth-daily` | Daily (8 AM) | AI growth recommendations for active creators |
| `inbox-email-poll` | Every 5 min | Polls IMAP email accounts, imports as interactions |
| `recurring-posts` | Every 60s | Clones and schedules next occurrence of recurring posts |
| `rss-import` | Every 30 min | Syncs RSS feeds, imports new items as ideas |
| `token-refresh` | Daily | Refreshes OAuth tokens expiring within 7 days |
| `signal-pipeline` | On mention | Intent analysis → signal scoring → CRM sync |
| `subscription-expiry` | Daily | Checks expired trials/subscriptions, downgrades |
| `cleanup` | Daily | Purges AgentUsageLogs > 90 days, ignored Signals > 30 days |

### Bull Board

Job queue monitoring dashboard available at `/admin/queues`. All 15 queues registered. In production, protect this route with admin authentication.

---

## AI Usage & Cost Tracking

Token costs estimated per model:

| Model | Input (per 1K) | Output (per 1K) |
|-------|---------------|-----------------|
| `gpt-4` | $0.030 | $0.060 |
| `gpt-4o` | $0.005 | $0.015 |
| `gpt-4o-mini` | $0.00015 | $0.0006 |

Usage service (`usage.service.ts`) estimates cost using 60/40 input/output ratio. The Usage page shows: token consumption, remaining budget, agent call count, estimated daily cost, per-agent breakdown, and historical trend chart with dual axes (tokens + cost).

---

## Subscription Tiers

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
| Cloud imports | — | ✓ | ✓ |
| Competitive intel | — | — | ✓ |
| Approval workflows | — | ✓ | ✓ |
| Dedicated support | — | — | ✓ |

### Billing Flow

1. Pricing page (`/pricing`) — accessible with/without auth
2. INR → Razorpay inline checkout; USD → Stripe hosted checkout
3. Webhooks (`/webhooks/stripe`, `/webhooks/razorpay`) verify signatures and activate subscriptions
4. Tier enforced by `requirePlan()` middleware (backend) and `usePlanGate()` hook (frontend)
5. 14-day free trial; users without payment method downgraded to FREE on expiry

---

## File Storage

| Provider | Free Tier | S3-Compatible | Notes |
|----------|-----------|:---:|-------|
| **Cloudflare R2** | 10 GB, 10M reads/mo, zero egress | Yes | Recommended |
| **Backblaze B2** | 10 GB, 1 GB/day egress | Yes | Good alternative |
| **Supabase Storage** | 1 GB | Yes | Includes auth & DB |
| **MinIO** | Self-hosted, unlimited | Yes | Run alongside Docker |

When `S3_*` env vars are not set, the system uses local disk storage (`./uploads`).

---

## Production Checklist

- [ ] Change `JWT_SECRET` and `ENCRYPTION_KEY` to strong random values
- [ ] Set `NODE_ENV=production`
- [ ] Use managed PostgreSQL and Redis
- [ ] Configure OAuth credentials for social platforms
- [ ] Configure Stripe keys for USD billing
- [ ] Configure Razorpay keys for INR billing
- [ ] Create Razorpay plans matching `RAZORPAY_PLAN_MAP` IDs
- [ ] Set VAPID keys for web push notifications
- [ ] Set `OPENAI_API_KEY`
- [ ] Put API behind reverse proxy with TLS (nginx.conf included)
- [ ] Configure S3-compatible storage for production media
- [ ] Protect `/admin/queues` (Bull Board) with admin auth
- [ ] Run `npm audit` and resolve vulnerabilities
- [ ] Consider frontend code-splitting for the production bundle
