-- Fix for "structure of query does not match function result type"
-- This migration robustifies the audit logging triggers and makes them self-contained.
-- Date: 2026-02-03

-- 1. Drop problematic function
DROP FUNCTION IF EXISTS get_audit_user_context();

-- 2. Rewrite audit_trigger_func to be self-contained and robust
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id uuid;
    v_user_email text;
    v_ip_address inet;
    v_record_id text;
BEGIN
    -- Capture user context safely without external function calls
    BEGIN
        v_user_id := auth.uid();
        v_user_email := (SELECT email FROM auth.users WHERE id = v_user_id LIMIT 1);
        v_ip_address := inet_client_addr();
    EXCEPTION WHEN OTHERS THEN
        v_user_id := NULL;
        v_user_email := 'system-error';
    END;
    
    -- Capture Record ID
    IF TG_OP = 'DELETE' THEN
        v_record_id := OLD.id::text;
    ELSE
        v_record_id := NEW.id::text;
    END IF;
    
    -- Perform Logging inside a sub-block to prevent any audit failure from blocking the main data operation
    BEGIN
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
            CASE WHEN TG_OP IN ('DELETE', 'UPDATE') THEN to_jsonb(OLD) ELSE NULL END,
            CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
            v_ip_address
        );
    EXCEPTION WHEN OTHERS THEN
        -- Log warning to DB log but allow main operation to succeed
        RAISE WARNING 'Audit logging failed for table %: %', TG_TABLE_NAME, SQLERRM;
    END;
    
    -- Always return NEW (or OLD) to ensure the original DML operation completes
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
