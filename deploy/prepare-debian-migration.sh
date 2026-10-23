#!/bin/bash
# Run on the CURRENT VPS. Creates an off-host-transferable restore bundle.
# No OS changes. WordPress/mail are briefly stopped for a consistent snapshot.
set -Eeuo pipefail
umask 077
script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
usage() {
  cat <<'EOF'
Usage: sudo bash prepare-debian-migration.sh /absolute/new/bundle-directory [--keep-stopped]
Run on the current Docker VPS. Export images first, then briefly stop
WordPress/mail and cron to snapshot files and both databases consistently.
Copy the COMPLETE bundle off this VPS before reinstalling anything.
--keep-stopped keeps WordPress/mail/cron stopped AFTER a successful export
for final cutover. On failure, the script attempts to resume the old services.
EOF
}
[[ ${1:-} != --help && ${1:-} != -h ]] || { usage; exit 0; }
[[ $# -ge 1 && $# -le 2 && $1 == /* && ! -e $1 ]] || { usage >&2; exit 64; }
keep_stopped=false
if [[ $# == 2 ]]; then
  [[ $2 == --keep-stopped ]] || { usage >&2; exit 64; }
  keep_stopped=true
fi
[[ $(uname -s) == Linux && $EUID == 0 ]] || { echo 'Run as root on the existing Linux VPS.' >&2; exit 1; }
[[ -f $script_dir/validate-backup.py ]] || { echo 'Keep validate-backup.py beside this script.' >&2; exit 1; }
bundle=$1
[[ $bundle != /srv/odong/* ]] || { echo 'Bundle must be outside /srv/odong.' >&2; exit 1; }
exec 9>/run/odong-release.lock
flock -n 9 || { echo 'A deployment is running; try later.' >&2; exit 1; }
exec 8>/run/odong-backup.lock
flock -n 8 || { echo 'A backup is running; try later.' >&2; exit 1; }
compose=(docker compose --env-file /srv/odong/stack.env -f /srv/odong/source/deploy/compose.yaml)
services=(edge odong blog ebike db mail)
for service in "${services[@]}"; do
  container=$("${compose[@]}" ps -q "$service")
  [[ -n $container && $(docker inspect -f '{{.State.Running}}' "$container") == true ]] || {
    echo "Service $service must be running before export." >&2; exit 1;
  }
done
[[ -z $(git -C /srv/odong/source status --porcelain --untracked-files=no) ]] || {
  echo 'Commit or reconcile tracked source changes before export.' >&2; exit 1;
}
# umask 077 also protects any intermediate directories.
mkdir -p "$bundle"
git -C /srv/odong/source rev-parse HEAD > "$bundle/source-commit.txt"
python3 - "$bundle/deploy.pub" <<'PY'
from pathlib import Path
import shlex, sys
lines = Path('/var/lib/odong-deploy/.ssh/authorized_keys').read_text().splitlines()
keys = []
for line in lines:
    parts = shlex.split(line)
    for i, part in enumerate(parts[:-1]):
        if part in {'ssh-ed25519', 'ssh-rsa', 'ecdsa-sha2-nistp256', 'ecdsa-sha2-nistp384', 'ecdsa-sha2-nistp521'}:
            keys.append(part + ' ' + parts[i+1])
if len(keys) != 1:
    sys.exit('Expected exactly one current deployment public key; inspect authorized_keys.')
Path(sys.argv[1]).write_text(keys[0] + '\n')
PY
echo 'Exporting current images while websites stay online...'
tags=()
for service in "${services[@]}"; do
  container=$("${compose[@]}" ps -q "$service")
  image_id=$(docker inspect -f '{{.Image}}' "$container")
  tag="odong-transfer:$service-${image_id:7:12}"
  docker image tag "$image_id" "$tag"
  tags+=("$tag")
  printf '%s %s %s\n' "$service" "$image_id" "$tag"
done > "$bundle/image-list.txt"
python3 - "$bundle" <<'PY'
import json, pathlib, sys
p = pathlib.Path(sys.argv[1])
data = {}
for line in (p/'image-list.txt').read_text().splitlines():
    service, image_id, tag = line.split()
    data[service] = {'id': image_id, 'tag': tag}
(p/'migration-images.json').write_text(json.dumps(data, indent=2) + '\n')
(p/'image-list.txt').unlink()
PY
docker image save "${tags[@]}" | gzip -1 > "$bundle/docker-images.tar.gz"
cron_was_active=false
systemctl is-active --quiet odong-wordpress-cron.timer && cron_was_active=true
services_stopped=false
handoff_complete=false
snapshot=
resume() {
  local result=$?
  trap - EXIT INT TERM
  if [[ -n $snapshot ]]; then rm -rf -- "$snapshot"; fi
  if $handoff_complete && $keep_stopped && (( result == 0 )); then
    echo 'Old WordPress/mail/cron remain STOPPED for your final cutover.'
    exit 0
  fi
  if $services_stopped; then
    "${compose[@]}" start blog ebike mail || result=1
  fi
  if $cron_was_active; then
    systemctl start odong-wordpress-cron.timer || result=1
  fi
  if (( result != 0 )); then
    rm -f -- "$bundle/COMPLETE"
    echo 'Export did not complete. Check services; do not use this bundle for a wipe.' >&2
  fi
  exit "$result"
}
trap resume EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
systemctl stop odong-wordpress-cron.timer odong-wordpress-cron.service
services_stopped=true
echo 'Briefly stopping WordPress/mail for the final consistent snapshot...'
"${compose[@]}" stop -t 30 blog ebike mail
# The secret is read only inside the database container.
# shellcheck disable=SC2016
"${compose[@]}" exec -T db sh -c 'MYSQL_PWD="$(cat /run/secrets/db-root)" exec mariadb-dump -uroot --single-transaction --quick --routines --events --triggers --hex-blob --databases ebikeland_id_nUSaT4X2 blog_odongfoundation_org_glCvkKVT' < /dev/null | gzip > "$bundle/databases.sql.gz"
# Exclude changing Caddy state from this first, strict application archive.
# Caddy certificate data is appended separately after an ordinary copy.
snapshot=$(mktemp -d /var/tmp/odong-certificates.XXXXXX)
cp -a /srv/odong/caddy-data /srv/odong/caddy-config "$snapshot/"
tar -czf "$bundle/runtime.tar.gz" -C /srv/odong sites secrets mail stack.env source/deploy -C "$snapshot" caddy-data caddy-config
rm -rf -- "$snapshot"
snapshot=
if ! $keep_stopped; then
  "${compose[@]}" start blog ebike mail
  services_stopped=false
  if $cron_was_active; then systemctl start odong-wordpress-cron.timer; fi
  cron_was_active=false
  echo 'Websites resumed.'
fi
echo 'Checking and hashing the restore bundle...'
gzip -t "$bundle/databases.sql.gz" "$bundle/runtime.tar.gz" "$bundle/docker-images.tar.gz"
(
  cd "$bundle"
  sha256sum databases.sql.gz runtime.tar.gz docker-images.tar.gz migration-images.json source-commit.txt deploy.pub > SHA256SUMS
  touch COMPLETE
)
python3 "$script_dir/validate-backup.py" "$bundle" > /dev/null
handoff_complete=true
echo "Bundle complete: $bundle"
echo 'Copy the entire directory off-host, then verify its SHA256SUMS there.'
echo 'For a second-VPS cutover, take a final snapshot during a coordinated write freeze.'
