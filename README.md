# CEOFLIGHTS Riga — Recruitment Landing Page

Premium recruitment landing page for CEOFLIGHTS Riga with an API-driven TestGorilla assessment flow.

**Production:** https://ceoflightsriga.lv

## Architecture

```
public/              → Static landing page (HTML/CSS/JS)
  ├── index.html     → Main page
  ├── style.css      → Design system (Navy/Gold/Cream)
  ├── script.js      → Interactions + form handler
  └── images/        → Optimized WebP/JPEG assets

api/
  └── invite.js      → Vercel serverless function (TestGorilla invite API)

deploy.ps1           → One-command deploy script
vercel.json          → Vercel configuration
```

## Git Workflow

| Branch | Purpose |
|--------|---------|
| `dev`  | Working branch — commit here |
| `main` | Production — push triggers auto-deploy to Vercel |

### Deploy to Production

**Option A** — Run the deploy script:
```powershell
.\deploy.ps1
```

**Option B** — Manual steps:
```powershell
git checkout main
git merge dev --no-edit
git push origin main        # triggers Vercel auto-deploy
git checkout dev
git push origin dev
```

## Environment Variables (Vercel)

| Variable | Description |
|----------|-------------|
| `TG_USERNAME` | TestGorilla account email |
| `TG_PASSWORD` | TestGorilla account password |
| `TG_ASSESSMENT_ID` | Assessment ID (default: `1547206`) |

## Local Development

```powershell
npx serve public
```

## TestGorilla Integration

The application form on the landing page collects candidate details and uses the `/api/invite` serverless function to:

1. Authenticate with TestGorilla API
2. Invite the candidate with `no_email=true` (suppresses TG email)
3. Return the direct assessment URL from `invitation_uuid`
4. Redirect the candidate immediately to start the test

Edge cases handled:
- **Duplicate invite** → Looks up existing assessment link
- **Bad/disposable email** → Returns user-friendly error
- **Network timeout** → 15s timeout with clear error message
