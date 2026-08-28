# TyreeNet Send production runbook

## Public service

- URL: `https://send.tyreenet.com`
- Sender: `TyreeNet Send <no-reply@tyreenet.com>`
- Main-server nginx terminates TLS and proxies `send.tyreenet.com` over the internal network to `http://10.2.10.61:9675`.
- Set `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL=https://send.tyreenet.com`, and `TRUSTED_PROXIES` to the proxy addresses.
- Keep the database and Redis ports private. The example Compose file only publishes the web service.
- Application image: `ghcr.io/tyreej84/tyreenet-send:sha-<commit>`. Pin the tested `sha-*` tag in `TYREENET_SEND_TAG`; never deploy mutable `latest`. Images support Linux AMD64 and ARM64, link to their corresponding GPL source revision, and credit ProjectSend as the upstream base.

The production Compose example publishes port 9675 on `0.0.0.0`. On the main nginx server, the location needs these headers:

```nginx
location / {
    proxy_pass http://10.2.10.61:9675;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_http_version 1.1;
    client_max_body_size 0;
    proxy_request_buffering off;
    proxy_connect_timeout 30s;
    proxy_read_timeout 600s;
    proxy_send_timeout 600s;
}
```

Add `Strict-Transport-Security` at this public TLS proxy, not at the internal HTTP container. Enable it only after confirming every applicable subdomain is HTTPS-ready.

Set `TRUSTED_PROXIES` to the main nginx server's internal IP. Because port 9675 listens on every interface, configure the firewall on `10.2.10.61` to allow TCP port `9675` only from that nginx IP. This prevents another device from bypassing HTTPS and forging forwarded-client headers.

## Zoho SMTP

In **System → Settings → Email**, choose **Zoho Mail (paid domain)** and use:

- Host: `smtppro.zoho.com`
- Port: `587`
- Encryption: `TLS`
- Username and From address: `no-reply@tyreenet.com`
- From name: `TyreeNet Send`
- Password: a Zoho application-specific password created only for TyreeNet Send

Save, send a test message, and confirm SPF, DKIM, and DMARC for `tyreenet.com` in Zoho Admin Console.

## Upload safety

The production Compose example enables ClamAV and fails closed. An unavailable scanner therefore rejects and removes new uploads rather than accepting unscanned content.

Keep these values enabled:

```dotenv
MALWARE_SCAN_ENABLED=true
MALWARE_SCAN_FAIL_CLOSED=true
CLAMAV_HOST=clamav
CLAMAV_PORT=3310
CLAMAV_TIMEOUT=300
```

ClamAV definitions need time to download on first startup. The application waits for its health check before starting.

The supported maximum is **1 GiB**. Set **System → Settings → Uploads → Maximum file size** to `1024` MB or less. The Compose file aligns ClamAV's stream, file, and scan limits with that ceiling; PHP and nginx allow up to ten minutes for final assembly and scanning.

## Backups

Run from the production Compose directory, writing to a mounted disk outside ProjectSend:

```sh
sh /path/to/projectsend/scripts/backup.sh /srv/backups/projectsend
sh /path/to/projectsend/scripts/verify-backup.sh /srv/backups/projectsend/projectsend-YYYYMMDDTHHMMSSZ
```

Each backup contains:

- `database.sql`
- `storage.tar.gz`, including local files and the persistent application key
- `SHA256SUMS`
- its UTC creation time

Copy completed backups off-server. Keep at least one daily, one weekly, and one monthly generation. Perform a restore drill on an isolated host after deployment and quarterly thereafter. Never replace the live database or storage volume as part of a restore test.

The script briefly stops the application so the SQL dump and uploaded-file archive represent one consistent point in time, and starts it again automatically. Expect a short maintenance window proportional to the storage archive time.

### Isolated restore drill

1. Verify checksums with `verify-backup.sh`.
2. Create a separate Compose project and empty database/storage volumes on an isolated host.
3. Extract `storage.tar.gz` into the isolated app volume.
4. Import `database.sql` into the isolated MySQL database.
5. Start the pinned application image without exposing it publicly.
6. Confirm login, thumbnails, downloads, mail configuration decryption, and audit history.
7. Destroy only the isolated drill environment after recording the result.

For external S3-compatible file storage, enable bucket versioning and lifecycle protection and back it up separately; the local storage archive does not duplicate remote objects.

### Encrypted off-site backups

Install `age` and `rclone` on the application host, keep the age private identity offline, and configure an rclone remote with write-only credentials where possible. Then schedule:

```sh
AGE_RECIPIENT='age1...' RCLONE_REMOTE='remote:tyreenet-send' \
  sh /path/to/projectsend/scripts/backup-offsite.sh /srv/backups/projectsend
```

The wrapper creates a consistent local backup, encrypts it before upload, uploads its checksum, and removes the temporary plaintext archive. Test decryption and restoration with the offline identity before relying on the schedule.

## Security alerts

New-IP login and high-volume download alerts go to the administrator addresses under Email settings. Defaults alert after 25 downloads in 10 minutes and suppress repeats for one hour. They can be tuned in the deployment environment:

```dotenv
SECURITY_ALERTS_ENABLED=true
SECURITY_ALERT_DOWNLOAD_THRESHOLD=25
SECURITY_ALERT_DOWNLOAD_WINDOW_MINUTES=10
```

## Monitoring

- Probe `https://send.tyreenet.com/up` from an external monitor every minute.
- Alert after three consecutive failures.
- Review **System → Settings → Scheduler** for failed scheduled tasks, pending mail, and failed queue jobs.
- The dashboard warns when local file storage is running low.
- Test a real recipient invitation after SMTP changes; `/up` cannot prove that an external mailbox accepted a message.

## Sharing defaults

- New public links default to seven days and ten downloads.
- Use a link password for sensitive files and communicate it separately.
- Prefer named recipient accounts when access history must identify a person.
- Revoke links immediately when they are no longer needed.
- Keep automatic expired-file cleanup enabled under **System → Settings → File retention**.

## Security review

- Enrol every administrator in two-factor authentication.
- Restrict allowed upload extensions to the types actually needed.
- Keep application, database, Redis, proxy, and ClamAV images patched.
- Subscribe to this repository's release notifications. Upstream ProjectSend releases must be merged into the TyreeNet fork and rebuilt; do not replace this image directly with the upstream image.
- Back up before every application upgrade.
- Never commit `.env`, SMTP application passwords, storage credentials, or backup contents.
