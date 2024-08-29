-- Set parameters for the current session
SET app.current_company_id = '';
SET app.current_permission_level = '';
SET app.current_employee_id = '';

-- Enable RLS for all tables
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = current_schema()) LOOP
        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = r.tablename
            AND column_name IN ('company_id', 'created_by_id')
        ) THEN
            EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', r.tablename);
        ELSE
            EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', r.tablename);
        END IF;
    END LOOP;
END $$;

-- Apply the function to all tables
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = current_schema()) LOOP
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = r.tablename
        AND column_name = 'company_id'
        AND table_name != 'wordcliplink'
    ) THEN
        PERFORM create_rls_policy(r.tablename);
    ELSE
        RAISE NOTICE 'Table % does not have a company_id column', r.tablename;
    END IF;
    END LOOP;
END $$;

SELECT create_video_rls_policy();
SELECT create_rls_policy_company();

-- Create non-superuser role
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'rls_user') THEN
        EXECUTE format('CREATE ROLE rls_user WITH LOGIN PASSWORD %L', current_setting('app.rls_user_password'));
    ELSE
        EXECUTE format('ALTER ROLE rls_user WITH LOGIN PASSWORD %L', current_setting('app.rls_user_password'));
    END IF;
END
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO rls_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO rls_user;

-- Ensure new tables automatically grant permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO rls_user;

-- -- Add this at the end of your script if you want the user executing this to become an rls_user
-- SET ROLE rls_user;