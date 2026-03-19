/**
 * API Smoke-Test Script
 * ---------------------
 * Logs in as different users and tests every API endpoint.
 * Run: npx tsx server/src/test-api.ts
 *
 * Requires:
 *  - Server running on localhost:3001 (or PORT from env)
 *  - Database seeded (npm run db:seed --workspace=server)
 *  - Redis running
 */

const BASE = process.env.API_BASE ?? 'http://localhost:3001/api';
const THROTTLE_MS = 50; // ms between requests to avoid rate-limiter
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─── Helpers ────────────────────────────────────────────────

let pass = 0;
let fail = 0;
const failures: string[] = [];

async function req(
  method: string,
  path: string,
  opts: { token?: string; body?: unknown; label?: string } = {},
): Promise<{ ok: boolean; status: number; data: any }> {
  const label = opts.label ?? `${method} ${path}`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts.token) headers['Authorization'] = `Bearer ${opts.token}`;

  try {
    await sleep(THROTTLE_MS);
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    const text = await res.text();
    let data: any;
    try { data = JSON.parse(text); } catch { data = text; }

    if (res.ok) {
      pass++;
      console.log(`  ✅ ${label}  (${res.status})`);
    } else {
      fail++;
      const errMsg = typeof data === 'object' ? (data.error || data.message || JSON.stringify(data)) : data;
      console.log(`  ❌ ${label}  (${res.status}) ${errMsg}`);
      failures.push(`${label} → ${res.status} ${errMsg}`);
    }
    return { ok: res.ok, status: res.status, data };
  } catch (e: any) {
    fail++;
    console.log(`  ❌ ${label}  (NETWORK) ${e.message}`);
    failures.push(`${label} → NETWORK ${e.message}`);
    return { ok: false, status: 0, data: null };
  }
}

async function login(email: string, password: string): Promise<string> {
  const r = await req('POST', '/auth/login', { body: { email, password }, label: `LOGIN ${email}` });
  return r.data?.data?.accessToken ?? '';
}

// ─── Test Suites ────────────────────────────────────────────

async function testAuth() {
  console.log('\n── Auth ──────────────────────────────────────');
  // Register a temporary user
  const tempEmail = `smoketest_${Date.now()}@crms.local`;
  const regRes = await req('POST', '/auth/register', {
    body: { email: tempEmail, password: 'TestPass123!', name: 'Smoke Test User', role: 'CREATOR' },
    label: 'POST /auth/register',
  });
  const tempToken = regRes.data?.data?.accessToken;

  // Login
  await req('POST', '/auth/login', { body: { email: 'test@crms.local', password: 'password123' }, label: 'POST /auth/login' });

  // Refresh
  if (regRes.data?.data?.refreshToken) {
    await req('POST', '/auth/refresh', { body: { refreshToken: regRes.data.data.refreshToken }, label: 'POST /auth/refresh' });
  }

  // Me
  if (tempToken) {
    await req('GET', '/auth/me', { token: tempToken, label: 'GET /auth/me' });
    await req('POST', '/auth/logout', { token: tempToken, label: 'POST /auth/logout' });
  }
}

async function testCreator(token: string) {
  console.log('\n── Content (Creator) ─────────────────────────');
  const create = await req('POST', '/content', {
    token,
    body: { platform: 'INSTAGRAM', postType: 'IMAGE', caption: 'Smoke test post', hashtags: ['test'], status: 'DRAFT' },
    label: 'POST /content (create)',
  });
  const postId = create.data?.data?.id;

  await req('GET', '/content/calendar', { token, label: 'GET /content/calendar' });
  await req('GET', '/content/status/DRAFT', { token, label: 'GET /content/status/DRAFT' });

  if (postId) {
    await req('PUT', `/content/${postId}`, { token, body: { caption: 'Updated smoke test' }, label: 'PUT /content/:id' });
    await req('DELETE', `/content/${postId}`, { token, label: 'DELETE /content/:id' });
  }

  console.log('\n── Ideas (Creator) ───────────────────────────');
  const ideaRes = await req('POST', '/ideas', {
    token,
    body: { title: 'Smoke test idea', body: 'Testing idea creation', status: 'SPARK' },
    label: 'POST /ideas',
  });
  const ideaId = ideaRes.data?.data?.id;
  await req('GET', '/ideas', { token, label: 'GET /ideas' });
  if (ideaId) {
    await req('GET', `/ideas/${ideaId}`, { token, label: 'GET /ideas/:id' });
    await req('PUT', `/ideas/${ideaId}`, { token, body: { title: 'Updated idea' }, label: 'PUT /ideas/:id' });
    await req('DELETE', `/ideas/${ideaId}`, { token, label: 'DELETE /ideas/:id' });
  }

  // Tags
  const tagRes = await req('POST', '/ideas/tags', { token, body: { name: 'smoketest', color: '#ff0000' }, label: 'POST /ideas/tags' });
  const tagId = tagRes.data?.data?.id;
  await req('GET', '/ideas/tags/all', { token, label: 'GET /ideas/tags/all' });
  if (tagId) {
    await req('PUT', `/ideas/tags/${tagId}`, { token, body: { name: 'smoketest2' }, label: 'PUT /ideas/tags/:id' });
    await req('DELETE', `/ideas/tags/${tagId}`, { token, label: 'DELETE /ideas/tags/:id' });
  }

  // Templates
  await req('GET', '/ideas/templates/all', { token, label: 'GET /ideas/templates/all' });
  await req('POST', '/ideas/templates', {
    token,
    body: { name: 'Smoke Template', body: 'Test body', category: 'tip' },
    label: 'POST /ideas/templates',
  });

  console.log('\n── Community (Creator) ───────────────────────');
  await req('GET', '/community', { token, label: 'GET /community' });
  await req('GET', '/community/stats', { token, label: 'GET /community/stats' });
  await req('GET', '/community/saved-replies/list', { token, label: 'GET /community/saved-replies' });
  await req('GET', '/community/voice-profile/me', { token, label: 'GET /community/voice-profile/me' });

  console.log('\n── Dashboard ────────────────────────────────');
  await req('GET', '/dashboard/stats', { token, label: 'GET /dashboard/stats' });
  await req('GET', '/dashboard/analytics', { token, label: 'GET /dashboard/analytics' });
  await req('GET', '/dashboard/analytics?period=month', { token, label: 'GET /dashboard/analytics?period=month' });
  await req('GET', '/dashboard/content-types', { token, label: 'GET /dashboard/content-types' });
  await req('GET', '/dashboard/audience', { token, label: 'GET /dashboard/audience' });
  await req('GET', '/dashboard/reports', { token, label: 'GET /dashboard/reports' });

  console.log('\n── Campaigns (as Creator) ───────────────────');
  await req('GET', '/campaigns', { token, label: 'GET /campaigns' });
  await req('GET', '/campaigns/my', { token, label: 'GET /campaigns/my' });

  console.log('\n── Matching (as Creator) ────────────────────');
  await req('GET', '/matching/creators', { token, label: 'GET /matching/creators' });

  console.log('\n── Listening ────────────────────────────────');
  const lqRes = await req('POST', '/listening', {
    token,
    body: { name: 'Smoke query', keywords: ['smoketest'], platforms: ['INSTAGRAM'] },
    label: 'POST /listening',
  });
  const lqId = lqRes.data?.data?.id;
  await req('GET', '/listening', { token, label: 'GET /listening' });
  if (lqId) {
    await req('GET', `/listening/${lqId}`, { token, label: 'GET /listening/:id' });
    await req('GET', `/listening/${lqId}/mentions`, { token, label: 'GET /listening/:id/mentions' });
    await req('GET', `/listening/${lqId}/sentiment/timeline`, { token, label: 'GET /listening/:id/sentiment/timeline' });
    await req('GET', `/listening/${lqId}/sentiment/summary`, { token, label: 'GET /listening/:id/sentiment/summary' });
    await req('PUT', `/listening/${lqId}`, { token, body: { name: 'Updated smoke query' }, label: 'PUT /listening/:id' });
    await req('DELETE', `/listening/${lqId}`, { token, label: 'DELETE /listening/:id' });
  }

  console.log('\n── Competitive ──────────────────────────────');
  const compRes = await req('POST', '/competitive', {
    token,
    body: { name: 'SmokeComp', handles: { INSTAGRAM: '@smokecomp' }, platforms: ['INSTAGRAM'] },
    label: 'POST /competitive',
  });
  const compId = compRes.data?.data?.id;
  await req('GET', '/competitive', { token, label: 'GET /competitive' });
  await req('GET', '/competitive/benchmark', { token, label: 'GET /competitive/benchmark' });
  if (compId) {
    await req('GET', `/competitive/${compId}`, { token, label: 'GET /competitive/:id' });
    await req('GET', `/competitive/${compId}/snapshots`, { token, label: 'GET /competitive/:id/snapshots' });
    await req('PUT', `/competitive/${compId}`, { token, body: { name: 'UpdatedComp' }, label: 'PUT /competitive/:id' });
    await req('DELETE', `/competitive/${compId}`, { token, label: 'DELETE /competitive/:id' });
  }

  console.log('\n── Teams ────────────────────────────────────');
  const teamRes = await req('POST', '/teams', { token, body: { name: 'Smoke Team' }, label: 'POST /teams' });
  const teamId = teamRes.data?.data?.id;
  await req('GET', '/teams', { token, label: 'GET /teams' });
  if (teamId) {
    await req('GET', `/teams/${teamId}`, { token, label: 'GET /teams/:id' });
    await req('PUT', `/teams/${teamId}`, { token, body: { name: 'Updated Smoke Team' }, label: 'PUT /teams/:id' });
    await req('GET', `/teams/${teamId}/calendar`, { token, label: 'GET /teams/:id/calendar' });
    // Workflows
    const wfRes = await req('POST', `/teams/${teamId}/workflows`, {
      token,
      body: { name: 'Smoke WF', stages: [{ name: 'Review', approverRoles: ['OWNER'] }] },
      label: 'POST /teams/:id/workflows',
    });
    await req('GET', `/teams/${teamId}/workflows`, { token, label: 'GET /teams/:id/workflows' });
    if (wfRes.data?.data?.id) {
      await req('DELETE', `/teams/${teamId}/workflows/${wfRes.data.data.id}`, { token, label: 'DELETE /teams/:id/workflows/:wfId' });
    }
    await req('DELETE', `/teams/${teamId}`, { token, label: 'DELETE /teams/:id' });
  }

  console.log('\n── Start Pages ──────────────────────────────');
  // Test public page with seeded data (janecreates is published: true)
  await req('GET', '/startpages/p/janecreates', { label: 'GET /startpages/p/:slug (public, seeded)' });
  await req('GET', '/startpages/check-slug?slug=janecreates', { label: 'GET /startpages/check-slug' });

  const slug = `smoke-${Date.now()}`;
  const spRes = await req('POST', '/startpages', {
    token,
    body: { slug, title: 'Smoke Page', bio: 'Testing', published: true },
    label: 'POST /startpages',
  });
  const spId = spRes.data?.data?.id;
  await req('GET', '/startpages', { token, label: 'GET /startpages' });
  await req('GET', `/startpages/check-slug?slug=${slug}`, { label: 'GET /startpages/check-slug (new)' });
  if (spId) {
    await req('GET', `/startpages/${spId}`, { token, label: 'GET /startpages/:id' });
    await req('GET', `/startpages/${spId}/analytics`, { token, label: 'GET /startpages/:id/analytics' });
    // Add a link
    const linkRes = await req('POST', `/startpages/${spId}/links`, {
      token,
      body: { title: 'Smoke Link', url: 'https://example.com' },
      label: 'POST /startpages/:id/links',
    });
    if (linkRes.data?.data?.id) {
      await req('PUT', `/startpages/${spId}/links/${linkRes.data.data.id}`, {
        token,
        body: { title: 'Updated Link' },
        label: 'PUT /startpages/:id/links/:linkId',
      });
      await req('DELETE', `/startpages/${spId}/links/${linkRes.data.data.id}`, {
        token,
        label: 'DELETE /startpages/:id/links/:linkId',
      });
    }
    await req('DELETE', `/startpages/${spId}`, { token, label: 'DELETE /startpages/:id' });
  }

  console.log('\n── Notifications ────────────────────────────');
  await req('GET', '/notifications', { token, label: 'GET /notifications' });
  await req('PATCH', '/notifications/read-all', { token, label: 'PATCH /notifications/read-all' });

  console.log('\n── Settings ─────────────────────────────────');
  await req('GET', '/settings', { token, label: 'GET /settings' });
  await req('PATCH', '/settings', { token, body: { emailDigest: false }, label: 'PATCH /settings' });

  console.log('\n── Usage ────────────────────────────────────');
  await req('GET', '/usage', { token, label: 'GET /usage' });
  await req('GET', '/usage/history', { token, label: 'GET /usage/history' });

  console.log('\n── Accounts (Social) ────────────────────────');
  await req('GET', '/accounts', { token, label: 'GET /accounts' });

  console.log('\n── Media ────────────────────────────────────');
  await req('GET', '/media/folders', { token, label: 'GET /media/folders' });
  await req('GET', '/media/assets', { token, label: 'GET /media/assets' });

  console.log('\n── Agents (metadata only) ───────────────────');
  await req('GET', '/agents', { token, label: 'GET /agents' });
  await req('GET', '/agents/history', { token, label: 'GET /agents/history' });
}

async function testBrand(token: string) {
  console.log('\n── Campaigns (Brand) ────────────────────────');
  const campRes = await req('POST', '/campaigns', {
    token,
    body: {
      title: 'Smoke Campaign', description: 'API test campaign',
      targetNiche: ['fitness'], targetPlatforms: ['INSTAGRAM'], budget: 1000,
    },
    label: 'POST /campaigns (create)',
  });
  const campId = campRes.data?.data?.id;

  await req('GET', '/campaigns', { token, label: 'GET /campaigns' });
  await req('GET', '/campaigns/discover', { token, label: 'GET /campaigns/discover' });

  if (campId) {
    await req('GET', `/campaigns/${campId}`, { token, label: 'GET /campaigns/:id' });
    await req('PUT', `/campaigns/${campId}`, { token, body: { title: 'Updated Smoke Campaign' }, label: 'PUT /campaigns/:id' });
    await req('PATCH', `/campaigns/${campId}/status`, { token, body: { status: 'ACTIVE' }, label: 'PATCH /campaigns/:id/status' });
    await req('PATCH', `/campaigns/${campId}/stage`, { token, body: { stage: 'RECRUITING' }, label: 'PATCH /campaigns/:id/stage' });
    await req('GET', `/campaigns/${campId}/deliverables`, { token, label: 'GET /campaigns/:id/deliverables' });
    await req('GET', `/campaigns/${campId}/reports`, { token, label: 'GET /campaigns/:id/reports' });
  }

  console.log('\n── Matching (Brand) ─────────────────────────');
  // Find creators for an existing seeded campaign
  const listRes = await req('GET', '/campaigns', { token, label: 'GET /campaigns (for match test)' });
  const firstCampId = listRes.data?.data?.[0]?.id;
  if (firstCampId) {
    await req('POST', '/matching/find-creators', {
      token,
      body: { campaignId: firstCampId },
      label: 'POST /matching/find-creators',
    });
    await req('GET', `/matching/campaigns/${firstCampId}/matches`, { token, label: 'GET /matching/campaigns/:id/matches' });
  }
  await req('GET', '/matching/creators', { token, label: 'GET /matching/creators' });
}

async function testAdmin(token: string) {
  console.log('\n── Admin ────────────────────────────────────');
  await req('GET', '/users', { token, label: 'GET /users (admin)' });
}

async function testUserProfile(token: string) {
  console.log('\n── User Profile ─────────────────────────────');
  await req('PUT', '/users/me', { token, body: { name: 'Test Creator Updated' }, label: 'PUT /users/me' });
  await req('POST', '/users/creator-profile', {
    token,
    body: { niche: ['travel', 'food', 'photography'], bio: 'Updated bio for smoke test' },
    label: 'POST /users/creator-profile',
  });
}

// ─── Main ───────────────────────────────────────────────────

async function main() {
  console.log(`\n🔥 CrMS API Smoke Test\n   Base: ${BASE}\n`);

  // Test auth endpoints
  await testAuth();

  // Login as creator
  const creatorToken = await login('test@crms.local', 'password123');
  if (!creatorToken) {
    console.error('\n💥 Could not login as test@crms.local. Is the DB seeded?');
    process.exit(1);
  }
  await testUserProfile(creatorToken);
  await testCreator(creatorToken);

  // Login as brand
  const brandToken = await login('brand@crms.local', 'password123');
  if (brandToken) await testBrand(brandToken);

  // Login as admin
  const adminToken = await login('admin@crms.local', 'password123');
  if (adminToken) await testAdmin(adminToken);

  // ── Summary ─────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════════');
  console.log(`  ✅ Passed: ${pass}`);
  console.log(`  ❌ Failed: ${fail}`);
  console.log('══════════════════════════════════════════════');
  if (failures.length > 0) {
    console.log('\nFailed endpoints:');
    failures.forEach((f) => console.log(`  • ${f}`));
  }
  console.log('');
  process.exit(fail > 0 ? 1 : 0);
}

main();
