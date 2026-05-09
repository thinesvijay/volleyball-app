-- Make Teams Pro Player Hub shadow import service-role grants.
-- Run this once in the Supabase SQL editor if the local validator reports:
-- "permission denied for table ... Grant SELECT ... TO service_role"
--
-- This does NOT grant anon access and does NOT create RLS policies.
-- It only lets the service_role key used by local import scripts read/upsert
-- the dev shadow tables while RLS remains enabled.

grant usage on schema public to service_role;

grant select, insert, update on all tables in schema public to service_role;

alter default privileges in schema public
grant select, insert, update on tables to service_role;
