#!/bin/sh
set -eu

destination=${1:?Usage: backup-offsite.sh /absolute/backup/directory}
: "${AGE_RECIPIENT:?Set AGE_RECIPIENT to the offline age public recipient}"
: "${RCLONE_REMOTE:?Set RCLONE_REMOTE, for example b2:tyreenet-send-backups}"

command -v age >/dev/null 2>&1 || { echo "age is required" >&2; exit 1; }
command -v rclone >/dev/null 2>&1 || { echo "rclone is required" >&2; exit 1; }

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
"$script_dir/backup.sh" "$destination"
latest=$(find "$destination" -maxdepth 1 -type d -name 'projectsend-*' | sort | tail -n 1)
test -n "$latest"

archive="$latest.tar.gz"
encrypted="$archive.age"
tar -C "$destination" -czf "$archive" "$(basename "$latest")"
age -r "$AGE_RECIPIENT" -o "$encrypted" "$archive"
sha256sum "$encrypted" > "$encrypted.sha256"
rclone copy "$encrypted" "$encrypted.sha256" "$RCLONE_REMOTE/"
rm -f "$archive" "$encrypted" "$encrypted.sha256"

echo "Encrypted backup uploaded to $RCLONE_REMOTE"
