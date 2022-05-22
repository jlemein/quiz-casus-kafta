-- Table: public.registered_users

-- DROP TABLE IF EXISTS public.registered_users;

CREATE TABLE IF NOT EXISTS public.registered_users
(
    id SERIAL PRIMARY KEY,
    name character varying(256) COLLATE pg_catalog."default" NOT NULL,
    token character varying(250) COLLATE pg_catalog."default" NOT NULL
)

TABLESPACE pg_default;

CREATE TABLE IF NOT EXISTS public.questions
(
    id SERIAL PRIMARY KEY,
    title character varying(256) NOT NULL,
    answer_a character varying(256) NOT NULL,
    answer_b character varying(256) NOT NULL,
    answer_c character varying(256) NOT NULL,
    answer_d character varying(256) NOT NULL
)

TABLESPACE pg_default;

CREATE TABLE IF NOT EXISTS public.votes
(
    id SERIAL PRIMARY KEY,
    username character varying(256) NOT NULL, -- references public.registered_users(name),
    question_id INTEGER NOT NULL references public.questions(id),
    vote numeric NOT NULL
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.registered_users
    OWNER to jlemein;