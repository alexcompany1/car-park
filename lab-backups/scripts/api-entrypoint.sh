#!/bin/sh
set -eu
export SUPABASE_PUBLISHABLE_KEY="$(cat /run/secrets/anon_key)"
exec node server.js
