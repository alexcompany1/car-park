#!/usr/bin/env python3
"""Crea credenciales exclusivas del laboratorio sin mostrarlas en la terminal."""
import base64
import hashlib
import hmac
import json
import os
from pathlib import Path
import secrets

root = Path(__file__).resolve().parents[1]
os.umask(0o077)
local = root / '.local'
local.mkdir(mode=0o700, exist_ok=True)
os.chmod(local, 0o700)
(local / 'certificates').mkdir(mode=0o700, exist_ok=True)

def secret(name):
    path = local / name
    if not path.exists():
        path.write_text(secrets.token_urlsafe(36))
    os.chmod(path, 0o444)
    return path.read_text().strip()

admin = secret('db_password')
rest = secret('rest_password')
lab_id = secret('lab_id')
jwt_secret = secret('jwt_secret')
encode = lambda data: base64.urlsafe_b64encode(data).rstrip(b'=')
header = encode(b'{"alg":"HS256","typ":"JWT"}')
payload = encode(b'{"role":"anon","iss":"carpark-lab"}')
unsigned = header + b'.' + payload
token = unsigned + b'.' + encode(hmac.new(jwt_secret.encode(), unsigned, hashlib.sha256).digest())
for name, value in {
    'anon_key': token.decode(),
    'rest.conf': f'db-uri = "postgres://authenticator:{rest}@db:5432/carpark_lab"\ndb-schemas = "public"\ndb-anon-role = "anon"\njwt-secret = "{jwt_secret}"\n',
}.items():
    path = local / name
    if not path.exists():
        path.write_text(value)
    os.chmod(path, 0o444)

source = local / 'source-service.conf'
if not source.exists():
    source.write_text('[carpark_source]\nhost=CONFIGURAR_HOST_SUPABASE\nport=5432\ndbname=postgres\nuser=CONFIGURAR_USUARIO_LECTURA\npassword=CONFIGURAR_PASSWORD_LOCALMENTE\nsslmode=verify-full\nsslrootcert=/certificates/supabase-ca.crt\nconnect_timeout=10\n')
os.chmod(source, 0o600)
snapshot = local / 'source-snapshot.json'
if not snapshot.exists():
    snapshot.write_text('{"tables": {}}\n')
os.chmod(snapshot, 0o600)
env = root / '.env'
if not env.exists():
    env.write_text(f'LAB_API_PORT=3101\nLAB_UID={os.getuid()}\nLAB_GID={os.getgid()}\nKEEP_BACKUPS=7\n')
for folder in ('backups', 'logs'):
    path = root / folder
    path.mkdir(mode=0o700, exist_ok=True)
    os.chmod(path, 0o700)
print('Configuración local preparada. Las credenciales están en .local/ y quedan excluidas de Git.')
