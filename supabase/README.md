# PORTFOLIA — Layer 5 Shared Backend Setup (Supabase)

This directory contains the production database migrations and configuration policies for **PORTFOLIA Layer 5 (The Collaborative Diary)**.

## Architecture Highlights

1. **Zero Registration / No Logins**:
   - Visitors can read, write thoughts, exhibit artwork, share soundtracks, and leave guestbook entries anonymously.
   - No passwords, emails, OAuth logins, or administrative walls.

2. **Anonymous Ownership via Cryptographic Device Vault**:
   - When a user submits an entry, a 256-bit unguessable random token is generated inside their browser.
   - The token is securely stored only on the author's local device (`localStorage`).
   - The database only receives and stores the one-way **SHA-256 hash** (`edit_token_hash`).
   - Public queries never expose the token hash (`REVOKE SELECT (edit_token_hash)`).
   - Only an author presenting the raw token can edit or delete their entry via PostgreSQL RPC functions `edit_diary_entry` and `delete_diary_entry`.

3. **Row Level Security (RLS)**:
   - `anon` users have `SELECT` access only to published entries with fewer than 3 community reports.
   - `anon` users have constrained `INSERT` access with strict character limits and mandatory token hashes.
   - `anon` users have **NO direct `UPDATE` or `DELETE` permissions** on `diary_entries`. Modifications must execute through security definer stored procedures that verify the token hash.

4. **Community Moderation & Abuse Protections**:
   - When 3 community members report an entry (`report_diary_entry`), the database automatically marks it as `status = 'hidden'`.
   - Hidden entries are filtered from public SELECT queries.
   - Server-level and client-level constraints limit character lengths and prevent payload bloat.
   - Honeypot traps drop automated spam submissions.

5. **Storage Bucket (`diary-media`)**:
   - Public read access for images.
   - File size restricted to 5MB.
   - MIME types restricted to: `image/jpeg`, `image/png`, `image/webp`, `image/gif`.

---

## 3-Step Supabase Setup

### Step 1: Create a Free Project
1. Go to [supabase.com](https://supabase.com) and create a free account.
2. Click **New Project** and choose a name (e.g. `portfolia-diary`).

### Step 2: Run the SQL Migration
1. In your Supabase dashboard, click the **SQL Editor** tab on the left sidebar.
2. Click **New query**.
3. Copy the entire contents of [`migrations/20261022_layer5_diary_schema.sql`](./migrations/20261022_layer5_diary_schema.sql) and paste into the editor.
4. Click **Run**.
   - Tables (`diary_entries`, `diary_reports`), RLS policies, storage bucket (`diary-media`), and stored procedures will be created.

### Step 3: Connect Frontend
1. In Supabase, go to **Project Settings** → **API**.
2. Copy your **Project URL** and the public **`anon` `public` key** (do NOT copy `service_role`).
3. Open `layer5-diary/supabase-config.js` in your project and update:
   ```javascript
   const SUPABASE_CONFIG = {
       URL: "https://your-project-id.supabase.co",
       ANON_KEY: "eyJhbGciOi..."
   };
   ```
4. Save the file. Your portfolio diary is now live, collaborative, and globally synced!
