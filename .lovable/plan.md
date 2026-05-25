
# Rebrand into Slide — Instagram DM Automation SaaS

Replicate the core product from the Web Prodigies "Slide" video, scoped to: marketing site + dashboard UI + Lovable Cloud auth + automations stored in DB + Instagram OAuth + webhook receiver. No Stripe, no AI generation pipeline. Visual identity stays orange/white.

## What "Slide" does (product recap)

When someone comments on your Instagram post (or DMs a keyword), Slide auto-sends a DM reply (or a follow-up). Creators configure these as **Automations**: pick a trigger (comment keyword / DM keyword), pick a post or "any post", write the reply, toggle on. A webhook from Meta fires on each event; Slide matches it against the user's active automations and sends the DM via the IG Graph API.

## Scope

### 1. Rebrand
- Replace GTCO copy/branding with **Slide** across `index.tsx`, `how-it-works.tsx`, header, footer, logo, dashboard.
- Keep the existing orange/white design tokens in `src/styles.css`.
- New hero: "Automate Instagram DMs that close sales while you sleep."
- Update FAQ + how-it-works to describe IG comment/DM → auto-reply, not GTCO mobile app.

### 2. Marketing routes
- `/` — hero, social proof, feature trio (Comment triggers, DM triggers, Smart routing), pricing teaser, CTA.
- `/how-it-works` — keep, rewrite for IG automation flow.
- `/pricing` *(new)* — 3 tiers (Free / Pro / Business), visual only.
- `/login`, `/signup` *(new)* — Lovable Cloud email + Google.

### 3. Auth (Lovable Cloud)
- Enable Lovable Cloud.
- Email/password + Google sign-in.
- `profiles` table (id ↔ auth.users, full_name, avatar_url) auto-created via trigger.
- `_authenticated` layout route guards `/dashboard` and child routes.

### 4. Database schema
```text
profiles(id pk → auth.users, full_name, avatar_url, created_at)

instagram_accounts(
  id, user_id → auth.users, ig_user_id, username,
  access_token, token_expires_at, connected_at
)

automations(
  id, user_id, name, status (draft|active|paused),
  trigger_type (comment|dm),
  keywords text[],                  -- match any
  post_scope (all|specific),
  created_at, updated_at
)

automation_posts(automation_id, ig_post_id)   -- when scope=specific

automation_messages(
  id, automation_id, order int,
  body text, delay_seconds int
)

dm_events(
  id, user_id, automation_id, ig_event_id unique,
  trigger_payload jsonb, status (sent|failed|skipped),
  error text, created_at
)
```
RLS on every table: owner-only via `auth.uid() = user_id`. `dm_events` write-only from server (webhook uses admin client).

### 5. Dashboard (`/dashboard/*`)
- Sidebar layout with: **Home**, **Automations**, **Integrations**, **Settings**.
- `/dashboard` — KPIs (DMs sent today, active automations, conversion proxy), recent dm_events feed.
- `/dashboard/automations` — list + "New automation" button.
- `/dashboard/automations/$id` — builder: name, trigger picker, keyword chips, post scope, message sequence editor, activate toggle.
- `/dashboard/integrations` — "Connect Instagram" button → IG OAuth flow; shows connected account + disconnect.
- `/dashboard/settings` — profile + sign out.

All data via `createServerFn` with `requireSupabaseAuth`.

### 6. Instagram OAuth + webhook
- Server route `GET /api/auth/instagram` — redirect to Meta OAuth (`instagram_business_basic`, `instagram_business_manage_messages`, `instagram_business_manage_comments`).
- Server route `GET /api/auth/instagram/callback` — exchange code for long-lived token, upsert into `instagram_accounts`.
- Server route `GET/POST /api/public/webhooks/instagram`:
  - `GET` returns `hub.challenge` for Meta verification.
  - `POST` verifies `x-hub-signature-256` (HMAC-SHA256 with `META_APP_SECRET`), parses event, finds matching active automation by user + trigger + keyword, calls IG Graph send-message endpoint, logs to `dm_events`.
- Required secrets (added via secrets tool after user confirms): `META_APP_ID`, `META_APP_SECRET`, `META_WEBHOOK_VERIFY_TOKEN`.

The IG OAuth/webhook config is real, but until the user creates a Meta app and provides the secrets the routes will return clear "not configured" responses — the rest of the app (auth, dashboard CRUD, mock event feed) works without them.

### 7. Out of scope (explicitly)
- Stripe billing — skipped per scope choice.
- AI-generated replies (the video's OpenAI piece) — replies are user-authored.
- Team accounts, Slack alerts, analytics charts beyond basic KPIs.

## File plan

New:
- `src/routes/pricing.tsx`
- `src/routes/login.tsx`, `src/routes/signup.tsx`
- `src/routes/_authenticated.tsx` (guard)
- `src/routes/_authenticated/dashboard.tsx` (move + sidebar layout w/ `<Outlet/>`)
- `src/routes/_authenticated/dashboard.index.tsx`
- `src/routes/_authenticated/dashboard.automations.tsx`
- `src/routes/_authenticated/dashboard.automations.$id.tsx`
- `src/routes/_authenticated/dashboard.integrations.tsx`
- `src/routes/_authenticated/dashboard.settings.tsx`
- `src/routes/api/auth/instagram.ts`
- `src/routes/api/auth/instagram.callback.ts`
- `src/routes/api/public/webhooks/instagram.ts`
- `src/lib/automations.functions.ts`, `src/lib/integrations.functions.ts`
- `src/lib/instagram.server.ts` (token exchange, send-message helpers)
- `src/components/site/SiteHeader.tsx` updates, new `DashboardSidebar.tsx`

Edited:
- `src/routes/index.tsx`, `src/routes/how-it-works.tsx` — rebrand to Slide
- `src/components/site/Logo.tsx`, `SiteFooter.tsx`
- `src/styles.css` — keep palette, add a few tokens if needed

Removed:
- Old `src/routes/dashboard.tsx` (replaced by authenticated subtree)

## Build order
1. Enable Lovable Cloud + create migrations (profiles, instagram_accounts, automations, automation_posts, automation_messages, dm_events) with RLS.
2. Auth: login/signup pages, `_authenticated` guard.
3. Rebrand marketing pages to Slide.
4. Dashboard sidebar + Home + Automations CRUD (server functions).
5. Integrations page + IG OAuth routes (stubbed if secrets missing).
6. Webhook receiver + dm_events logging.
7. QA: build, click through pages, verify RLS, verify webhook GET verification works.

## Open assumptions (will proceed unless you object)
- Meta app credentials added later — I'll wire the routes and prompt for secrets when reaching that step.
- "Visual mock with sample data" applies only to dashboard KPIs/feed when no real IG events exist yet; CRUD is real against the DB.
