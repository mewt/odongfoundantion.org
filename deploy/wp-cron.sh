#!/bin/bash
set -euo pipefail
exec 9>/run/odong-wordpress-cron.lock
flock -n 9 || exit 0
compose=(docker compose --env-file /srv/odong/stack.env -f /srv/odong/source/deploy/compose.yaml)
for site in ebike blog; do
  timeout 55 "${compose[@]}" exec -T --user www-data "$site" php /var/www/html/wp-cron.php < /dev/null
done
