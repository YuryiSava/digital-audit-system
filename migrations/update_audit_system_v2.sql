-- Migration: Update Audit System for Report Settings and Photo Evidence
-- Version: 0.4.0

-- 1. Update audit_checklists table with report metadata and narrative fields
ALTER TABLE audit_checklists 
ADD COLUMN IF NOT EXISTS "summary" TEXT,
ADD COLUMN IF NOT EXISTS "risks" TEXT,
ADD COLUMN IF NOT EXISTS "recommendations" TEXT,
ADD COLUMN IF NOT EXISTS "auditorName" TEXT,
ADD COLUMN IF NOT EXISTS "auditorTitle" TEXT,
ADD COLUMN IF NOT EXISTS "facilityDescription" TEXT,
ADD COLUMN IF NOT EXISTS "contractNumber" TEXT,
ADD COLUMN IF NOT EXISTS "companyLogoUrl" TEXT;

-- 2. Ensure audit_results has the photos array column
ALTER TABLE audit_results
ADD COLUMN IF NOT EXISTS "photos" TEXT[] DEFAULT '{}';

-- 3. Update status constraints for audit_results if necessary
-- Note: Using check constraints or just trusting the app logic. 
-- For Supabase, we usually just ensure the column exists.

-- 4. Create storage bucket for evidence if not exists (Note: This usually needs to be done via Supabase UI or API, 
-- but we can add the policy SQL here if the bucket is created)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('audit-evidence', 'audit-evidence', true) ON CONFLICT DO NOTHING;

-- 5. Storage Policies for audit-evidence bucket
-- Allow public read access
CREATE POLICY "Public Read Access" ON storage.objects FOR SELECT USING (bucket_id = 'audit-evidence');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'audit-evidence' AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update their own uploads (or all for engineers)
CREATE POLICY "Authenticated Update" ON storage.objects FOR UPDATE USING (
  bucket_id = 'audit-evidence' AND auth.role() = 'authenticated'
);
