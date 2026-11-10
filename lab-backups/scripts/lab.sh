#!/usr/bin/env bash
set -euo pipefail
LAB_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
docker_command=(docker)
if [[ -n "${CARPARK_DOCKER_CONTEXT:-}" ]]; then
  docker_command+=(--context "$CARPARK_DOCKER_CONTEXT")
fi
compose=("${docker_command[@]}" compose --project-name carpark-backup-lab --project-directory "$LAB_DIR" --env-file "$LAB_DIR/.env" -f "$LAB_DIR/docker-compose.yml")
action=${1:-help}
shift || true
case "$action" in
  configure)
    python3 "$LAB_DIR/scripts/configure.py"
    ;;
  up)
    "${compose[@]}" up -d --wait db rest
    "${compose[@]}" build tools api
    "${compose[@]}" run --rm -T tools init-demo
    "${compose[@]}" up -d --wait api
    ;;
  import-snapshot)
    "${compose[@]}" up -d --wait db rest
    "${compose[@]}" build tools api
    "${compose[@]}" run --rm -T tools import-snapshot
    "${compose[@]}" up -d --wait api
    ;;
  backup-source)
    "${compose[@]}" run --rm --build -T backup-source
    ;;
  backup-local|restore|verify|selftest|simulate-loss)
    "${compose[@]}" run --rm -T tools "$action" "$@"
    ;;
  demo)
    "$0" up
    "$0" backup-local
    "$0" verify
    "$0" simulate-loss --confirm CARPARK_LAB_ONLY
    "$0" restore
    "$0" verify
    "$0" selftest
    ;;
  status)
    "${compose[@]}" ps
    ;;
  stop)
    "${compose[@]}" stop
    ;;
  *)
    echo 'Uso: scripts/lab.sh configure|up|import-snapshot|demo|backup-local|backup-source|restore [backup-*]|verify [backup-*]|selftest|status|stop'
    ;;
esac
