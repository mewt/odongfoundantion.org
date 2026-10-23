#!/bin/bash
set -euo pipefail
umask 077
exec 9>/run/odong-backup.lock
flock -n 9 || exit 0
backup_dir=/var/backups/odong/daily-$(date -u +%Y%m%dT%H%M%SZ)
mkdir -p "$backup_dir"
compose=(docker compose --env-file /srv/odong/stack.env -f /srv/odong/source/deploy/compose.yaml)
"${compose[@]}" exec -T db sh -c 'MYSQL_PWD="$(cat /run/secrets/db-root)" exec mariadb-dump -uroot --single-transaction --quick --routines --events --triggers --hex-blob --databases ebikeland_id_nUSaT4X2 blog_odongfoundation_org_glCvkKVT' | gzip > "$backup_dir/databases.sql.gz"
tar -czf "$backup_dir/runtime.tar.gz" -C /srv/odong sites secrets caddy-data caddy-config stack.env source/deploy 2> "$backup_dir/tar-notes.txt" || {
  tar_status=$?
  # GNU tar exit 1 means a file changed during the live archive; keep the
  # warning with the snapshot. Any actual read/write error fails the job.
  [ "$tar_status" -eq 1 ] || exit "$tar_status"
}
gzip -t "$backup_dir/databases.sql.gz" "$backup_dir/runtime.tar.gz"
cd "$backup_dir"
sha256sum databases.sql.gz runtime.tar.gz > SHA256SUMS
touch COMPLETE
python3 - <<'PY'
from pathlib import Path
import shutil
root=Path('/var/backups/odong')
complete=sorted(p for p in root.glob('daily-*') if p.is_dir() and (p/'COMPLETE').is_file())
for folder in complete[:-7]:
    shutil.rmtree(folder)
PY
echo "Verified backup: $backup_dir"
