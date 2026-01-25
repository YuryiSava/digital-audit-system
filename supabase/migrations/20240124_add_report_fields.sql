-- Add new columns to audit_checklists table for report settings
ALTER TABLE audit_checklists
ADD COLUMN IF NOT EXISTS "contractNumber" TEXT,
ADD COLUMN IF NOT EXISTS "auditorTitle" TEXT,
ADD COLUMN IF NOT EXISTS "companyLogoUrl" TEXT,
ADD COLUMN IF NOT EXISTS "facilityDescription" TEXT,
ADD COLUMN IF NOT EXISTS "reportNotes" TEXT,
ADD COLUMN IF NOT EXISTS "auditorName" TEXT,
ADD COLUMN IF NOT EXISTS "summary" TEXT,
ADD COLUMN IF NOT EXISTS "risks" TEXT,
ADD COLUMN IF NOT EXISTS "recommendations" TEXT;
