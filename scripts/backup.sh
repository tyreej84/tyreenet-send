#!/bin/sh
set -eu

# Run from the directory containing the production compose file:
#   /path/to/projectsend/scripts/backup.sh /srv/backups/projectsend
# The destination must not be the ProjectSend storage volume itself.

destination=${1:?Usage: backup.sh /absolute/backup/directory}
case "$destination" in
    /*) ;;
    *) echo "Backup destination must be an absolute path." >&2; exit 2 ;;
esac

timestamp=$(date -u +%Y%m%dT%H%M%SZ)
work="$destination/.projectsend-$timestamp.tmp"
final="$destination/projectsend-$timestamp"

mkdir -p "$destination"
test ! -e "$work"
test ! -e "$final"
mkdir "$work"
trap 'rm -rf "$work"' EXIT INT TERM

docker compose exec -T db sh -c \
    'exec mysqldump --single-transaction --quick --routines --triggers -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"' \
    > "$work/database.sql"

# storage contains protected local uploads and, in the official image, the
# persistent .env/APP_KEY needed to decrypt stored secrets.
docker compose exec -T app tar -C /var/www/html -czf - storage \
    > "$work/storage.tar.gz"

test -s "$work/database.sql"
test -s "$work/storage.tar.gz"

(cd "$work" && sha256sum database.sql storage.tar.gz > SHA256SUMS)
printf '%s\n' "$timestamp" > "$work/CREATED_AT_UTC"

mv "$work" "$final"
trap - EXIT INT TERM

echo "Backup completed: $final"
echo "Copy this directory to storage outside the application server."
