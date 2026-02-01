-- =====================================================
-- CLEANUP TEST DATA - Full System Reset (v2 - Safe)
-- =====================================================
-- Removes all test data except user accounts and systems
-- Keeps only the fresh v0.5.4 requirement set for testing
-- =====================================================

BEGIN;

-- 1. Clean up audit checklists
DELETE FROM audit_checklist_items;
DELETE FROM audit_checklists;

-- 2. Clean up audits (old schema)
DELETE FROM audits;

-- 3. Clean up projects (new schema)
DELETE FROM projects;

-- 4. Clean up assignments (if exists)
DELETE FROM assignments WHERE true;

-- 5. Clean up notifications (if exists)
DELETE FROM notifications WHERE true;

-- 6. Clean up requirements (keep only the v0.5.4 one)
DELETE FROM requirements 
WHERE norm_source_id != 'ea2708a8-7f19-4fe4-b962-21f2cf17bde6';

-- 7. Clean up old requirement sets (keep only the v0.5.4 one)
DELETE FROM requirement_sets 
WHERE requirement_set_id != 'RS-ea2708a8';

-- 8. Clean up RAW fragments (keep only from our test document)
DELETE FROM raw_norm_fragments
WHERE norm_source_id != 'ea2708a8-7f19-4fe4-b962-21f2cf17bde6';

-- 9. Clean up old norm files (keep only from our test document)
DELETE FROM norm_files
WHERE norm_source_id != 'ea2708a8-7f19-4fe4-b962-21f2cf17bde6';

-- 10. Clean up old norm sources (keep only our test document)
DELETE FROM norm_sources
WHERE id != 'ea2708a8-7f19-4fe4-b962-21f2cf17bde6';

COMMIT;

-- Verify cleanup
SELECT 'Cleanup completed!' as status;
