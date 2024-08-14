-- Connect to the postgres database initially
\c postgres

-- Create a new role for vector_db
CREATE ROLE vector_db_user WITH LOGIN PASSWORD 'your_secure_password';

-- Create the vector_db database
CREATE DATABASE vector_db;

-- Connect to the vector_db database
\c vector_db

-- Create the pgvector extension (if not already created)
CREATE EXTENSION IF NOT EXISTS vector;

-- Grant privileges to the vector_db_user
GRANT ALL PRIVILEGES ON DATABASE vector_db TO vector_db_user;

-- Grant usage on schema public to vector_db_user
GRANT USAGE ON SCHEMA public TO vector_db_user;

-- Grant all privileges on all tables in schema public to vector_db_user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO vector_db_user;

-- Grant all privileges on all sequences in schema public to vector_db_user
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO vector_db_user;

-- Grant create on schema public to vector_db_user
GRANT CREATE ON SCHEMA public TO vector_db_user;

-- Ensure the user can create new tables (for future use)
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO vector_db_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO vector_db_user;

-- Set the owner of the public schema to vector_db_user
ALTER SCHEMA public OWNER TO vector_db_user;