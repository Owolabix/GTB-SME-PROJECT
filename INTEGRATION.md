# Lynk Assistant + CX-Assistant integration

**Running a separate CX instance?** Copy the patched files listed in [`CX-Assistant/PORT_TO_YOUR_CX.md`](CX-Assistant/PORT_TO_YOUR_CX.md) so dashboard activity shows `sent` after Gemini replies (not `skipped`).

This repo contains two services:

| Service | Folder | Role |
|---------|--------|------|
| **Lynk Assistant** (UI) | repo root | Signup, Instagram OAuth, keyword automations, dashboard |
| **CX-Assistant** (AI bot) | `CX-Assistant/` | Gemini-powered DM replies, session memory, owner follow-ups |

## How they work together

**Automations UI** (Lynk → Automations page) writes rules to Supabase: `automations`, `automation_messages`, `automation_posts`. Both Lynk and CX-Assistant read those tables for the connected `instagram_accounts.user_id`.

### Recommended: Meta webhook → Lynk

1. **Meta webhook** → `https://<your-host>/api/public/webhooks/instagram` (Lynk, port 8080)
2. Lynk runs **keyword automations** first (rules from the Automations UI).
3. Unmatched **DMs** → Lynk forwards to CX-Assistant (`POST /internal/dm`) for Gemini AI.
4. CX-Assistant uses the page token from `instagram_accounts` and catalogue context.

### Also supported: Meta webhook → CX-Assistant directly

If Meta’s callback URL points at CX-Assistant (`/webhook` on port 3000), the same UI rules are applied there first (`CX-Assistant/automations.js`), then AI for unmatched DMs. Use **one** webhook URL in Meta, not both (avoids duplicate replies).

Comment automations work on Lynk’s webhook or CX-Assistant’s webhook (both handle `comments` subscription).

### Owner follow-ups (SME dashboard)

When the AI escalates or records `OWNER_TASK:` lines, CX-Assistant inserts into `owner_follow_ups`. Lynk **Home** lists open items for the merchant’s connected `instagram_accounts.ig_user_id` values. Mark **Done** sets `status` to `done`.

Apply owner_follow_ups RLS migrations through `20260529120000_owner_follow_ups_rls_auth_uid.sql` so the dashboard can read rows whether CX stored `ig_user_id`, your auth user id, or legacy `default`.

## One-time setup

### 1. Supabase

Run migrations in `supabase/migrations/` on your project (includes `20260519120000_cx_assistant_tables.sql` for `sessions`, `products`, `owner_follow_ups`, etc.).

Use the **same** `SUPABASE_URL` and **service role** key in both apps.

### 2. CX-Assistant environment

```bash
cd CX-Assistant
cp .env.example .env
```

Fill in at minimum:

```env
SUPABASE_URL=<same as Lynk>
SUPABASE_SERVICE_ROLE_KEY=<same as Lynk>

AI_API_KEY=<Google Gemini API key>
GENAI_MODEL=gemini-2.5-flash

CX_ASSISTANT_INTERNAL_SECRET=<long random string>

# Optional demo fallback if Instagram not connected via Lynk
PAGE_ACCESS_TOKEN=
```

### 3. Lynk root `.env`

Add (use the **same** internal secret):

```env
CX_ASSISTANT_URL=http://localhost:3000
CX_ASSISTANT_INTERNAL_SECRET=<same secret as CX-Assistant>
```

Keep existing Meta + Supabase vars (`META_APP_SECRET`, `META_WEBHOOK_VERIFY_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY`, etc.).

### 4. Run both services

**One command (recommended):**

```bash
npm run dev:all
```

Or two terminals:

```bash
# Terminal 1 — Lynk UI + Instagram webhook + OAuth server functions
npm run dev

# Terminal 2 — CX-Assistant (Gemini AI for unmatched DMs)
npm run dev:cx
```

Lynk health check (optional, for dev): `GET https://localhost:8080/api/health`

### 5. Meta webhook

Point Meta’s callback to **Lynk** (not CX-Assistant directly):

`https://<ngrok-or-production>/api/public/webhooks/instagram`

Verify token = `META_WEBHOOK_VERIFY_TOKEN` in Lynk `.env`.

Subscribe to **messages** and **comments**.

### 6. Connect Instagram in Lynk

Integrations → Connect account. This stores `ig_user_id` + `access_token` for both Lynk automations and CX-Assistant.

## Testing

| Test | Expected |
|------|----------|
| DM contains automation keyword | Lynk sends fixed reply; CX-Assistant not called |
| DM with no keyword match | Lynk logs `skipped` in Recent activity; CX-Assistant sends AI reply |
| Comment with keyword | Lynk DMs commenter (no CX-Assistant) |

CX-Assistant health: `GET http://localhost:3000/health`

## AISLE Storefront catalogue (recommended)

Merchants manage products in **AISLE**. Lynk and CX-Assistant fetch live catalogue at reply time:

**Endpoint:** `GET https://aisle-sandy.vercel.app/api/storefront/products`  
**Auth:** header `x-api-key: <your key>`  
**Query:** `instagram=<handle>` or `store_id=<uuid>` (at least one required)

### Lynk `.env` (server)

```env
AISLE_STOREFRONT_API_URL=https://aisle-sandy.vercel.app/api/storefront/products
AISLE_API_KEY=your_aisle_chatbot_api_key
VITE_STOREFRONT_ADMIN_URL=https://aisle-sandy.vercel.app
```

Settings → **Product catalogue** calls `GET /api/storefront/catalogue` (authenticated), which looks up the merchant’s connected `@instagram` handle and proxies to AISLE.

### CX-Assistant `.env`

```env
AISLE_STOREFRONT_API_URL=https://aisle-sandy.vercel.app/api/storefront/products
AISLE_API_KEY=your_aisle_chatbot_api_key
```

Use `CX-Assistant/aisleStorefront.js` — **already wired** in `context.js` as the first catalogue source when `AISLE_API_KEY` is set. `bot.js` → `getContext()` → AISLE → Topic 1 → Supabase fallback.

Legacy manual wiring (only if you fork context.js):

```javascript
const { fetchAisleStorefrontProducts, formatAisleCatalogueForPrompt } = require("./aisleStorefront");
```

Legacy env names `STOREFRONT_API_BASE_URL` + `STOREFRONT_API_KEY` also work.

If AISLE is unset, CX-Assistant falls back to Supabase `products` / `faqs` (dev only).

Lynk does **not** include product CRUD — only catalogue status + link to AISLE admin.

## Production

- Deploy Lynk (Cloudflare / Node) with public webhook URL.
- Deploy CX-Assistant (Heroku, Railway, etc. — see `Procfile`) with `CX_ASSISTANT_URL` pointing to it from Lynk.
- Do **not** expose `/internal/dm` publicly without the shared secret.
