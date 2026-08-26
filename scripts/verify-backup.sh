#!/bin/sh
set -eu

backup=${1:?Usage: verify-backup.sh /absolute/path/to/projectsend-backup}
case "$backup" in
    /*) ;;
    *) echo "Backup path must be absolute." >&2; exit 2 ;;
esac

test -s "$backup/database.sql"
test -s "$backup/storage.tar.gz"
test -s "$backup/SHA256SUMS"

(cd "$backup" && sha256sum -c SHA256SUMS)
tar -tzf "$backup/storage.tar.gz" | grep -q '^storage/'
grep -qE '^(-- MySQL dump|/\*!|CREATE|SET )' "$backup/database.sql"

echo "Backup files and checksums are valid: $backup"
echo "A full restore drill on an isolated host is still required periodically."
