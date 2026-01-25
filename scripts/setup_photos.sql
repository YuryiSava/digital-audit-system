-- Create a bucket for audit evidence
insert into storage.buckets (id, name, public)
values ('audit-evidence', 'audit-evidence', true)
on conflict (id) do nothing;

-- Add photos column to audit_results if not exists
alter table audit_results add column if not exists photos jsonb default '[]'::jsonb;

-- Policy to allow public access to view (adjust as needed for security)
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'audit-evidence' );

-- Policy to allow authenticated uploads (adjust as needed)
create policy "Authenticated Uploads"
  on storage.objects for insert
  with check ( bucket_id = 'audit-evidence' );
