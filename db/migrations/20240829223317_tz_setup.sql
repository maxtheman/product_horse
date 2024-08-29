-- migrate:up
CREATE OR REPLACE FUNCTION convert_timestamp_columns_to_timestamptz()
RETURNS void AS $$
DECLARE
    _table RECORD;
    _column RECORD;
    _sql TEXT;
BEGIN
    FOR _table IN 
        SELECT table_schema, table_name 
        FROM information_schema.tables 
        WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
          AND table_type = 'BASE TABLE'
    LOOP
        FOR _column IN 
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = _table.table_schema 
              AND table_name = _table.table_name 
              AND data_type = 'timestamp without time zone'
        LOOP
            _sql := format('ALTER TABLE %I.%I ALTER COLUMN %I TYPE timestamptz USING %I AT TIME ZONE ''UTC''',
                           _table.table_schema, _table.table_name, _column.column_name, _column.column_name);
            EXECUTE _sql;
            RAISE NOTICE 'Converted column % in table %.% to timestamptz', _column.column_name, _table.table_schema, _table.table_name;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

SELECT convert_timestamp_columns_to_timestamptz();

DROP FUNCTION convert_timestamp_columns_to_timestamptz();


-- migrate:down

