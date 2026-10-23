#!/bin/bash
# Installed root-owned at /usr/local/sbin/odong-release.
set -euo pipefail
[[ $# == 2 && $1 =~ ^sha256:[0-9a-f]{64}$ && $2 =~ ^[A-Za-z0-9][A-Za-z0-9-]{0,38}$ ]] || exit 64
exec 9>/run/odong-release.lock
flock -n 9 || { echo 'Another deployment is active.'; exit 75; }
image="ghcr.io/mewt/odongfoundation@$1"
registry_user=$2
registry_config=$(mktemp -d /run/odong-registry.XXXXXX)
chmod 700 "$registry_config"
trap 'rm -rf -- "$registry_config"' EXIT
read -r registry_token
printf '%s\n' "$registry_token" | docker --config "$registry_config" login ghcr.io -u "$registry_user" --password-stdin >/dev/null
unset registry_token
docker --config "$registry_config" pull "$image"
cd /srv/odong/source
compose=(docker compose --env-file /srv/odong/stack.env -f deploy/compose.yaml)
cp /srv/odong/stack.env /srv/odong/stack.env.previous
python3 - "$image" <<'PY'
import pathlib, sys
path=pathlib.Path('/srv/odong/stack.env')
lines=[line for line in path.read_text().splitlines() if not line.startswith('ODONG_IMAGE=')]
path.write_text('\n'.join(lines)+ '\nODONG_IMAGE='+sys.argv[1]+'\n')
PY
verify() {
  if grep -q '^HTTP_BIND=127.0.0.1:' /srv/odong/stack.env; then
    curl --fail --silent --show-error --max-time 30 -H 'Host: odongfoundation.org' http://127.0.0.1:18080/robots.txt | grep -q 'Allow: /'
  else
    curl --fail --silent --show-error --max-time 30 https://odongfoundation.org/robots.txt | grep -q 'Allow: /'
  fi
}
if "${compose[@]}" up -d --no-deps --wait --wait-timeout 120 odong && verify; then
  printf '%s %s\n' "$(date -u +%FT%TZ)" "$image" >> /srv/odong/releases.log
  echo "Deployment verified: $image"
else
  echo 'Deployment failed; restoring previous application image.' >&2
  cp /srv/odong/stack.env.previous /srv/odong/stack.env
  "${compose[@]}" up -d --no-deps --wait --wait-timeout 120 odong
  exit 1
fi
