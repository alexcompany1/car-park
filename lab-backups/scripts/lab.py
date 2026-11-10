#!/usr/bin/env python3
"""Operaciones del catálogo. Las escrituras usan exclusivamente el destino fijo db."""
import argparse
import configparser
from contextlib import contextmanager
from datetime import datetime, timezone
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
import time
from urllib.request import urlopen
import uuid

TABLES = ('ciudades', 'direcciones', 'zonas', 'plazas', 'dispositivos', 'historico_ocupacion')
BACKUPS = Path('/backups')
SCRIPTS = Path('/lab/scripts')
API = 'http://api:3000/api/sitios'

class LabError(Exception):
    pass

def event(action, **details):
    record = {'time': datetime.now(timezone.utc).isoformat(), 'action': action, **details}
    line = json.dumps(record, ensure_ascii=False)
    with open('/logs/operations.jsonl', 'a', encoding='utf-8') as stream:
        stream.write(line + '\n')
    print(line, flush=True)

def secret(name):
    return Path('/run/secrets', name).read_text().strip()

def pg_environment(source=False):
    env = {key: value for key, value in os.environ.items() if not key.startswith('PG')}
    env.update(PGCONNECT_TIMEOUT='10', PGTZ='UTC', PGCLIENTENCODING='UTF8')
    if source:
        path = Path('/run/secrets/source_service')
        config = configparser.ConfigParser(interpolation=None)
        config.read(path)
        section = config['carpark_source']
        host = section.get('host', '')
        if not (host.endswith('.supabase.co') or host.endswith('.pooler.supabase.com')):
            raise LabError('Configura el host PostgreSQL de Supabase en .local/source-service.conf.')
        if section.get('sslmode') != 'verify-full':
            raise LabError('La conexión de origen debe usar sslmode=verify-full.')
        if section.get('dbname') != 'postgres':
            raise LabError('El origen debe ser la base postgres de Supabase.')
        env.update(PGSERVICEFILE=str(path), PGSERVICE='carpark_source',
                   PGOPTIONS='-c default_transaction_read_only=on -c statement_timeout=300000 -c lock_timeout=10000')
    else:
        env.update(PGHOST='db', PGPORT='5432', PGDATABASE='carpark_lab', PGUSER='lab_admin',
                   PGPASSWORD=secret('db_password'),
                   PGOPTIONS='-c statement_timeout=300000 -c lock_timeout=10000')
    return env

def run(program, args=(), source=False, sql=None):
    result = subprocess.run([program, *args], input=sql, capture_output=True, text=True,
                            env=({key: value for key, value in os.environ.items() if not key.startswith('PG')} if program == 'pg_restore' else pg_environment(source)), timeout=330)
    if result.returncode:
        if 'CARPARK_TEST_ROLLBACK' in result.stderr:
            raise LabError('CARPARK_TEST_ROLLBACK')
        # Los errores de conexión pueden contener credenciales o rutas privadas.
        # El resultado público solo identifica la herramienta que ha fallado.
        raise LabError(f'{program} terminó con código {result.returncode}. Revisa permisos, versión o configuración.')
    return result.stdout

def query(sql, source=False):
    return run('psql', ['-X', '-qAt', '-v', 'ON_ERROR_STOP=1'], source, sql).strip()

def guard():
    result = json.loads(query("SELECT json_build_object('database',current_database(),'marker',shobj_description(oid,'pg_database'),'id',(SELECT id FROM lab_meta.guard)) FROM pg_database WHERE datname=current_database();"))
    if (result['database'], result['marker'], result['id']) != ('carpark_lab', 'CARPARK_BACKUP_LAB_ONLY', secret('lab_id')):
        raise LabError('El destino no tiene la marca de este laboratorio. Operación cancelada.')

@contextmanager
def lock():
    os.umask(0o077)
    with open(BACKUPS / '.operations.lock', 'a') as stream:
        try:
            fcntl.flock(stream, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            raise LabError('Ya hay una copia o restauración en curso.') from None
        yield

def version(source=False):
    value = query('SHOW server_version_num;', source)
    if int(value) // 10000 != 17:
        raise LabError('Este laboratorio requiere PostgreSQL 17 en origen y destino.')
    return int(value)

def checksum(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()

def row_digest(lines):
    payload = ''.join(line + '\n' for line in sorted(lines)).encode()
    return hashlib.sha256(payload).hexdigest()

def inspect_archive(archive):
    # COPY conserva las filas de la misma instantánea que pg_dump. No se mezclan
    # recuentos leídos del servidor en otro instante.
    sql = run('pg_restore', ['--data-only', '--no-owner', '--no-privileges', '--file=-', str(archive)])
    tables = {}
    current = None
    rows = []
    for line in sql.split('\n'):
        match = re.fullmatch(r'COPY public\.([a-z_]+) \(([^)]+)\) FROM stdin;', line)
        if match:
            current = match[1]
            if current not in TABLES or current in tables:
                raise LabError('El archivo contiene una tabla fuera del catálogo permitido.')
            columns = [column.strip() for column in match[2].split(',')]
            if any(not re.fullmatch('[a-z_]+', column) for column in columns):
                raise LabError('Columnas de copia no compatibles.')
            tables[current] = {'columns': columns}
            rows = []
        elif current and line == r'\.':
            tables[current].update(count=len(rows), sha256=row_digest(rows))
            current = None
        elif current:
            rows.append(line)
    if set(tables) != set(TABLES) or any('count' not in item for item in tables.values()):
        raise LabError('La copia no contiene las seis tablas completas del catálogo.')
    toc = run('pg_restore', ['--list', str(archive)])
    foreign_keys = len([line for line in toc.splitlines() if ' FK CONSTRAINT ' in line])
    return tables, foreign_keys

def choose_backup(name):
    if name == 'latest':
        choices = sorted(path for path in BACKUPS.glob('backup-*') if path.is_dir() and not path.is_symlink())
        if not choices:
            raise LabError('No hay copias completas disponibles.')
        name = choices[-1].name
    if not re.fullmatch(r'backup-[a-z0-9-]+', name):
        raise LabError('Indica el nombre de una carpeta backup-* situada en backups/.')
    path = BACKUPS / name
    if path.is_symlink() or path.resolve().parent != BACKUPS.resolve():
        raise LabError('Se rechazó una ruta ajena a backups/.')
    for file in ('archive.dump', 'manifest.json'):
        if not (path / file).is_file() or (path / file).is_symlink():
            raise LabError('La copia está incompleta o contiene enlaces simbólicos.')
    manifest = json.loads((path / 'manifest.json').read_text())
    if manifest.get('format') != 1 or set(manifest.get('tables', {})) != set(TABLES):
        raise LabError('El manifiesto no corresponde al formato del laboratorio.')
    if checksum(path / 'archive.dump') != manifest.get('archive_sha256'):
        raise LabError('La suma SHA-256 no coincide. No se ha iniciado la restauración.')
    tables, keys = inspect_archive(path / 'archive.dump')
    if tables != manifest['tables'] or keys != manifest['foreign_keys']:
        raise LabError('El contenido de la copia no coincide con su manifiesto.')
    return path, manifest

def retention():
    keep = int(os.environ.get('KEEP_BACKUPS', '7'))
    if not 1 <= keep <= 365:
        raise LabError('KEEP_BACKUPS debe estar entre 1 y 365.')
    # Solo se eliminan carpetas con el formato propio y manifiesto verificable.
    for origin in ('local', 'source'):
        copies = sorted(BACKUPS.glob('backup-*-'+origin))
        valid = []
        for path in copies:
            try:
                choose_backup(path.name)
                valid.append(path)
            except (LabError, ValueError):
                continue
        for path in valid[:-keep]:
            shutil.rmtree(path)
            event('retention_removed', backup=path.name)

def backup(source=False):
    if not source:
        guard()
    server = version(source)
    if source and query('SHOW default_transaction_read_only;', True) != 'on':
        raise LabError('La sesión de origen no está en modo de solo lectura.')
    origin = 'source' if source else 'local'
    stamp = datetime.now(timezone.utc).strftime('%Y%m%dt%H%M%S%f')
    name = f'backup-{stamp}-{uuid.uuid4().hex[:8]}-{origin}'
    temporary = Path(tempfile.mkdtemp(prefix='.partial-', dir=BACKUPS))
    try:
        archive = temporary / 'archive.dump'
        args = ['--format=custom', '--no-owner', '--no-privileges', '--strict-names',
                '--enable-row-security', '--lock-wait-timeout=10000', '--file', str(archive)]
        for table in TABLES:
            args.extend(['--table', f'public.{table}'])
        run('pg_dump', args, source)
        tables, keys = inspect_archive(archive)
        if keys != 6:
            raise LabError('El modelo debe contener las seis claves foráneas previstas.')
        manifest = {'format': 1, 'created_at': datetime.now(timezone.utc).isoformat(),
                    'origin': origin, 'scope': list(TABLES), 'server_version_num': server,
                    'archive_sha256': checksum(archive), 'tables': tables, 'foreign_keys': keys}
        (temporary / 'manifest.json').write_text(json.dumps(manifest, indent=2))
        temporary.rename(BACKUPS / name)
        retention()
        event('backup_complete', backup=name, origin=origin,
              counts={table: item['count'] for table, item in tables.items()})
    finally:
        if temporary.exists():
            shutil.rmtree(temporary)

def initialize(snapshot=False):
    guard()
    version()
    if query("SELECT to_regclass('public.plazas') IS NOT NULL;") == 't':
        if snapshot:
            raise LabError('El catálogo ya existe. La importación solo se permite en un laboratorio vacío.')
        event('catalog_kept', note='Se conserva el catálogo existente del laboratorio.')
        return
    sql = 'BEGIN;\n' + (SCRIPTS / 'schema.sql').read_text()
    if snapshot:
        path = Path('/inputs/source-snapshot.json')
        data = json.loads(path.read_text())
        if set(data.get('tables', {})) != set(TABLES):
            raise LabError('La instantánea no contiene exactamente las seis tablas permitidas.')
        for table in TABLES:
            payload = json.dumps(data['tables'][table], ensure_ascii=False).replace("'", "''")
            sql += f"\nINSERT INTO public.{table} OVERRIDING SYSTEM VALUE SELECT * FROM jsonb_populate_recordset(NULL::public.{table}, '{payload}'::jsonb);\n"
        for table in ('ciudades', 'direcciones', 'zonas', 'dispositivos', 'historico_ocupacion'):
            sql += f"SELECT setval(pg_get_serial_sequence('public.{table}','id'),coalesce(max(id),1),max(id) IS NOT NULL) FROM public.{table};\n"
        origin = 'snapshot_catalogo_supabase_por_conector'
    else:
        sql += (SCRIPTS / 'demo.sql').read_text()
        origin = 'datos_ficticios'
    sql += (SCRIPTS / 'post-restore.sql').read_text() + '\nCOMMIT;'
    query(sql)
    event('catalog_initialized', origin=origin)

def restore(name, inject_failure=False):
    guard()
    version()
    path, manifest = choose_backup(name)
    if manifest['server_version_num'] // 10000 != 17:
        raise LabError('Versión de copia incompatible con este laboratorio.')
    sql = '''BEGIN;
DO $$ BEGIN
 IF to_regclass('public.plazas') IS NOT NULL THEN
  EXECUTE 'DROP FUNCTION IF EXISTS public.direccion(public.plazas)';
 END IF;
END $$;
'''
    sql += run('pg_restore', ['--clean', '--if-exists', '--no-owner', '--no-privileges', '--no-tablespaces', '--file=-', str(path / 'archive.dump')])
    sql += (SCRIPTS / 'post-restore.sql').read_text()
    if inject_failure:
        sql += "\nDO $$ BEGIN RAISE EXCEPTION 'CARPARK_TEST_ROLLBACK'; END $$;\n"
    query(sql + '\nCOMMIT;')
    event('restore_complete', backup=path.name, transaction='committed')

def api_rows():
    last = None
    for attempt in range(15):
        try:
            with urlopen(API, timeout=5) as response:
                return json.load(response)['sitios']
        except Exception as error:
            last = error
            time.sleep(1)
    raise LabError('La API del laboratorio no responde correctamente.') from last

def verify(name, with_api=True):
    guard()
    path, manifest = choose_backup(name)
    for table, expected in manifest['tables'].items():
        columns = ','.join(expected['columns'])
        output = run('psql', ['-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '-c', f'COPY (SELECT {columns} FROM public.{table}) TO STDOUT;'])
        lines = output.removesuffix('\n').split('\n') if output else []
        if len(lines) != expected['count'] or row_digest(lines) != expected['sha256']:
            raise LabError(f'Los datos de {table} no coinciden con la copia.')
    keys = int(query("SELECT count(*) FROM pg_constraint WHERE contype='f' AND connamespace='public'::regnamespace;"))
    if keys != manifest['foreign_keys']:
        raise LabError('Las relaciones restauradas no coinciden con la copia.')
    # La prueba queda dentro de una transacción y exige la infracción de la FK.
    query("""BEGIN; DO $$ BEGIN
      BEGIN
       INSERT INTO public.direcciones(ciudad_id,nombre) VALUES (-1,'PRUEBA_FK_LAB');
       RAISE EXCEPTION 'La clave foránea no ha rechazado la dirección';
      EXCEPTION WHEN foreign_key_violation THEN NULL; END;
    END $$; ROLLBACK;""")
    if with_api:
        rows = api_rows()
        states = {'free': 'libre', 'occupied': 'ocupado', 'unknown': 'desconocido', 'reserved': 'reservado', 'offline': 'sin_conexion'}
        data = json.loads(query("SELECT coalesce(json_agg(json_build_object('id',p.id,'estado',p.estado_actual,'direccion',d.nombre) ORDER BY p.id),'[]') FROM public.plazas p JOIN public.direcciones d ON d.id=p.direccion_id;"))
        expected = {row['id']: (states[row['estado']], row['direccion']) for row in data}
        actual = {row['id']: (row['estado'], row['direccion']) for row in rows}
        if actual != expected:
            raise LabError('Los estados o direcciones de la API no coinciden con PostgreSQL.')
    event('verification_passed', backup=path.name, foreign_keys=keys,
          tables=6, api=with_api, plazas=manifest['tables']['plazas']['count'])

def simulate_loss(confirmation):
    if confirmation != 'CARPARK_LAB_ONLY':
        raise LabError('La simulación requiere --confirm CARPARK_LAB_ONLY.')
    guard()
    query('BEGIN; DELETE FROM public.historico_ocupacion; DELETE FROM public.dispositivos; DELETE FROM public.plazas; COMMIT;')
    if api_rows():
        raise LabError('La API aún devuelve registros tras la simulación.')
    event('simulated_loss', plazas=0, api_empty=True)

def selftest(name):
    guard()
    path, manifest = choose_backup(name)
    try:
        with lock():
            raise LabError('El bloqueo ha permitido dos operaciones simultáneas.')
    except LabError as error:
        if str(error) != 'Ya hay una copia o restauración en curso.':
            raise
    event('test_passed', test='operation_lock_rejected_second_holder')
    query("COMMENT ON DATABASE carpark_lab IS 'CARPARK_TEST_INVALID_MARKER';")
    try:
        try:
            restore(path.name)
        except LabError as error:
            if 'no tiene la marca' not in str(error):
                raise
        else:
            raise LabError('La restauración ha aceptado un destino sin marca válida.')
    finally:
        query("COMMENT ON DATABASE carpark_lab IS 'CARPARK_BACKUP_LAB_ONLY';")
    event('test_passed', test='invalid_destination_marker_rejected')
    for invalid in ('../archive.dump', '/etc/passwd'):
        try:
            choose_backup(invalid)
        except LabError:
            continue
        raise LabError('La protección de rutas no ha funcionado.')
    event('test_passed', test='path_traversal_rejected')
    bad = BACKUPS / f'backup-{uuid.uuid4().hex}-corrupt'
    try:
        shutil.copytree(path, bad)
        with (bad / 'archive.dump').open('ab') as stream:
            stream.write(b'CORRUPTED')
        try:
            restore(bad.name)
        except LabError:
            pass
        else:
            raise LabError('Se ha aceptado una copia corrupta.')
    finally:
        if bad.exists():
            shutil.rmtree(bad)
    event('test_passed', test='corrupt_backup_rejected')
    try:
        restore(path.name, inject_failure=True)
    except LabError as error:
        if str(error) != 'CARPARK_TEST_ROLLBACK':
            raise
    else:
        raise LabError('La restauración con fallo inyectado no se ha cancelado.')
    verify(path.name)
    event('test_passed', test='restore_failure_rolled_back')

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=('init-demo','import-snapshot','backup-local','backup-source','restore','verify','simulate-loss','selftest'))
    parser.add_argument('backup', nargs='?', default='latest')
    parser.add_argument('--confirm')
    args = parser.parse_args()
    with lock():
        if args.action in ('init-demo', 'import-snapshot'):
            initialize(args.action == 'import-snapshot')
        elif args.action in ('backup-local', 'backup-source'):
            backup(args.action == 'backup-source')
        elif args.action == 'restore':
            restore(args.backup)
        elif args.action == 'verify':
            verify(args.backup)
        elif args.action == 'simulate-loss':
            simulate_loss(args.confirm)
        else:
            selftest(args.backup)

if __name__ == '__main__':
    try:
        main()
    except (LabError, OSError, ValueError, KeyError, subprocess.TimeoutExpired) as error:
        message = str(error) if isinstance(error, LabError) else 'Operación cancelada. Revisa configuración y permisos locales.'
        event('error', message=message)
        sys.exit(1)
