#!/usr/bin/env bash
# Run from the ROOT of your repo:  bash /path/to/APPLY.sh
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
# 1) delete public signup
rm -rf app/signup app/api/register
# 2) copy new/changed files over the repo
cd "$HERE" && tar -cf - $(find app lib proxy.ts -type f) | tar -xf - -C "$OLDPWD"
cd "$OLDPWD"
echo "Done. Now run:  npx prisma migrate dev --name add_access_group   (skip if you already made it)"
echo "                npx prisma generate"
