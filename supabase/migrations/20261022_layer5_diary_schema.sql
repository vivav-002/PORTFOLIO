-- ==============================================================================
-- PORTFOLIA — LAYER 5: DIARY PUBLIC COLLABORATIVE ARCHIVE SCHEMA
-- Supabase Database Migration & Row Level Security Setup
-- ==============================================================================
-- This migration configures an open, collaborative, anonymous-friendly backend
-- with strict Row Level Security, abuse protections, and cryptographic ownership tokens.
--
-- No sign-in or login is required.
-- ==============================================================================

-- 1. Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create the main diary_entries table
CREATE TABLE IF NOT EXISTS public.diary_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    type TEXT NOT NULL CHECK (type IN ('blog', 'art', 'music', 'guestbook', 'quote')),
    title TEXT,
    author TEXT NOT NULL DEFAULT 'Anonymous Traveler',
    content TEXT,
    tags TEXT[] NOT NULL DEFAULT '{}',
    media_url TEXT,
    media_aspect_ratio TEXT,
    platform TEXT CHECK (platform IN ('spotify', 'youtube', 'other', NULL)),
    external_url TEXT,
    embed_url TEXT,
    cover_url TEXT,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'hidden', 'flagged', 'pending')),
    report_count INTEGER NOT NULL DEFAULT 0,
    edit_token_hash TEXT NOT NULL
);

-- Index for speedy timeline and category queries
CREATE INDEX IF NOT EXISTS idx_diary_entries_type_status_created 
ON public.diary_entries (type, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_diary_entries_status_reports 
ON public.diary_entries (status, report_count);

-- 3. Create the diary_reports table to record community moderation flags
CREATE TABLE IF NOT EXISTS public.diary_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID NOT NULL REFERENCES public.diary_entries(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    reason TEXT NOT NULL CHECK (reason IN ('spam', 'inappropriate', 'harassment', 'copyright', 'other')),
    details TEXT
);

CREATE INDEX IF NOT EXISTS idx_diary_reports_entry_id 
ON public.diary_reports (entry_id);

-- 4. Enable Row Level Security (RLS) on both tables
ALTER TABLE public.diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diary_reports ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for diary_entries
-- Policy: Public can read published entries with low report counts
DROP POLICY IF EXISTS "Public can view published diary entries" ON public.diary_entries;
CREATE POLICY "Public can view published diary entries"
ON public.diary_entries
FOR SELECT
TO anon, authenticated
USING (status = 'published' AND report_count < 3);

-- Policy: Public can insert new entries with strict constraints
DROP POLICY IF EXISTS "Public can insert permitted diary entries" ON public.diary_entries;
CREATE POLICY "Public can insert permitted diary entries"
ON public.diary_entries
FOR INSERT
TO anon, authenticated
WITH CHECK (
    status = 'published'
    AND report_count = 0
    AND length(trim(author)) >= 1
    AND length(trim(author)) <= 60
    AND (title IS NULL OR length(trim(title)) <= 150)
    AND (content IS NULL OR length(trim(content)) <= 6000)
    AND (external_url IS NULL OR length(trim(external_url)) <= 1000)
    AND (media_url IS NULL OR length(trim(media_url)) <= 1000)
    AND edit_token_hash IS NOT NULL
    AND length(edit_token_hash) = 64 -- 64 hex chars for SHA-256
);

-- Deny direct UPDATE and DELETE from anon/authenticated roles.
-- Direct modifications are blocked so no malicious actor can overwrite other entries!
DROP POLICY IF EXISTS "Deny direct public updates" ON public.diary_entries;
DROP POLICY IF EXISTS "Deny direct public deletions" ON public.diary_entries;

-- 6. Column Privileges: Protect the edit_token_hash from public read queries
-- Revoke SELECT on the secret token hash from anonymous visitors:
REVOKE SELECT ON public.diary_entries FROM anon, authenticated;
GRANT SELECT (
    id,
    created_at,
    updated_at,
    type,
    title,
    author,
    content,
    tags,
    media_url,
    media_aspect_ratio,
    platform,
    external_url,
    embed_url,
    cover_url,
    status,
    report_count
) ON public.diary_entries TO anon, authenticated;
GRANT INSERT ON public.diary_entries TO anon, authenticated;

-- 7. RLS Policies for diary_reports
-- Public can submit reports
DROP POLICY IF EXISTS "Public can submit abuse reports" ON public.diary_reports;
CREATE POLICY "Public can submit abuse reports"
ON public.diary_reports
FOR INSERT
TO anon, authenticated
WITH CHECK (
    length(trim(reason)) >= 2
    AND length(trim(reason)) <= 50
    AND (details IS NULL OR length(trim(details)) <= 500)
);

-- Public cannot read abuse reports
DROP POLICY IF EXISTS "Public cannot read abuse reports" ON public.diary_reports;
CREATE POLICY "Public cannot read abuse reports"
ON public.diary_reports
FOR SELECT
TO anon, authenticated
USING (false);

GRANT INSERT ON public.diary_reports TO anon, authenticated;

-- 8. Stored Procedure: Safe Anonymous Deletion via SHA-256 Token
CREATE OR REPLACE FUNCTION public.delete_diary_entry(
    p_id UUID,
    p_token TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_token_hash TEXT;
    v_deleted_count INTEGER;
BEGIN
    IF p_token IS NULL OR length(trim(p_token)) < 16 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid ownership token provided.');
    END IF;

    -- Compute SHA-256 hash of the client's raw token
    v_token_hash := encode(digest(p_token, 'sha256'), 'hex');

    DELETE FROM public.diary_entries
    WHERE id = p_id AND edit_token_hash = v_token_hash;

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

    IF v_deleted_count > 0 THEN
        RETURN jsonb_build_object('success', true, 'message', 'Entry successfully deleted.');
    ELSE
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Token does not match entry author.');
    END IF;
END;
$$;

-- 9. Stored Procedure: Safe Anonymous Editing via SHA-256 Token
CREATE OR REPLACE FUNCTION public.edit_diary_entry(
    p_id UUID,
    p_token TEXT,
    p_title TEXT DEFAULT NULL,
    p_content TEXT DEFAULT NULL,
    p_tags TEXT[] DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_token_hash TEXT;
    v_updated_count INTEGER;
BEGIN
    IF p_token IS NULL OR length(trim(p_token)) < 16 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid ownership token provided.');
    END IF;

    v_token_hash := encode(digest(p_token, 'sha256'), 'hex');

    UPDATE public.diary_entries
    SET 
        title = COALESCE(p_title, title),
        content = COALESCE(p_content, content),
        tags = COALESCE(p_tags, tags),
        updated_at = now()
    WHERE id = p_id AND edit_token_hash = v_token_hash;

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;

    IF v_updated_count > 0 THEN
        RETURN jsonb_build_object('success', true, 'message', 'Entry successfully updated.');
    ELSE
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Token does not match entry author.');
    END IF;
END;
$$;

-- 10. Stored Procedure: Community Reporting with Auto-Hide
CREATE OR REPLACE FUNCTION public.report_diary_entry(
    p_entry_id UUID,
    p_reason TEXT,
    p_details TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_new_count INTEGER;
BEGIN
    -- Record report
    INSERT INTO public.diary_reports (entry_id, reason, details)
    VALUES (p_entry_id, p_reason, p_details);

    -- Increment report count on entry
    UPDATE public.diary_entries
    SET 
        report_count = report_count + 1,
        status = CASE WHEN report_count + 1 >= 3 THEN 'hidden' ELSE status END
    WHERE id = p_entry_id
    RETURNING report_count INTO v_new_count;

    IF v_new_count >= 3 THEN
        RETURN jsonb_build_object('success', true, 'hidden', true, 'message', 'Content flagged and removed from public view.');
    ELSE
        RETURN jsonb_build_object('success', true, 'hidden', false, 'message', 'Report received. Thank you for keeping the community safe.');
    END IF;
END;
$$;

-- 11. Grant execute privileges on RPC functions to public
GRANT EXECUTE ON FUNCTION public.delete_diary_entry(UUID, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.edit_diary_entry(UUID, TEXT, TEXT, TEXT, TEXT[]) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.report_diary_entry(UUID, TEXT, TEXT) TO anon, authenticated;

-- 12. Storage Bucket Setup (Supabase Storage)
-- Note: Create the 'diary-media' bucket in Supabase dashboard or via API
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'diary-media',
    'diary-media',
    true,
    5242880, -- 5 MB cap
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Storage RLS Policies
DROP POLICY IF EXISTS "Public can view diary media" ON storage.objects;
CREATE POLICY "Public can view diary media"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'diary-media');

DROP POLICY IF EXISTS "Public can upload diary media" ON storage.objects;
CREATE POLICY "Public can upload diary media"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (
    bucket_id = 'diary-media'
    AND (storage.foldername(name))[1] = 'art'
);

-- Enable Realtime for diary_entries table
ALTER PUBLICATION supabase_realtime ADD TABLE public.diary_entries;
