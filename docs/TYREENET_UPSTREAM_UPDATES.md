# Integrating ProjectSend updates into TyreeNet Send

TyreeNet Send keeps its product changes on `main` and imports ProjectSend releases
as explicit merge commits. This preserves both histories, makes the upstream release
boundary auditable, and avoids replaying TyreeNet commits onto every new release.

## One-time remote setup

Verify the remotes before starting:

```bash
git remote -v
```

They should be configured as:

- `origin`: the TyreeNet Send repository (fetch and push)
- `upstream`: `https://github.com/projectsend/projectsend.git` (fetch only)

If `upstream` is missing:

```bash
git remote add upstream https://github.com/projectsend/projectsend.git
git remote set-url --push upstream DISABLED
```

Never commit TyreeNet work directly to an upstream branch or tag.

## Start an integration

Begin with a clean working tree. Use the signed or published ProjectSend release
tag rather than a moving branch:

```bash
./scripts/integrate-upstream.sh v2.2.2
```

The script:

1. Refuses to run with uncommitted changes.
2. Fetches the current `origin/main` and upstream tags.
3. Verifies the release tag and prevents branch reuse.
4. Creates `integrate-projectsend-X.Y.Z` from `origin/main`.
5. Merges the release with `--no-ff`, retaining upstream history.

If a merge conflict occurs, preserve TyreeNet branding, deployment behavior,
security controls, and custom workflows while accepting upstream fixes wherever
they do not conflict. Do not resolve a whole file with `--ours` or `--theirs`
without reviewing every hunk. Search the result for conflict markers:

```bash
git diff --check
git grep -n -E '^(<<<<<<<|=======|>>>>>>>)'
```

After resolving conflicts, stage the files and complete the merge with `git commit`.
Use `git merge --abort` to return to the pre-merge state if the integration needs to
be restarted.

## Validate

Install dependencies using the committed lock files, then run the same checks as CI:

```bash
composer install --no-interaction --prefer-dist --optimize-autoloader
npm ci
npm run types
npm run build
npx eslint .
composer audit --locked --no-interaction
npm audit --omit=dev
./vendor/bin/phpstan analyse --no-progress
./vendor/bin/pest --parallel
```

Also exercise the TyreeNet-specific production path in a disposable environment:

- Run all new database migrations against a recent backup copy.
- Confirm login, two-factor authentication, and password reset.
- Upload, share, download, and delete a file.
- Confirm client visibility and staff permissions.
- Build a ZIP download and verify the queue worker processes it.
- Confirm email delivery and TyreeNet branding.
- Run `php artisan projectsend:status`.

Review the upstream changelog and migration files for new environment variables,
queue requirements, scheduled commands, storage changes, and breaking behavior.

## Pull request and release

Push the integration branch and open a pull request into `main`:

```bash
git push -u origin integrate-projectsend-X.Y.Z
gh pr create --base main --head integrate-projectsend-X.Y.Z
```

The pull request should record:

- The upstream release/tag and changelog link.
- Important conflicts and how each was resolved.
- Automated checks run and their results.
- Manual smoke-test results.
- Migration, backup, deployment, and rollback notes.

Require green CI and review before merging. Keep the integration merge commit; do
not squash the pull request, because squashing discards the ancestry Git needs to
make the next upstream merge clean.

Tag the deployed TyreeNet release separately from the upstream tag. Before production
deployment, take a database and uploaded-file backup. Roll back application code to
the previous TyreeNet release if necessary; treat database rollback separately and
restore the verified backup when a migration is not safely reversible.

## Rules that keep future updates clean

- Put TyreeNet customizations in focused commits and avoid unrelated upstream edits.
- Prefer extension points, configuration, and separate TyreeNet components over
  modifying upstream core behavior in place.
- Never force-push or rebase a completed integration branch after review starts.
- Integrate releases sequentially; do not skip a release without documenting why.
- Delete the integration branch after merge, but retain its merge commit and release
  notes on `main`.
