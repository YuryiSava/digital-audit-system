-- Audit Log System for Data Protection
-- Tracks all critical data modifications
-- Date: 2026-02-01

-- Create audit_log table
CREATE TABLE IF NOT EXISTS audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name text NOT NULL,
    operation text NOT NULL, -- INSERT, UPDATE, DELETE
    record_id text NOT NULL, -- ID of affected record
    user_id uuid REFERENCES auth.users(id),
    user_email text,
    old_data jsonb, -- Previous state (for UPDATE/DELETE)
    new_data jsonb, -- New state (for INSERT/UPDATE)
    ip_address inet,
    user_agent text,
    created_at timestamp DEFAULT now()
);

-- Index for fast queries
CREATE INDEX idx_audit_log_table_name ON audit_log(table_name);
CREATE INDEX idx_audit_log_operation ON audit_log(operation);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);

-- Enable RLS
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "audit_log_select_admin"
ON audit_log FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'ADMIN'
    )
);

-- System can insert (triggers)
CREATE POLICY "audit_log_insert_system"
ON audit_log FOR INSERT
TO authenticated
WITH CHECK (true);

-- Function to capture user context
CREATE OR REPLACE FUNCTION get_audit_user_context()
RETURNS TABLE (
    user_id uuid,
    user_email text,
    ip_address inet
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        auth.uid(),
        (SELECT email FROM auth.users WHERE id = auth.uid()),
        inet_client_addr();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generic audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id uuid;
    v_user_email text;
    v_ip_address inet;
    v_record_id text;
BEGIN
    -- Get user context
    SELECT user_id, user_email, ip_address 
    INTO v_user_id, v_user_email, v_ip_address
    FROM get_audit_user_context();
    
    -- Get record ID (assume 'id' column exists)
    IF TG_OP = 'DELETE' THEN
        v_record_id := OLD.id::text;
    ELSE
        v_record_id := NEW.id::text;
    END IF;
    
    -- Insert audit record
    INSERT INTO audit_log (
        table_name,
        operation,
        record_id,
        user_id,
        user_email,
        old_data,
        new_data,
        ip_address
    ) VALUES (
        TG_TABLE_NAME,
        TG_OP,
        v_record_id,
        v_user_id,
        v_user_email,
        CASE WHEN TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN row_to_json(NEW) ELSE NULL END,
        v_ip_address
    );
    
    -- Return appropriate value
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to critical tables
DROP TRIGGER IF EXISTS audit_norm_sources ON norm_sources;
CREATE TRIGGER audit_norm_sources
    AFTER INSERT OR UPDATE OR DELETE ON norm_sources
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_requirements ON requirements;
CREATE TRIGGER audit_requirements
    AFTER INSERT OR UPDATE OR DELETE ON requirements
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_projects ON projects;
CREATE TRIGGER audit_projects
    AFTER INSERT OR UPDATE OR DELETE ON projects
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_user_profiles ON user_profiles;
CREATE TRIGGER audit_user_profiles
    AFTER INSERT OR UPDATE OR DELETE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Add soft delete columns to critical tables
ALTER TABLE norm_sources ADD COLUMN IF NOT EXISTS deleted_at timestamp;
ALTER TABLE requirements ADD COLUMN IF NOT EXISTS deleted_at timestamp;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deleted_at timestamp;
ALTER TABLE requirement_sets ADD COLUMN IF NOT EXISTS deleted_at timestamp;

-- Create view for active (non-deleted) records
CREATE OR REPLACE VIEW norm_sources_active AS
SELECT * FROM norm_sources WHERE deleted_at IS NULL;

CREATE OR REPLACE VIEW requirements_active AS
SELECT * FROM requirements WHERE deleted_at IS NULL;

CREATE OR REPLACE VIEW projects_active AS
SELECT * FROM projects WHERE deleted_at IS NULL;

-- Summary
DO $$
BEGIN
    RAISE NOTICE '✅ Audit Log System Installed';
    RAISE NOTICE '   - audit_log table created';
    RAISE NOTICE '   - Triggers on: norm_sources, requirements, projects, user_profiles';
    RAISE NOTICE '   - Soft delete columns added';
    RAISE NOTICE '   - Active record views created';
    RAISE NOTICE '';
    RAISE NOTICE '📊 To view audit logs:';
    RAISE NOTICE '   SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 100;';
END $$;
