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

-- Create RLS policies for each table
CREATE OR REPLACE FUNCTION create_rls_policy(table_name text) RETURNS void AS $$
DECLARE
    fully_qualified_table_name text;
BEGIN
    -- Get the fully qualified table name (including schema)
    SELECT format('%I.%I', schemaname, tablename)
    INTO fully_qualified_table_name
    FROM pg_tables
    WHERE tablename = table_name AND schemaname = current_schema();

    IF fully_qualified_table_name IS NOT NULL THEN
        -- Drop existing policy
        EXECUTE format('DROP POLICY IF EXISTS %I ON %s', table_name || '_policy', fully_qualified_table_name);
        
        -- Create new policy
        EXECUTE format('
            CREATE POLICY %I ON %s
            USING (
                (SELECT TRUE FROM (SELECT set_config(''app.current_company_id'', current_setting(''app.current_company_id''), TRUE)) AS _)
                AND (SELECT TRUE FROM (SELECT set_config(''app.current_permission_level'', current_setting(''app.current_permission_level''), TRUE)) AS _)
                AND company_id = current_setting(''app.current_company_id'')::uuid
                AND current_setting(''app.current_permission_level'')::permissionlevel IN (''READ'', ''WRITE'', ''ADMIN'')
            )
        ', table_name || '_policy', fully_qualified_table_name);
        RAISE NOTICE 'Created policy for table %', fully_qualified_table_name;
    ELSE
        RAISE NOTICE 'Table % does not exist in the current schema', table_name;
    END IF;
END;
$$ LANGUAGE plpgsql;

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

-- Special case for Video table
CREATE OR REPLACE FUNCTION create_video_rls_policy() RETURNS void AS $$
BEGIN
    DROP POLICY IF EXISTS video_policy ON video;
    CREATE POLICY video_policy ON video
    USING (
        (company_id = current_setting('app.current_company_id')::uuid
        AND (
            current_setting('app.current_permission_level') = 'ADMIN'
            OR (current_setting('app.current_permission_level')::permissionlevel = 'READ' AND visibility != 'PRIVATE')
            OR (created_by_id = current_setting('app.current_employee_id')::uuid)
        ))
        OR visibility = 'PUBLIC'
    );
END;
$$ LANGUAGE plpgsql;

SELECT create_video_rls_policy();

-- Special case for Company table
CREATE OR REPLACE FUNCTION create_rls_policy_company() RETURNS void AS $$
BEGIN
    DROP POLICY IF EXISTS company_policy ON company;
    CREATE POLICY company_policy ON company
    USING (
        id = current_setting('app.current_company_id')::uuid
    );
END;
$$ LANGUAGE plpgsql;

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