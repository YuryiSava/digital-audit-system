ALTER TABLE audit_checklists 
ADD COLUMN IF NOT EXISTS "facilityDescription" TEXT,
ADD COLUMN IF NOT EXISTS "contractNumber" TEXT,
ADD COLUMN IF NOT EXISTS "auditorTitle" TEXT,
ADD COLUMN IF NOT EXISTS "companyLogoUrl" TEXT;