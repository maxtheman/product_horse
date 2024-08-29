SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: file_status; Type: TYPE; Schema: public; Owner: -
--

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


--
-- Name: filetype; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.filetype AS ENUM (
    'video',
    'audio',
    'other'
);


--
-- Name: permissionlevel; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.permissionlevel AS ENUM (
    'PUBLIC',
    'READ',
    'WRITE',
    'ADMIN'
);


--
-- Name: renderstatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.renderstatus AS ENUM (
    'pending',
    'processing',
    'complete',
    'failed'
);


--
-- Name: videotype; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.videotype AS ENUM (
    'video',
    'audio',
    'other'
);


--
-- Name: videovisibility; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.videovisibility AS ENUM (
    'PRIVATE',
    'INTERNAL',
    'PUBLIC'
);


--
-- Name: create_rls_policy(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_rls_policy(table_name text) RETURNS void
    LANGUAGE plpgsql
    AS $$
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
$$;


--
-- Name: create_rls_policy_company(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_rls_policy_company() RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    DROP POLICY IF EXISTS company_policy ON company;
    CREATE POLICY company_policy ON company
    USING (
        id = current_setting('app.current_company_id')::uuid
    );
END;
$$;


--
-- Name: create_video_rls_policy(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_video_rls_policy() RETURNS void
    LANGUAGE plpgsql
    AS $$
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
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: clip; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clip (
    company_id uuid NOT NULL,
    created_by_id uuid NOT NULL,
    fps integer NOT NULL,
    resolution_x integer NOT NULL,
    resolution_y integer NOT NULL,
    speaker_role character varying,
    metadata_to_render character varying,
    video_type public.videotype NOT NULL,
    file_path character varying,
    hide_metadata boolean NOT NULL,
    render_status public.renderstatus NOT NULL,
    id uuid NOT NULL,
    video_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: company; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.company (
    name character varying NOT NULL,
    id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: employee; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee (
    email character varying NOT NULL,
    name character varying NOT NULL,
    permission_level public.permissionlevel NOT NULL,
    id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    company_id uuid NOT NULL,
    hashed_password bytea
);


--
-- Name: file_metadata; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.file_metadata (
    company_id uuid NOT NULL,
    created_by_id uuid NOT NULL,
    user_id uuid NOT NULL,
    file_name character varying NOT NULL,
    file_path character varying NOT NULL,
    frame_rate integer,
    resolution_x integer,
    resolution_y integer,
    duration double precision,
    file_type public.filetype NOT NULL,
    id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    file_status public.file_status DEFAULT 'upload_started'::public.file_status NOT NULL
);


--
-- Name: schema; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schema (
    company_id uuid NOT NULL,
    created_by_id uuid NOT NULL,
    input_text character varying NOT NULL,
    json_schema json,
    id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schema_migrations (
    version character varying(128) NOT NULL
);


--
-- Name: transcription; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transcription (
    company_id uuid NOT NULL,
    created_by_id uuid NOT NULL,
    file_id uuid NOT NULL,
    text character varying NOT NULL,
    id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    embedded boolean
);


--
-- Name: user; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."user" (
    company_id uuid NOT NULL,
    created_by_id uuid NOT NULL,
    name character varying NOT NULL,
    external_id character varying NOT NULL,
    id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: utterance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.utterance (
    company_id uuid NOT NULL,
    created_by_id uuid NOT NULL,
    confidence double precision NOT NULL,
    "end" bigint,
    speaker character varying NOT NULL,
    start bigint,
    text character varying NOT NULL,
    id uuid NOT NULL,
    transcription_id uuid NOT NULL
);


--
-- Name: video; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.video (
    company_id uuid NOT NULL,
    created_by_id uuid NOT NULL,
    title character varying NOT NULL,
    file_path character varying,
    resolution_x integer,
    resolution_y integer,
    fps integer,
    id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    render_status public.renderstatus NOT NULL,
    visibility public.videovisibility NOT NULL
);


--
-- Name: word; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.word (
    company_id uuid NOT NULL,
    created_by_id uuid NOT NULL,
    confidence double precision NOT NULL,
    "end" bigint,
    speaker character varying NOT NULL,
    start bigint,
    text character varying NOT NULL,
    id uuid NOT NULL,
    utterance_id uuid NOT NULL
);


--
-- Name: wordcliplink; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wordcliplink (
    word_id uuid NOT NULL,
    clip_id uuid NOT NULL
);


--
-- Name: clip clip_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clip
    ADD CONSTRAINT clip_pkey PRIMARY KEY (id);


--
-- Name: company company_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company
    ADD CONSTRAINT company_pkey PRIMARY KEY (id);


--
-- Name: employee employee_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee
    ADD CONSTRAINT employee_pkey PRIMARY KEY (id);


--
-- Name: file_metadata file_metadata_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.file_metadata
    ADD CONSTRAINT file_metadata_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: schema schema_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema
    ADD CONSTRAINT schema_pkey PRIMARY KEY (id);


--
-- Name: transcription transcription_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transcription
    ADD CONSTRAINT transcription_pkey PRIMARY KEY (id);


--
-- Name: user user_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- Name: utterance utterance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utterance
    ADD CONSTRAINT utterance_pkey PRIMARY KEY (id);


--
-- Name: video video_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video
    ADD CONSTRAINT video_pkey PRIMARY KEY (id);


--
-- Name: word word_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.word
    ADD CONSTRAINT word_pkey PRIMARY KEY (id);


--
-- Name: wordcliplink wordcliplink_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wordcliplink
    ADD CONSTRAINT wordcliplink_pkey PRIMARY KEY (word_id, clip_id);


--
-- Name: clip clip_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clip
    ADD CONSTRAINT clip_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(id);


--
-- Name: clip clip_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clip
    ADD CONSTRAINT clip_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.employee(id);


--
-- Name: clip clip_video_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clip
    ADD CONSTRAINT clip_video_id_fkey FOREIGN KEY (video_id) REFERENCES public.video(id);


--
-- Name: employee employee_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee
    ADD CONSTRAINT employee_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(id);


--
-- Name: file_metadata file_metadata_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.file_metadata
    ADD CONSTRAINT file_metadata_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(id);


--
-- Name: file_metadata file_metadata_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.file_metadata
    ADD CONSTRAINT file_metadata_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.employee(id);


--
-- Name: file_metadata file_metadata_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.file_metadata
    ADD CONSTRAINT file_metadata_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id);


--
-- Name: schema schema_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema
    ADD CONSTRAINT schema_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(id);


--
-- Name: schema schema_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema
    ADD CONSTRAINT schema_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.employee(id);


--
-- Name: transcription transcription_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transcription
    ADD CONSTRAINT transcription_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(id);


--
-- Name: transcription transcription_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transcription
    ADD CONSTRAINT transcription_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.employee(id);


--
-- Name: transcription transcription_file_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transcription
    ADD CONSTRAINT transcription_file_id_fkey FOREIGN KEY (file_id) REFERENCES public.file_metadata(id);


--
-- Name: user user_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(id);


--
-- Name: user user_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.employee(id);


--
-- Name: utterance utterance_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utterance
    ADD CONSTRAINT utterance_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(id);


--
-- Name: utterance utterance_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utterance
    ADD CONSTRAINT utterance_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.employee(id);


--
-- Name: utterance utterance_transcription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utterance
    ADD CONSTRAINT utterance_transcription_id_fkey FOREIGN KEY (transcription_id) REFERENCES public.transcription(id);


--
-- Name: video video_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video
    ADD CONSTRAINT video_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(id);


--
-- Name: video video_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.video
    ADD CONSTRAINT video_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.employee(id);


--
-- Name: word word_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.word
    ADD CONSTRAINT word_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.company(id);


--
-- Name: word word_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.word
    ADD CONSTRAINT word_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.employee(id);


--
-- Name: word word_utterance_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.word
    ADD CONSTRAINT word_utterance_id_fkey FOREIGN KEY (utterance_id) REFERENCES public.utterance(id);


--
-- Name: wordcliplink wordcliplink_clip_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wordcliplink
    ADD CONSTRAINT wordcliplink_clip_id_fkey FOREIGN KEY (clip_id) REFERENCES public.clip(id);


--
-- Name: wordcliplink wordcliplink_word_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wordcliplink
    ADD CONSTRAINT wordcliplink_word_id_fkey FOREIGN KEY (word_id) REFERENCES public.word(id);


--
-- Name: clip; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.clip ENABLE ROW LEVEL SECURITY;

--
-- Name: clip clip_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY clip_policy ON public.clip USING ((( SELECT true
   FROM ( SELECT set_config('app.current_company_id'::text, current_setting('app.current_company_id'::text), true) AS set_config) _) AND ( SELECT true
   FROM ( SELECT set_config('app.current_permission_level'::text, current_setting('app.current_permission_level'::text), true) AS set_config) _) AND (company_id = (current_setting('app.current_company_id'::text))::uuid) AND ((current_setting('app.current_permission_level'::text))::public.permissionlevel = ANY (ARRAY['READ'::public.permissionlevel, 'WRITE'::public.permissionlevel, 'ADMIN'::public.permissionlevel]))));


--
-- Name: company company_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY company_policy ON public.company USING ((id = (current_setting('app.current_company_id'::text))::uuid));


--
-- Name: employee; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.employee ENABLE ROW LEVEL SECURITY;

--
-- Name: employee employee_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY employee_policy ON public.employee USING ((( SELECT true
   FROM ( SELECT set_config('app.current_company_id'::text, current_setting('app.current_company_id'::text), true) AS set_config) _) AND ( SELECT true
   FROM ( SELECT set_config('app.current_permission_level'::text, current_setting('app.current_permission_level'::text), true) AS set_config) _) AND (company_id = (current_setting('app.current_company_id'::text))::uuid) AND ((current_setting('app.current_permission_level'::text))::public.permissionlevel = ANY (ARRAY['READ'::public.permissionlevel, 'WRITE'::public.permissionlevel, 'ADMIN'::public.permissionlevel]))));


--
-- Name: file_metadata; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.file_metadata ENABLE ROW LEVEL SECURITY;

--
-- Name: file_metadata file_metadata_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY file_metadata_policy ON public.file_metadata USING ((( SELECT true
   FROM ( SELECT set_config('app.current_company_id'::text, current_setting('app.current_company_id'::text), true) AS set_config) _) AND ( SELECT true
   FROM ( SELECT set_config('app.current_permission_level'::text, current_setting('app.current_permission_level'::text), true) AS set_config) _) AND (company_id = (current_setting('app.current_company_id'::text))::uuid) AND ((current_setting('app.current_permission_level'::text))::public.permissionlevel = ANY (ARRAY['READ'::public.permissionlevel, 'WRITE'::public.permissionlevel, 'ADMIN'::public.permissionlevel]))));


--
-- Name: schema; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.schema ENABLE ROW LEVEL SECURITY;

--
-- Name: schema schema_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY schema_policy ON public.schema USING ((( SELECT true
   FROM ( SELECT set_config('app.current_company_id'::text, current_setting('app.current_company_id'::text), true) AS set_config) _) AND ( SELECT true
   FROM ( SELECT set_config('app.current_permission_level'::text, current_setting('app.current_permission_level'::text), true) AS set_config) _) AND (company_id = (current_setting('app.current_company_id'::text))::uuid) AND ((current_setting('app.current_permission_level'::text))::public.permissionlevel = ANY (ARRAY['READ'::public.permissionlevel, 'WRITE'::public.permissionlevel, 'ADMIN'::public.permissionlevel]))));


--
-- Name: transcription; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.transcription ENABLE ROW LEVEL SECURITY;

--
-- Name: transcription transcription_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY transcription_policy ON public.transcription USING ((( SELECT true
   FROM ( SELECT set_config('app.current_company_id'::text, current_setting('app.current_company_id'::text), true) AS set_config) _) AND ( SELECT true
   FROM ( SELECT set_config('app.current_permission_level'::text, current_setting('app.current_permission_level'::text), true) AS set_config) _) AND (company_id = (current_setting('app.current_company_id'::text))::uuid) AND ((current_setting('app.current_permission_level'::text))::public.permissionlevel = ANY (ARRAY['READ'::public.permissionlevel, 'WRITE'::public.permissionlevel, 'ADMIN'::public.permissionlevel]))));


--
-- Name: user; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public."user" ENABLE ROW LEVEL SECURITY;

--
-- Name: user user_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_policy ON public."user" USING ((( SELECT true
   FROM ( SELECT set_config('app.current_company_id'::text, current_setting('app.current_company_id'::text), true) AS set_config) _) AND ( SELECT true
   FROM ( SELECT set_config('app.current_permission_level'::text, current_setting('app.current_permission_level'::text), true) AS set_config) _) AND (company_id = (current_setting('app.current_company_id'::text))::uuid) AND ((current_setting('app.current_permission_level'::text))::public.permissionlevel = ANY (ARRAY['READ'::public.permissionlevel, 'WRITE'::public.permissionlevel, 'ADMIN'::public.permissionlevel]))));


--
-- Name: utterance; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.utterance ENABLE ROW LEVEL SECURITY;

--
-- Name: utterance utterance_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY utterance_policy ON public.utterance USING ((( SELECT true
   FROM ( SELECT set_config('app.current_company_id'::text, current_setting('app.current_company_id'::text), true) AS set_config) _) AND ( SELECT true
   FROM ( SELECT set_config('app.current_permission_level'::text, current_setting('app.current_permission_level'::text), true) AS set_config) _) AND (company_id = (current_setting('app.current_company_id'::text))::uuid) AND ((current_setting('app.current_permission_level'::text))::public.permissionlevel = ANY (ARRAY['READ'::public.permissionlevel, 'WRITE'::public.permissionlevel, 'ADMIN'::public.permissionlevel]))));


--
-- Name: video; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.video ENABLE ROW LEVEL SECURITY;

--
-- Name: video video_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY video_policy ON public.video USING ((((company_id = (current_setting('app.current_company_id'::text))::uuid) AND ((current_setting('app.current_permission_level'::text) = 'ADMIN'::text) OR (((current_setting('app.current_permission_level'::text))::public.permissionlevel = 'READ'::public.permissionlevel) AND (visibility <> 'PRIVATE'::public.videovisibility)) OR (created_by_id = (current_setting('app.current_employee_id'::text))::uuid))) OR (visibility = 'PUBLIC'::public.videovisibility)));


--
-- Name: word; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.word ENABLE ROW LEVEL SECURITY;

--
-- Name: word word_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY word_policy ON public.word USING ((( SELECT true
   FROM ( SELECT set_config('app.current_company_id'::text, current_setting('app.current_company_id'::text), true) AS set_config) _) AND ( SELECT true
   FROM ( SELECT set_config('app.current_permission_level'::text, current_setting('app.current_permission_level'::text), true) AS set_config) _) AND (company_id = (current_setting('app.current_company_id'::text))::uuid) AND ((current_setting('app.current_permission_level'::text))::public.permissionlevel = ANY (ARRAY['READ'::public.permissionlevel, 'WRITE'::public.permissionlevel, 'ADMIN'::public.permissionlevel]))));


--
-- PostgreSQL database dump complete
--


--
-- Dbmate schema migrations
--

INSERT INTO public.schema_migrations (version) VALUES
    ('20240829223317'),
    ('20240829224230');
