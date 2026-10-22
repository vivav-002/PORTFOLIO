# PORTFOLIA — Production Deployment Guide

This guide describes how to deploy the PORTFOLIA website with its collaborative Layer 5 Diary.

## Hosting Options (Static Frontend)

PORTFOLIA is a fast, static web application that requires zero server build steps. It can be hosted for free on any modern web host:

### Option A: Vercel (Recommended)
1. Push your repository to GitHub / GitLab / Bitbucket.
2. Sign in to [Vercel](https://vercel.com) and click **Add New Project**.
3. Select your repository.
4. Leave build settings as default (Framework: Other, Build Command: None, Output Directory: `./`).
5. Click **Deploy**.

### Option B: Netlify
1. Go to [Netlify](https://netlify.com) and click **Add new site** → **Import an existing project**.
2. Select your repository.
3. Publish directory: `.`
4. Click **Deploy Site**.

### Option C: GitHub Pages
1. In your repository on GitHub, go to **Settings** → **Pages**.
2. Under **Build and deployment**, select **Deploy from a branch**.
3. Select `master` (or `main`) branch and root `/`.
4. Click **Save**.

---

## Connecting the Shared Supabase Backend

Once the frontend is deployed or running locally:

1. Follow the steps in [`supabase/README.md`](../supabase/README.md) to initialize your free database and run the schema migration in `supabase/migrations/20261022_layer5_diary_schema.sql`.
2. Add your Supabase `URL` and `anon` key to `layer5-diary/supabase-config.js`.
3. Commit and push the changes.

## Security Audit Summary

| Protection | Implementation |
|---|---|
| **No Passwords / Login Required** | All public visitors can contribute without accounts. |
| **Anonymous Edit / Delete Ownership** | Client creates 256-bit unguessable tokens; DB stores only SHA-256 hash. `REVOKE SELECT (edit_token_hash)` ensures no leakage. Direct table modifications blocked; RPC verifies hash. |
| **Row Level Security (RLS)** | `anon` SELECT allowed only for `status = 'published'` AND `report_count < 3`. Direct UPDATE / DELETE revoked. |
| **Spam / Bot Protection** | Invisible honeypot field (`website_url`), 12-second client-side submission cooldown. |
| **XSS Prevention** | Visitor-submitted texts are parsed and rendered via strict DOM text nodes and `textContent`. No raw `innerHTML` evaluation. |
| **Media Safeguards** | Restricted to image MIME types up to 5MB max file size. |
| **Community Reporting** | Items accumulating 3 community reports are automatically hidden from public feed. |
