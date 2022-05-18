-- Table: public.registered_users

-- DROP TABLE IF EXISTS public.registered_users;

CREATE TABLE IF NOT EXISTS public.registered_users
(
    id numeric NOT NULL,
    name character varying(256)[] COLLATE pg_catalog."default" NOT NULL,
    token character varying(250)[] COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT registered_users_pkey PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.registered_users
    OWNER to jlemein;
