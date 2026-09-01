#!/usr/bin/env bash

set -euo pipefail

usage() {
    echo "Usage: $0 <upstream-tag>"
    echo "Example: $0 v2.2.2"
}

if [[ $# -ne 1 ]]; then
    usage
    exit 64
fi

tag="$1"

if [[ ! "$tag" =~ ^v[0-9]+\.[0-9]+\.[0-9]+([.-][0-9A-Za-z.-]+)?$ ]]; then
    echo "Error: '$tag' does not look like a ProjectSend release tag (for example, v2.2.2)." >&2
    exit 64
fi

repo_root="$(git rev-parse --show-toplevel 2>/dev/null)" || {
    echo "Error: run this script from inside the TyreeNet Send repository." >&2
    exit 1
}
cd "$repo_root"

if [[ -n "$(git status --porcelain)" ]]; then
    echo "Error: the working tree is not clean. Commit or stash changes first." >&2
    exit 1
fi

if ! git remote get-url origin >/dev/null 2>&1; then
    echo "Error: the 'origin' remote is missing." >&2
    exit 1
fi

if ! git remote get-url upstream >/dev/null 2>&1; then
    echo "Error: the 'upstream' remote is missing." >&2
    echo "Add it with: git remote add upstream https://github.com/projectsend/projectsend.git" >&2
    exit 1
fi

version="${tag#v}"
branch="integrate-projectsend-${version}"

echo "Fetching TyreeNet main and ProjectSend release tags..."
git fetch origin main
git fetch upstream --tags

if ! git rev-parse --verify --quiet "refs/tags/$tag^{commit}" >/dev/null; then
    echo "Error: upstream tag '$tag' was not found." >&2
    exit 1
fi

if git show-ref --verify --quiet "refs/heads/$branch" ||
   git show-ref --verify --quiet "refs/remotes/origin/$branch"; then
    echo "Error: branch '$branch' already exists locally or on origin." >&2
    exit 1
fi

git switch --create "$branch" origin/main

echo "Merging ProjectSend $tag into $branch..."
if ! git merge --no-ff "$tag" -m "Merge ProjectSend $version into TyreeNet Send"; then
    echo
    echo "The merge has conflicts. Resolve them, then run:" >&2
    echo "  git add <resolved-files>" >&2
    echo "  git commit" >&2
    echo "To abandon this integration safely, run:" >&2
    echo "  git merge --abort" >&2
    exit 1
fi

cat <<EOF

ProjectSend $tag has been merged locally on $branch.

Next steps:
  1. Follow docs/TYREENET_UPSTREAM_UPDATES.md to validate the integration.
  2. Push with: git push -u origin $branch
  3. Open a pull request into main and wait for all checks to pass.
EOF
