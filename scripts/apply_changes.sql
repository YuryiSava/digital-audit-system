-- ==============================================================================
-- 1. SETUP STORAGE FOR AUDIT EVIDENCE (PHOTOS)
-- ==============================================================================

-- Create the bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('audit-evidence', 'audit-evidence', true)
on conflict (id) do nothing;

-- Allow public read access to the bucket
create policy "Public Access Details"
  on storage.objects for select
  using ( bucket_id = 'audit-evidence' );

-- Allow authenticated users to upload files
create policy "Authenticated Uploads Details"
  on storage.objects for insert
  with check ( bucket_id = 'audit-evidence' );


-- ==============================================================================
-- 2. UPDATE DATABASE SCHEMA
-- ==============================================================================

-- Add 'photos' column to audit_results to store array of image URLs
alter table audit_results 
add column if not exists photos jsonb default '[]'::jsonb;

-- Add narrative fields to audit_checklists for the final report
alter table audit_checklists 
add column if not exists summary text,
add column if not exists risks text,
add column if not exists recommendations text,
add column if not exists auditorName text;
