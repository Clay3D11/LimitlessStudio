#!/usr/bin/env bash

set -Eeuo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
env_file="${script_dir}/.env.production"
compose_file="${script_dir}/compose.production.yml"
backup_dir="${script_dir}/backups"

if [[ ! -f "${env_file}" ]]; then
  echo "Missing ${env_file}" >&2
  exit 1
fi

mkdir -p "${backup_dir}"
umask 077

timestamp="$(date -u +'%Y-%m-%dT%H-%M-%SZ')"
backup_file="${backup_dir}/limitless-visual-${timestamp}.sql.gz"

docker compose \
  --env-file "${env_file}" \
  -f "${compose_file}" \
  exec -T db \
  sh -c 'exec mysqldump --single-transaction --quick --routines --triggers -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"' \
  | gzip -9 > "${backup_file}"

echo "Backup created: ${backup_file}"