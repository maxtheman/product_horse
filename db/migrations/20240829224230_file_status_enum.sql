-- migrate:up
-- Create the file_status enum type
CREATE TYPE public.file_status AS ENUM (
    'upload_started',
    'upload_finished',
    'upload_failed',
    'transcribe_started',
    'transcribe_finished',
    'transcribe_failed',
    'active',
    'deleted',
    'archived'
);

-- Add file_status column to file_metadata table
ALTER TABLE public.file_metadata
ADD COLUMN file_status public.file_status NOT NULL DEFAULT 'upload_started';

-- Update existing rows to have a default value
UPDATE public.file_metadata
SET file_status = 'active'
WHERE file_status IS NULL;


-- migrate:down

