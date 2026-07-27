---
name: meta-ads-cli
description: >
  Manage Meta (Facebook) ad campaigns using the Meta Ads CLI. Activate when the
  user mentions: 'meta', 'meta ads', 'facebook ads', 'campaign', 'ad set',
  'ad creative', 'ads performance', 'insights', 'leads', 'CPL', 'CTR',
  'ad spend', 'pause campaign', 'create campaign', 'list campaigns', 'CEOFLIGHTS ads',
  'recruitment ads', or any request to check, create, update, or analyze Meta advertising.
---

# Meta Ads CLI Skill

You have the official **Meta Ads CLI** (`meta-ads` v1.1.0) installed and configured in this workspace. Use it for ALL Meta advertising tasks instead of writing custom Python scripts.

## Setup

- **CLI Binary:** `.venv/bin/meta` (Python 3.12 venv)
- **Wrapper Script:** `./meta` in the workspace root — auto-loads credentials from `.env.meta-ads`
- **Reference Docs:** `META_CLI_REFERENCE.md` in the workspace root — full command reference

**IMPORTANT:** Always use the wrapper script `./meta` (NOT `.venv/bin/meta` directly) because it loads the credentials automatically.

## Credentials

Stored in `.env.meta-ads` at the workspace root (gitignored):

| Variable | Description |
|----------|-------------|
| `META_ACCESS_TOKEN` | System User access token (~60 day expiry) |
| `META_AD_ACCOUNT_ID` | `act_4348465385481504` |
| `META_PAGE_ID` | `617761998089310` |
| `META_API_VERSION` | `v21.0` |

The wrapper maps `META_ACCESS_TOKEN` → `ACCESS_TOKEN` and `META_AD_ACCOUNT_ID` → `AD_ACCOUNT_ID` for the CLI.

## CEOFLIGHTS Riga Account Info

| Property | Value |
|----------|-------|
| Ad Account | `act_4348465385481504` |
| Facebook Page | CEOFLIGHTS Riga (ID: `617761998089310`) |
| Landing Page | https://ceoflightsriga.lv |
| Primary Objective | `OUTCOME_LEADS` (Lead Generation) |
| Primary Market | Latvia (LV) |

## Standard Workflow: When User Asks About Meta Ads

When the user invokes this skill or asks about Meta ads, follow this workflow:

### Step 1: Verify Auth
```bash
./meta auth status
```
If auth fails, check `.env.meta-ads` for token expiry and alert the user.

### Step 2: Gather Current State
Run these commands to build a full picture:

```bash
# List all campaigns with status
./meta ads campaign list

# Get performance insights (last 7 days)
./meta --output json ads insights get --date-preset last_7d

# Get performance insights (last 30 days)
./meta --output json ads insights get --date-preset last_30d

# List all active ads
./meta ads ad list
```

### Step 3: Present a Summary
Present findings in a clear table format with:
- Campaign names, statuses, and IDs
- Key metrics: Spend, Impressions, Clicks, CTR, CPC, Reach, Leads, CPL
- Daily trends if relevant
- Any recommendations or issues

### Step 4: Execute Requested Actions
Use the CLI to perform whatever the user needs (create, update, pause, analyze, etc.)

## Command Quick Reference

### Campaigns
```bash
./meta ads campaign list                              # List all
./meta ads campaign get <ID>                          # Details
./meta ads campaign create --name "..." --objective OUTCOME_LEADS --daily-budget 5000
./meta ads campaign update <ID> --status ACTIVE       # Activate
./meta ads campaign update <ID> --status PAUSED       # Pause
./meta ads campaign delete <ID>                       # Delete
```

### Ad Sets
```bash
./meta ads adset list                                 # List all
./meta ads adset list <CAMPAIGN_ID>                   # For campaign
./meta ads adset get <ID>                             # Details
./meta ads adset create <CAMPAIGN_ID> --name "..." --optimization-goal LEAD_GENERATION --billing-event IMPRESSIONS --targeting-countries LV --destination-type ON_AD
./meta ads adset update <ID> --status PAUSED
./meta ads adset delete <ID>
```

### Ads
```bash
./meta ads ad list                                    # List all
./meta ads ad list <ADSET_ID>                         # For ad set
./meta ads ad get <ID>                                # Details
./meta ads ad create <ADSET_ID> --name "..." --creative-id <CREATIVE_ID>
./meta ads ad update <ID> --status PAUSED
./meta ads ad delete <ID>
```

### Creatives
```bash
./meta ads creative list                              # List all
./meta ads creative get <ID>                          # Details
./meta ads creative create --name "..." --image ./img.jpg --page-id 617761998089310 --body "Ad copy" --title "Headline" --link-url "https://ceoflightsriga.lv" --call-to-action APPLY_NOW
./meta ads creative delete <ID>
```

### Insights
```bash
./meta ads insights get                               # Last 30d (default)
./meta ads insights get --date-preset last_7d         # Last 7 days
./meta ads insights get --since 2026-06-01 --until 2026-06-30  # Custom range
./meta ads insights get --campaign-id <ID> --date-preset last_7d  # For campaign
./meta ads insights get --time-increment daily --date-preset last_14d  # Daily
./meta ads insights get --breakdown age --breakdown gender  # Demographics
./meta --output json ads insights get --date-preset last_7d  # JSON output
```

**Date Presets:** `today`, `yesterday`, `last_3d`, `last_7d`, `last_14d`, `last_30d`, `last_90d`, `this_month`, `last_month`

**Breakdowns:** `age`, `gender`, `country`, `publisher_platform`, `device_platform`, `platform_position`, `impression_device`

### Pages
```bash
./meta ads page list
./meta ads page get <PAGE_ID>
```

### Other
```bash
./meta ads guidance list          # Meta recommendations
./meta ads adaccount list         # Ad accounts
./meta ads dataset list           # Pixels
./meta ads catalog list           # Product catalogs
./meta ads study list             # Experiments
```

## Output Formats

```bash
./meta ads campaign list                    # Table (default)
./meta --output json ads campaign list      # JSON
./meta --output plain ads campaign list     # Plain text
```

Use `--output json` when you need to pipe data or process it programmatically.

## Budget Convention

All budgets are in **cents**:
- `5000` = $50.00
- `10000` = $100.00
- `2500` = $25.00

## Creating a Full Campaign (Step-by-Step)

```bash
# 1. Campaign
./meta ads campaign create --name "..." --objective OUTCOME_LEADS --daily-budget 5000

# 2. Ad Set (with targeting)
./meta ads adset create <CAMPAIGN_ID> --name "..." --optimization-goal LEAD_GENERATION --billing-event IMPRESSIONS --targeting-countries LV --destination-type ON_AD

# 3. Creative (with media)
./meta ads creative create --name "..." --image ./banner.jpg --page-id 617761998089310 --body "Copy" --title "Headline" --link-url "https://ceoflightsriga.lv" --call-to-action APPLY_NOW

# 4. Ad (link creative → ad set)
./meta ads ad create <ADSET_ID> --name "..." --creative-id <CREATIVE_ID>

# 5. Activate
./meta ads campaign update <CAMPAIGN_ID> --status ACTIVE
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `Not authenticated` | Token expired — regenerate in Meta Business Suite |
| `Invalid parameter` | Check `--help` for required options |
| `Dynamic Creative ads can only be...` | Add `--dynamic-creative` flag to the ad set |
| `Permission error` | System user needs `ads_management` scope |
| CLI not found | Run from workspace root with `./meta` |

## Legacy Scripts

Custom Python scripts exist in `meta-ads/` subdirectory and workspace root for reference. These predate the CLI and use the Graph API via `requests` directly. Prefer the CLI for all new work.
