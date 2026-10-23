#!/bin/bash
# Fresh-host restore only. Never formats disks or reinstalls the OS.
set -Eeuo pipefail
umask 077
script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
usage() {
  cat <<'EOF'
Usage:
  sudo bash bootstrap-debian13.sh restore --backup /root/odong-bundle \
    --admin-key /root/admin.pub --deploy-key /root/deploy.pub \
    [--admin-user kurohime] [--source-ref FULL_GIT_COMMIT]
  sudo bash bootstrap-debian13.sh activate
  bash bootstrap-debian13.sh --help

Requires a fresh Debian 13 amd64 VPS and a trusted, verified Odong backup.
Keep validate-backup.py next to this script. Only PUBLIC SSH keys are inputs.
The export helper includes the source commit and prebuilt Docker images.
For an older daily backup, --source-ref is required and images are pulled/
built; private GHCR images require root's docker login before restoring.

restore: verifies the backup, configures hardening, creates 4 GiB swap,
         restores the stack, and serves preview ONLY at 127.0.0.1:18080.
         WordPress cron, outbound mail and public ingress remain stopped.
activate: opens production HTTP/HTTPS and enables mail/cron/backup timers.
          Use after your final data sync and traffic cutover are ready.

Does NOT wipe a server, change DNS, update GitHub secrets, or copy backups
off-host. See DEBIAN13-MIGRATION.txt before use. A provider console is
needed as recovery access while applying SSH/firewall settings.
EOF
}
die() { echo "ERROR: $*" >&2; exit 1; }
[[ $# -gt 0 ]] || { usage; exit 64; }
mode=$1
shift
case "$mode" in
  --help|-h) usage; exit 0 ;;
  restore|activate) ;;
  *) usage >&2; exit 64 ;;
esac
backup='' admin_key='' deploy_key='' source_ref=''
admin_user=kurohime
while (( $# )); do
  [[ $# -ge 2 ]] || die "Missing value for $1"
  case "$1" in
    --backup) backup=$2 ;;
    --admin-key) admin_key=$2 ;;
    --deploy-key) deploy_key=$2 ;;
    --admin-user) admin_user=$2 ;;
    --source-ref) source_ref=$2 ;;
    *) die "Unknown argument: $1" ;;
  esac
  shift 2
done
[[ $(uname -s) == Linux && $EUID == 0 ]] || die 'Run as root on the NEW Debian VPS.'
# /etc/os-release is supplied by the OS, never by the backup.
# shellcheck disable=SC1091
. /etc/os-release
[[ $ID == debian && $VERSION_ID == 13 ]] || die 'Only a clean Debian 13 host is supported.'
[[ $(dpkg --print-architecture) == amd64 ]] || die 'Current application images require amd64.'
exec 9>/run/odong-bootstrap.lock
flock -n 9 || die 'Another bootstrap is running.'
compose=(docker compose --env-file /srv/odong/stack.env -f /srv/odong/source/deploy/compose.yaml)
staged=false
public_unverified=false
on_exit() {
  local result=$?
  trap - EXIT
  if (( result != 0 )); then
    if $staged; then
      "${compose[@]}" stop edge odong blog ebike mail >/dev/null 2>&1 || true
      echo 'Restore failed. Application containers stopped; data retained for diagnosis.' >&2
      echo 'Do not rerun against this partial installation without inspecting the failure.' >&2
    fi
    if $public_unverified; then
      "${compose[@]}" stop edge >/dev/null 2>&1 || true
      echo 'HTTPS verification failed; public edge stopped. Check DNS/certificates before retry.' >&2
    fi
  fi
  exit "$result"
}
trap on_exit EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
write_env() {
  python3 - "$1" <<'PY'
from pathlib import Path
import sys
p = Path('/srv/odong/stack.env')
lines = [line for line in p.read_text().splitlines()
         if not line.startswith(('HTTP_BIND=', 'HTTPS_BIND=', 'CADDY_CONFIG='))]
production = sys.argv[1] == 'production'
lines += ['HTTP_BIND=' + ('0.0.0.0:80' if production else '127.0.0.1:18080'),
          'HTTPS_BIND=' + ('0.0.0.0:443' if production else '127.0.0.1:18443'),
          'CADDY_CONFIG=/srv/odong/source/deploy/' + ('Caddyfile' if production else 'Caddyfile.preview')]
p.write_text('\n'.join(lines) + '\n')
PY
}
if [[ $mode == activate ]]; then
  [[ -f /srv/odong/RESTORE_READY ]] || die 'No successfully staged restore was found.'
  [[ ! -f /srv/odong/RESTORE_ACTIVATED ]] || die 'Already activated; use normal operations commands.'
  # Locks match existing CI and backup scripts to avoid concurrent changes.
  exec 8>/run/odong-release.lock
  flock -n 8 || die 'A deployment is running.'
  cp /srv/odong/stack.env /srv/odong/stack.env.pre-activation
  write_env production
  public_unverified=true
  "${compose[@]}" up -d --no-build --pull never --wait --wait-timeout 180 db blog ebike odong edge
  for domain in odongfoundation.org blog.odongfoundation.org ebikeland.id; do
    verified=false
    for ((attempt=1; attempt<=12; attempt++)); do
      if curl --fail --silent --show-error --max-time 10 --resolve "$domain:443:127.0.0.1" "https://$domain/" > /dev/null; then
        verified=true; break
      fi
      sleep 5
    done
    $verified || die "HTTPS check failed for $domain"
  done
  public_unverified=false
  "${compose[@]}" up -d --no-build --pull never --wait --wait-timeout 120 mail
  systemctl enable --now odong-wordpress-cron.timer odong-backup.timer
  systemctl start odong-backup.service
  date -u +%FT%TZ > /srv/odong/RESTORE_ACTIVATED
  echo 'Production HTTPS, mail, WordPress cron and backup timers activated.'
  echo 'Verify each public domain externally and update GitHub host/known-host settings.'
  exit 0
fi

[[ $admin_user =~ ^[a-z][a-z0-9_-]{0,30}$ && $admin_user != root && $admin_user != odong-deploy ]] || die 'Invalid admin username.'
[[ -d $backup && -f $admin_key && -f $deploy_key ]] || die 'Provide backup directory and both public-key files.'
[[ ! -e /srv/odong && ! -L /srv/odong ]] || die '/srv/odong already exists; refusing to overwrite a server.'
[[ -f $script_dir/validate-backup.py ]] || die 'Keep validate-backup.py beside this script.'
command -v python3 >/dev/null || die 'Install python3 first: apt-get update && apt-get install -y python3'
command -v ssh-keygen >/dev/null || die 'OpenSSH must already be installed.'
python3 - "$admin_key" "$deploy_key" <<'PY'
from pathlib import Path
import re, subprocess, sys
for name in sys.argv[1:]:
    content = Path(name).read_text().strip()
    if not re.fullmatch(r'(ssh-ed25519|ssh-rsa|ecdsa-sha2-nistp(?:256|384|521)) [A-Za-z0-9+/]+={0,3}(?: [^\r\n]*)?', content):
        sys.exit('Each key must be ONE plain public key, without authorized_keys options.')
    subprocess.run(['ssh-keygen', '-l', '-f', name], check=True, stdout=subprocess.DEVNULL)
PY
if command -v docker >/dev/null && docker info >/dev/null 2>&1; then
  [[ -z $(docker ps -aq) ]] || die 'Existing Docker containers detected; use a clean host.'
fi
if ss -H -ltn '( sport = :80 or sport = :443 )' | grep -q .; then
  die 'Ports 80/443 are already in use; use a clean host.'
fi
[[ $(/usr/sbin/sshd -T | awk '$1 == "port" {print $2}') == 22 ]] || die 'This script expects existing SSH on port 22.'
if id "$admin_user" >/dev/null 2>&1; then
  [[ $(id -u "$admin_user") -ge 1000 ]] || die 'Admin name belongs to a system account.'
fi
echo 'Validating checksums and archive paths before changing this host...'
validated=$(python3 "$script_dir/validate-backup.py" "$backup")
gzip -t "$backup/databases.sql.gz"
if [[ -f $backup/source-commit.txt ]]; then
  bundled_ref=$(cat "$backup/source-commit.txt")
  [[ -z $source_ref || $source_ref == "$bundled_ref" ]] || die 'Source ref conflicts with the verified bundle.'
  source_ref=$bundled_ref
fi
[[ $source_ref =~ ^[0-9a-f]{40}$ ]] || die 'Provide --source-ref FULL_GIT_COMMIT for an older daily backup.'
app_image=$(python3 -c 'import json,sys; print(json.loads(sys.argv[1])["image"])' "$validated")
python3 - "$validated" <<'PY'
import json, shutil, sys
size = json.loads(sys.argv[1])['unpacked_bytes']
if shutil.disk_usage('/srv' if __import__('os').path.isdir('/srv') else '/').free < size + 8 * 1024**3:
    sys.exit('Need space for extracted files plus at least 8 GiB for swap/images/database.')
PY

echo 'Installing host packages and Docker from the official Debian repository...'
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y ca-certificates curl gnupg git sudo openssh-server ufw fail2ban unattended-upgrades python3 gzip tar
# A Debian 13 image may be older than current security fixes.
apt-get --with-new-pkgs upgrade -y
install -d -m 0755 /etc/apt/keyrings
curl --fail --silent --show-error --proto '=https' --tlsv1.2 https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
chmod 0644 /etc/apt/keyrings/docker.asc
cat > /etc/apt/sources.list.d/docker.sources <<'EOF'
Types: deb
URIs: https://download.docker.com/linux/debian
Suites: trixie
Components: stable
Architectures: amd64
Signed-By: /etc/apt/keyrings/docker.asc
EOF
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable --now docker
timedatectl set-timezone Asia/Jakarta

echo 'Setting up administrative and restricted deployment access...'
if ! id "$admin_user" >/dev/null 2>&1; then
  useradd --create-home --shell /bin/bash "$admin_user"
fi
admin_home=$(getent passwd "$admin_user" | cut -d: -f6)
[[ $admin_home == /home/"$admin_user" ]] || die 'Unexpected admin home; refusing to alter it.'
install -d -o "$admin_user" -g "$(id -gn "$admin_user")" -m 0700 "$admin_home/.ssh"
# Preserve any existing authorized admin keys on a fresh provider image.
touch "$admin_home/.ssh/authorized_keys"
printf '\n%s\n' "$(cat "$admin_key")" >> "$admin_home/.ssh/authorized_keys"
chown "$admin_user:$(id -gn "$admin_user")" "$admin_home/.ssh/authorized_keys"
chmod 0600 "$admin_home/.ssh/authorized_keys"
printf '%s ALL=(ALL:ALL) NOPASSWD: ALL\n' "$admin_user" > /etc/sudoers.d/odong-admin
chmod 0440 /etc/sudoers.d/odong-admin
visudo -cf /etc/sudoers.d/odong-admin
if ! id odong-deploy >/dev/null 2>&1; then
  useradd --create-home --home-dir /var/lib/odong-deploy --shell /bin/sh odong-deploy
fi
[[ $(getent passwd odong-deploy | cut -d: -f6) == /var/lib/odong-deploy ]] || die 'Unexpected deployment home.'
install -d -o odong-deploy -g odong-deploy -m 0700 /var/lib/odong-deploy/.ssh
printf 'restrict,command="/usr/local/bin/odong-deploy-gate" %s\n' "$(cat "$deploy_key")" > /var/lib/odong-deploy/.ssh/authorized_keys
chown odong-deploy:odong-deploy /var/lib/odong-deploy/.ssh/authorized_keys
chmod 0600 /var/lib/odong-deploy/.ssh/authorized_keys
install -d -m 0755 /etc/ssh/sshd_config.d
cat > /etc/ssh/sshd_config.d/00-odong-hardening.conf <<'EOF'
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
PubkeyAuthentication yes
AuthenticationMethods publickey
MaxAuthTries 3
LoginGraceTime 30
MaxSessions 4
X11Forwarding no
EOF
/usr/sbin/sshd -t
for account in "$admin_user" odong-deploy; do
  effective=$(/usr/sbin/sshd -T -C "user=$account,host=localhost,addr=127.0.0.1")
  for expected in 'permitrootlogin no' 'passwordauthentication no' 'kbdinteractiveauthentication no' 'pubkeyauthentication yes' 'authenticationmethods publickey'; do
    grep -qx "$expected" <<< "$effective" || die "SSH configuration overrides hardening for $account. Inspect before reloading."
  done
done
systemctl reload ssh
ufw default deny incoming
ufw default allow outgoing
ufw limit 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
cat > /etc/fail2ban/jail.d/odong.local <<'EOF'
[sshd]
enabled = true
backend = systemd
banaction = ufw
maxretry = 5
findtime = 10m
bantime = 1h
EOF
systemctl enable --now fail2ban
systemctl restart fail2ban
cat > /etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
EOF
cat > /etc/apt/apt.conf.d/52odong-unattended <<'EOF'
Unattended-Upgrade::Origins-Pattern {
  "origin=Debian,codename=${distro_codename}-security,label=Debian-Security";
};
Unattended-Upgrade::Automatic-Reboot "false";
EOF
systemctl enable --now apt-daily.timer apt-daily-upgrade.timer
if [[ ! -e /swapfile ]]; then
  install -m 0600 /dev/null /swapfile
  dd if=/dev/zero of=/swapfile bs=1M count=4096 status=progress
  mkswap /swapfile
else
  [[ ! -L /swapfile && $(stat -c %s /swapfile) -ge 4294967296 ]] || die 'Existing /swapfile is unsuitable; inspect it manually.'
  [[ $(blkid -p -s TYPE -o value /swapfile) == swap ]] || die 'Existing /swapfile is not formatted as swap.'
  chmod 0600 /swapfile
fi
if ! swapon --show=NAME --noheadings | grep -qx /swapfile; then swapon /swapfile; fi
grep -Eq '^/swapfile[[:space:]]' /etc/fstab || printf '/swapfile none swap sw 0 0\n' >> /etc/fstab
printf 'vm.swappiness=10\n' > /etc/sysctl.d/90-odong-swap.conf
sysctl -p /etc/sysctl.d/90-odong-swap.conf

echo 'Restoring private runtime files and the pinned source checkout...'
install -d -m 0700 /srv/odong
git clone https://github.com/mewt/odongfoundantion.org.git /srv/odong/source
git -C /srv/odong/source checkout --detach "$source_ref"
tar --extract --gzip --file "$backup/runtime.tar.gz" --directory /srv/odong --same-permissions --numeric-owner
chmod 0700 /srv/odong/secrets
chmod 0444 /srv/odong/secrets/db-root
chmod 0600 /srv/odong/secrets/init-users.sql
chown root:33 /srv/odong/secrets/*-wp-config.php
chmod 0640 /srv/odong/secrets/*-wp-config.php
chown -R 33:33 /srv/odong/sites
chown -R 1000:1000 /srv/odong/caddy-data /srv/odong/caddy-config
chmod 0750 /srv/odong/caddy-data /srv/odong/caddy-config
chmod 0644 /srv/odong/source/deploy/Caddyfile /srv/odong/source/deploy/Caddyfile.common /srv/odong/source/deploy/Caddyfile.preview
install -d -m 0700 /srv/odong/database
mkdir -p /srv/odong/mail
# Do not interpret arbitrary environment text from the archive as shell code.
printf 'ODONG_IMAGE=%s\n' "$app_image" > /srv/odong/stack.env
write_env preview
chmod 0600 /srv/odong/stack.env

if [[ -f $backup/docker-images.tar.gz ]]; then
  echo 'Loading prebuilt images; no application builds or registry login needed...'
  docker image load --input "$backup/docker-images.tar.gz"
  python3 - "$backup/migration-images.json" <<'PY'
import json, subprocess, sys
from pathlib import Path
images = json.loads(Path(sys.argv[1]).read_text())
targets = {'edge': 'caddy:2.11.7-alpine', 'blog': 'odong-wordpress:php83',
           'ebike': 'odong-wordpress:php82', 'db': 'mariadb:11.4', 'mail': 'odong-mail:latest'}
for service, spec in images.items():
    actual = subprocess.check_output(['docker', 'image', 'inspect', '-f', '{{.Id}}', spec['tag']], text=True).strip()
    if actual != spec['id']:
        sys.exit('Saved image identity mismatch for ' + service)
    if service in targets:
        subprocess.run(['docker', 'image', 'tag', spec['id'], targets[service]], check=True)
p = Path('/srv/odong/stack.env')
lines = [line for line in p.read_text().splitlines() if not line.startswith('ODONG_IMAGE=')]
p.write_text('\n'.join(lines) + '\nODONG_IMAGE=' + images['odong']['tag'] + '\n')
PY
else
  echo 'Older backup: downloading base/application images and building WordPress/mail...'
  [[ $app_image == ghcr.io/mewt/odongfoundation@sha256:* ]] || die 'Transfer image tag requires its image bundle.'
  "${compose[@]}" pull edge db odong
  "${compose[@]}" build --pull blog ebike mail
fi
"${compose[@]}" config --quiet
# Refuse exposing images older than the PHP2Shell fixes. No WordPress starts here.
"${compose[@]}" run --rm --no-deps --interactive=false --entrypoint php blog -r 'echo "Blog PHP ", PHP_VERSION, PHP_EOL; exit(version_compare(PHP_VERSION, "8.3.36", "<") ? 1 : 0);'
"${compose[@]}" run --rm --no-deps --interactive=false --entrypoint php ebike -r 'echo "eBike PHP ", PHP_VERSION, PHP_EOL; exit(version_compare(PHP_VERSION, "8.2.35", "<") ? 1 : 0);'
staged=true
"${compose[@]}" up -d --no-build --pull never --wait --wait-timeout 180 db
db_sql() {
  # Expand the password and arguments inside the container, not on the host.
  # shellcheck disable=SC2016
  "${compose[@]}" exec -T db sh -c 'MYSQL_PWD="$(cat /run/secrets/db-root)" exec mariadb -uroot "$@"' sh "$@"
}
echo 'Restoring database users/grants and application data...'
db_sql < /srv/odong/secrets/init-users.sql
gzip -dc "$backup/databases.sql.gz" | db_sql
# shellcheck disable=SC2016
"${compose[@]}" exec -T db sh -c 'MYSQL_PWD="$(cat /run/secrets/db-root)" exec mariadb-check -uroot --check --databases ebikeland_id_nUSaT4X2 blog_odongfoundation_org_glCvkKVT' < /dev/null
for database in ebikeland_id_nUSaT4X2 blog_odongfoundation_org_glCvkKVT; do
  tables=$(db_sql -N -B -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$database';" < /dev/null)
  [[ $tables =~ ^[0-9]+$ && $tables -gt 0 ]] || die "Database $database has no tables."
  echo "Restored $database: $tables tables"
done

install -o root -g root -m 0755 /srv/odong/source/deploy/release.sh /usr/local/sbin/odong-release
install -o root -g root -m 0755 /srv/odong/source/deploy/github-deploy-gate.py /usr/local/bin/odong-deploy-gate
install -o root -g root -m 0755 /srv/odong/source/deploy/backup.sh /usr/local/sbin/odong-backup
install -o root -g root -m 0755 /srv/odong/source/deploy/wp-cron.sh /usr/local/sbin/odong-wordpress-cron
printf 'odong-deploy ALL=(root) NOPASSWD: /usr/local/sbin/odong-release *\n' > /etc/sudoers.d/odong-deploy
chmod 0440 /etc/sudoers.d/odong-deploy
visudo -cf /etc/sudoers.d/odong-deploy
install -m 0644 /srv/odong/source/deploy/odong-backup.service /srv/odong/source/deploy/odong-backup.timer /srv/odong/source/deploy/odong-wordpress-cron.service /srv/odong/source/deploy/odong-wordpress-cron.timer /etc/systemd/system/
systemctl daemon-reload
systemctl disable --now odong-backup.timer odong-wordpress-cron.timer
"${compose[@]}" up -d --no-build --pull never --wait --wait-timeout 180 blog ebike odong edge
for domain in odongfoundation.org blog.odongfoundation.org ebikeland.id; do
  verified=false
  for ((attempt=1; attempt<=12; attempt++)); do
    if curl --fail --silent --show-error --max-time 10 -H "Host: $domain" "http://127.0.0.1:18080/" > /dev/null; then
      verified=true; break
    fi
    sleep 2
  done
  $verified || die "Private preview failed for $domain"
done
curl --fail --silent --show-error --max-time 30 -H 'Host: odongfoundation.org' http://127.0.0.1:18080/robots.txt | grep -q 'Allow: /'
fail2ban-client status sshd > /dev/null
/usr/sbin/sshd -t
date -u +%FT%TZ > /srv/odong/RESTORE_READY
staged=false
echo 'Restore ready on private preview ports. Public sites/mail/cron remain inactive.'
echo "Test a NEW SSH session as $admin_user before closing your existing connection."
echo 'After final sync and traffic-cutover preparation: sudo bash bootstrap-debian13.sh activate'
echo 'Update VPS_HOST and independently verified VPS_KNOWN_HOSTS in GitHub after reinstall.'
if [[ -e /var/run/reboot-required ]]; then
  echo 'A host reboot is required by package updates. Reboot and recheck preview before activation.'
fi
