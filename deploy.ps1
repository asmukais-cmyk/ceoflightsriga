# CEOFLIGHTS Riga — Deploy to Production
# Usage: .\deploy.ps1
#
# This script merges dev into main and pushes both branches.
# Pushing to main triggers automatic production deployment via Vercel.
# Production URL: https://ceoflightsriga.lv

$ErrorActionPreference = "Stop"

Write-Host "`n=== CEOFLIGHTS Riga Deploy ===" -ForegroundColor Cyan

# 1. Ensure we're on dev
$branch = git rev-parse --abbrev-ref HEAD
if ($branch -ne "dev") {
    Write-Host "Switching to dev..." -ForegroundColor Yellow
    git checkout dev
}

# 2. Stage and commit any uncommitted changes
$status = git status --porcelain
if ($status) {
    Write-Host "Committing changes on dev..." -ForegroundColor Yellow
    git add -A
    git commit -m "chore: pre-deploy commit"
}

# 3. Merge dev into main
Write-Host "Merging dev into main..." -ForegroundColor Green
git checkout main
git merge dev --no-edit

# 4. Push main (triggers Vercel auto-deploy)
Write-Host "Pushing main (triggers deploy)..." -ForegroundColor Green
git push origin main

# 5. Switch back to dev and push
Write-Host "Switching back to dev..." -ForegroundColor Yellow
git checkout dev
git push origin dev

Write-Host "`n=== Deployed! https://ceoflightsriga.lv ===" -ForegroundColor Green
