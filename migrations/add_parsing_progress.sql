-- Add parsing_details to norm_sources to track progress
ALTER TABLE "norm_sources" 
ADD COLUMN IF NOT EXISTS "parsing_details" JSONB DEFAULT NULL;

-- Example value: { "current": 2, "total": 8, "status": "processing", "message": "Processing chunk 2/8" }
