#!/usr/bin/env bash
# CEOFLIGHTS Riga — Deploy to Production
# Usage: ./deploy.sh
#
# This script merges dev into main and pushes both branches.
# Pushing to main triggers automatic production deployment via Vercel.
# Production URL: https://ceoflightsriga.lv

set -euo pipefail

echo ""
echo "=== CEOFLIGHTS Riga Deploy ==="

# 1. Ensure we're on dev
branch=$(git rev-parse --abbrev-ref HEAD)
if [ "$branch" != "dev" ]; then
    echo "Switching to dev..."
    git checkout dev
fi

# 2. Stage and commit any uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "Committing changes on dev..."
    git add -A
    git commit -m "chore: pre-deploy commit"
fi

# 3. Merge dev into main
echo "Merging dev into main..."
git checkout main
git merge dev --no-edit

# 4. Push main (triggers Vercel auto-deploy)
echo "Pushing main (triggers deploy)..."
git push origin main

# 5. Switch back to dev and push
echo "Switching back to dev..."
git checkout dev
git push origin dev

echo ""
echo "=== Deployed! https://ceoflightsriga.lv ==="
