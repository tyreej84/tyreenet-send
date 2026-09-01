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

# The database and uploaded files form one logical dataset. Stop the app's
# web, queue and scheduler processes so neither side can change between the
# SQL dump and storage archive. The trap restores service on every exit path.
if ! docker compose ps --status running --services | grep -qx app; then
    echo "The app service must be running before a backup." >&2
    exit 1
fi

app_stopped=false
cleanup() {
    status=$?
    rm -rf "$work"
    if [ "$app_stopped" = true ]; then
        docker compose start app >/dev/null || true
    fi
    exit "$status"
}
trap cleanup EXIT INT TERM

docker compose stop app
app_stopped=true

docker compose exec -T db sh -c \
    'exec mysqldump --single-transaction --quick --routines --triggers -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"' \
    > "$work/database.sql"

# storage contains protected local uploads and, in the official image, the
# persistent .env/APP_KEY needed to decrypt stored secrets.
docker compose run --rm --no-deps --entrypoint tar app \
    -C /var/www/html -czf - storage \
    > "$work/storage.tar.gz"

test -s "$work/database.sql"
test -s "$work/storage.tar.gz"

(cd "$work" && sha256sum database.sql storage.tar.gz > SHA256SUMS)
printf '%s\n' "$timestamp" > "$work/CREATED_AT_UTC"

mv "$work" "$final"
docker compose start app >/dev/null
app_stopped=false
trap - EXIT INT TERM

backup_bytes=$(du -sk "$final" | awk '{print $1 * 1024}')
docker compose exec -T app php artisan projectsend:record-backup \
    --status=completed --name="$(basename "$final")" --bytes="$backup_bytes" >/dev/null || true

echo "Backup completed: $final"
echo "Copy this directory to storage outside the application server."
