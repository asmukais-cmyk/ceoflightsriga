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

deploy.sh            → One-command deploy script (bash)
vercel.json          → Vercel configuration
```

## Git Workflow

| Branch | Purpose |
|--------|---------|
| `dev`  | Working branch — commit here |
| `main` | Production — push triggers auto-deploy to Vercel |

### Deploy to Production

**Option A** — Run the deploy script:
```bash
./deploy.sh
```

**Option B** — Manual steps:
```bash
git checkout main
git merge dev --no-edit
git push origin main        # triggers Vercel auto-deploy
git checkout dev
git push origin dev
```

## Environment Variables (Vercel)

| Variable | Description |
|----------|-------------|
| `TG_USERNAME` | TestGorilla credentials (see Vercel dashboard) |
| `TG_PASSWORD` | TestGorilla credentials (see Vercel dashboard) |
| `TG_ASSESSMENT_ID` | Assessment identifier |
| `ALLOWED_ORIGIN` | CORS allowed origin (default: `https://ceoflightsriga.lv`) |

## Local Development

```bash
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
