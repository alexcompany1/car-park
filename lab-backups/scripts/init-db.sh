#!/bin/sh
set -eu
export LAB_REST_PASSWORD="$(cat /run/secrets/rest_password)"
export LAB_INSTANCE_ID="$(cat /run/secrets/lab_id)"
psql -X -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<'SQL'
\getenv rest_password LAB_REST_PASSWORD
\getenv lab_id LAB_INSTANCE_ID
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE authenticator LOGIN NOINHERIT PASSWORD :'rest_password';
GRANT anon TO authenticator;
GRANT USAGE ON SCHEMA public TO anon, authenticated;
CREATE SCHEMA lab_meta;
CREATE TABLE lab_meta.guard (id text PRIMARY KEY);
INSERT INTO lab_meta.guard VALUES (:'lab_id');
COMMENT ON DATABASE carpark_lab IS 'CARPARK_BACKUP_LAB_ONLY';
SQL
