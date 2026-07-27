# Meta Ads CLI — Complete Reference

## Overview

The official **Meta Ads CLI** (`meta-ads` v1.1.0) provides command-line access to the Meta Marketing API. It replaces the need for custom Python scripts to manage campaigns, ad sets, ads, creatives, and performance insights.

**Installed:** Python 3.12 + `meta-ads` package in `.venv/`
**Wrapper:** `./meta` — auto-loads credentials from `.env.meta-ads`

---

## Authentication

Credentials are stored in `.env.meta-ads` (gitignored):

```
META_ACCESS_TOKEN=<your-token>
META_AD_ACCOUNT_ID=act_4348465385481504
META_PAGE_ID=617761998089310
META_API_VERSION=v21.0
```

The wrapper script `./meta` maps these to the CLI's expected env vars (`ACCESS_TOKEN`, `AD_ACCOUNT_ID`).

### Token Management

- Tokens expire every **~60 days**
- Check current expiry in the comment at the top of `.env.meta-ads`
- To check auth status: `./meta auth status`
- Regenerate tokens via Meta Business Suite → Settings → Users → System User → Generate Token

---

## Command Structure

```
./meta [GLOBAL_OPTIONS] ads <RESOURCE> <ACTION> [OPTIONS]
```

### Global Options

| Flag | Description |
|------|-------------|
| `--output json` | JSON output (default: table) |
| `--output plain` | Plain text output |
| `--no-color` | Disable colored output |
| `--no-input` | Disable interactive prompts |
| `--debug` | Enable debug/verbose output |
| `--version` | Show CLI version |

---

## Resources & Commands

### 📊 Campaigns

```bash
# List all campaigns
./meta ads campaign list

# Get a specific campaign
./meta ads campaign get <CAMPAIGN_ID>

# Create a campaign (defaults to PAUSED)
./meta ads campaign create \
  --name "CEOFLIGHTS Riga — July 2026 (Leads)" \
  --objective OUTCOME_LEADS \
  --daily-budget 5000          # Budget in cents ($50.00)

# Update campaign
./meta ads campaign update <CAMPAIGN_ID> --status ACTIVE
./meta ads campaign update <CAMPAIGN_ID> --name "New Name"
./meta ads campaign update <CAMPAIGN_ID> --daily-budget 10000

# Delete campaign
./meta ads campaign delete <CAMPAIGN_ID>
```

**Campaign Create Options:**

| Flag | Values | Notes |
|------|--------|-------|
| `--name` | text | Required |
| `--objective` | `OUTCOME_LEADS`, `OUTCOME_SALES`, `OUTCOME_TRAFFIC`, `OUTCOME_AWARENESS`, `OUTCOME_ENGAGEMENT`, `OUTCOME_APP_PROMOTION` | Required |
| `--daily-budget` | cents | CBO mode. 5000 = $50.00 |
| `--lifetime-budget` | cents | CBO mode. Mutually exclusive with daily |
| `--status` | `ACTIVE`, `PAUSED` | Default: PAUSED |
| `--bid-strategy` | `LOWEST_COST_WITHOUT_CAP`, `COST_CAP`, `LOWEST_COST_WITH_BID_CAP`, `LOWEST_COST_WITH_MIN_ROAS` | For CBO campaigns |
| `--buying-type` | `AUCTION`, `RESERVED` | Default: AUCTION |
| `--spend-cap` | cents | Lifetime spending limit |
| `--start-time` | ISO 8601 | e.g., `2024-06-01T00:00:00-0700` |
| `--stop-time` | ISO 8601 | Campaign end time |
| `--special-ad-categories` | `HOUSING`, `EMPLOYMENT`, `CREDIT`, etc. | For regulated ads |
| `--adset-budget-sharing` | flag | Enable flex/shared budget across ad sets |

---

### 📋 Ad Sets

```bash
# List all ad sets
./meta ads adset list

# List ad sets for a specific campaign
./meta ads adset list <CAMPAIGN_ID>

# Get a specific ad set
./meta ads adset get <ADSET_ID>

# Create an ad set
./meta ads adset create <CAMPAIGN_ID> \
  --name "Riga — 25-45 — IT Professionals" \
  --daily-budget 2000 \
  --optimization-goal LEAD_GENERATION \
  --billing-event IMPRESSIONS \
  --targeting-countries LV \
  --destination-type ON_AD

# Update ad set
./meta ads adset update <ADSET_ID> --status PAUSED
./meta ads adset update <ADSET_ID> --daily-budget 3000

# Delete ad set
./meta ads adset delete <ADSET_ID>
```

**Ad Set Create Options:**

| Flag | Values | Notes |
|------|--------|-------|
| `--name` | text | Required |
| `--daily-budget` / `--lifetime-budget` | cents | For ABO campaigns |
| `--optimization-goal` | `LEAD_GENERATION`, `OFFSITE_CONVERSIONS`, `LINK_CLICKS`, `IMPRESSIONS`, `REACH`, `VALUE`, etc. | Required |
| `--billing-event` | `IMPRESSIONS`, `LINK_CLICKS`, etc. | Required |
| `--targeting-countries` | comma-separated codes | e.g., `US,CA,GB,LV` |
| `--targeting` | JSON or `@file.json` | Full targeting spec (age, gender, interests, geo, custom audiences) |
| `--destination-type` | `WEBSITE`, `ON_AD`, `MESSENGER`, `WHATSAPP`, etc. | Where conversions happen |
| `--pixel-id` | pixel ID | For conversion tracking |
| `--custom-event-type` | `LEAD`, `PURCHASE`, `COMPLETE_REGISTRATION`, etc. | Used with `--pixel-id` |
| `--status` | `ACTIVE`, `PAUSED` | Default: PAUSED |
| `--start-time` / `--end-time` | ISO 8601 | Scheduling |
| `--advantage-audience` | flag | Let Meta auto-optimize audience |
| `--dynamic-creative` | flag | Required for DCO creatives |
| `--bid-strategy` | same as campaign | For ABO ad sets |
| `--pacing-type` | `standard`, `no_pacing`, `day_parting` | Budget delivery pacing |
| `--promoted-object` | JSON | For non-pixel promoted objects |
| `--attribution-spec` | JSON | Attribution window config |

---

### 🖼️ Creatives

```bash
# List all creatives
./meta ads creative list

# Get creative details
./meta ads creative get <CREATIVE_ID>

# Create a standard creative (image ad)
./meta ads creative create \
  --name "Riga Recruitment — Banner v1" \
  --image ./banner.jpg \
  --page-id 617761998089310 \
  --body "Join CEOFLIGHTS Riga! Premium travel industry careers." \
  --title "Now Hiring in Riga" \
  --link-url "https://ceoflightsriga.lv" \
  --call-to-action APPLY_NOW

# Create a video creative
./meta ads creative create \
  --name "Riga — Video Ad" \
  --video ./promo.mp4 \
  --page-id 617761998089310 \
  --body "Watch and apply!" \
  --title "Join Our Team" \
  --link-url "https://ceoflightsriga.lv" \
  --call-to-action SIGN_UP

# Create a DCO (Dynamic Creative Optimization) creative
./meta ads creative create \
  --name "Riga — DCO Test" \
  --images ./img1.jpg --images ./img2.jpg --images ./img3.jpg \
  --titles "Join Our Team" --titles "Now Hiring" --titles "Apply Today" \
  --bodies "Premium travel careers" --bodies "Great benefits" \
  --page-id 617761998089310 \
  --link-url "https://ceoflightsriga.lv" \
  --call-to-actions APPLY_NOW --call-to-actions LEARN_MORE

# Boost an existing page post
./meta ads creative create \
  --name "Boosted Post" \
  --object-story-id "617761998089310_POST_ID"

# Update / delete
./meta ads creative update <CREATIVE_ID> --name "Updated Name"
./meta ads creative delete <CREATIVE_ID>
```

**Call-to-Action Types:**
`APPLY_NOW`, `BOOK_TRAVEL`, `BUY_NOW`, `CONTACT_US`, `DOWNLOAD`, `GET_OFFER`, `GET_QUOTE`, `LEARN_MORE`, `NO_BUTTON`, `OPEN_LINK`, `SHOP_NOW`, `SIGN_UP`, `SUBSCRIBE`, `WATCH_MORE`

---

### 📢 Ads

```bash
# List all ads in the account
./meta ads ad list

# List ads for a specific ad set
./meta ads ad list <ADSET_ID>

# Get ad details
./meta ads ad get <AD_ID>

# Create an ad (links a creative to an ad set)
./meta ads ad create <ADSET_ID> \
  --name "Riga — Image Ad v1" \
  --creative-id <CREATIVE_ID>

# Update ad
./meta ads ad update <AD_ID> --status PAUSED
./meta ads ad update <AD_ID> --name "New Ad Name"
./meta ads ad update <AD_ID> --creative-id <NEW_CREATIVE_ID>

# Delete ad
./meta ads ad delete <AD_ID>
```

---

### 📈 Insights (Performance Data)

```bash
# Account-level insights (last 30 days, default)
./meta ads insights get

# Last 7 days
./meta ads insights get --date-preset last_7d

# Custom date range
./meta ads insights get --since 2026-06-01 --until 2026-06-30

# Filter to a specific campaign
./meta ads insights get --campaign-id <CAMPAIGN_ID> --date-preset last_7d

# Daily breakdown
./meta ads insights get --time-increment daily --date-preset last_14d

# Breakdown by age + gender
./meta ads insights get --breakdown age --breakdown gender

# Custom fields
./meta ads insights get \
  --fields "spend,impressions,clicks,ctr,cpc,reach,actions,cost_per_action_type" \
  --date-preset last_7d

# Sort by spend
./meta ads insights get --sort spend_descending --limit 10

# JSON output for piping
./meta --output json ads insights get --date-preset last_7d
```

**Date Presets:** `today`, `yesterday`, `last_3d`, `last_7d`, `last_14d`, `last_30d`, `last_90d`, `this_month`, `last_month`

**Time Increments:** `daily`, `weekly`, `monthly`, `all_days`

**Breakdowns:** `age`, `gender`, `country`, `publisher_platform`, `device_platform`, `platform_position`, `impression_device`

**Common Insight Fields:**
`spend`, `impressions`, `clicks`, `ctr`, `cpc`, `cpm`, `reach`, `frequency`, `unique_clicks`, `cost_per_unique_click`, `actions`, `cost_per_action_type`, `conversions`, `cost_per_conversion`

---

### 📄 Pages

```bash
# List pages you have access to
./meta ads page list

# Get page details
./meta ads page get <PAGE_ID>
```

---

### 💡 Guidance (Recommendations)

```bash
# Get account-level recommendations
./meta ads guidance list

# JSON output
./meta --output json ads guidance list
```

---

### 🏪 Catalogs & Products

```bash
# Manage product catalogs
./meta ads catalog list
./meta ads catalog get <CATALOG_ID>

# Manage product feeds
./meta ads product-feed list <CATALOG_ID>

# Manage product items
./meta ads product-item list <CATALOG_ID>

# Manage product sets
./meta ads product-set list <CATALOG_ID>
```

---

### 📊 Datasets (Pixels)

```bash
./meta ads dataset list
./meta ads dataset get <DATASET_ID>
```

---

### 🔬 Studies (Experiments)

```bash
./meta ads study list
./meta ads study get <STUDY_ID>
```

---

### 🏦 Ad Accounts

```bash
./meta ads adaccount list
./meta ads adaccount get <AD_ACCOUNT_ID>
```

---

## CEOFLIGHTS Riga — Quick Reference

### Account Details

| Property | Value |
|----------|-------|
| Ad Account | `act_4348465385481504` |
| Page ID | `617761998089310` |
| API Version | `v21.0` |

### Active Campaigns

| Campaign | ID | Status |
|----------|------|--------|
| Recruitment June 2026 v2 (Leads) | `120250841209050432` | ACTIVE |
| Latvian Recruitment June 2026 (Leads) | `120250213909570432` | PAUSED |

### Common Workflows

**Check campaign performance:**
```bash
./meta ads insights get --campaign-id 120250841209050432 --date-preset last_7d
```

**Pause/resume a campaign:**
```bash
./meta ads campaign update 120250841209050432 --status PAUSED
./meta ads campaign update 120250841209050432 --status ACTIVE
```

**Get daily performance breakdown:**
```bash
./meta ads insights get --campaign-id 120250841209050432 --time-increment daily --date-preset last_14d
```

**List all ads in active campaign:**
```bash
./meta ads ad list --output json | jq '.data[] | {name, status, id}'
```

---

## Full Campaign Creation Workflow

The typical flow to deploy a new campaign:

```bash
# 1. Create campaign (PAUSED by default)
./meta ads campaign create \
  --name "CEOFLIGHTS Riga — New Role July 2026 (Leads)" \
  --objective OUTCOME_LEADS \
  --daily-budget 3000

# 2. Create ad set with targeting
./meta ads adset create <CAMPAIGN_ID> \
  --name "Riga — 25-45 — Broad" \
  --optimization-goal LEAD_GENERATION \
  --billing-event IMPRESSIONS \
  --targeting-countries LV \
  --destination-type ON_AD \
  --status PAUSED

# 3. Create creative(s)
./meta ads creative create \
  --name "New Role — Banner" \
  --image ./ad_banner.jpg \
  --page-id 617761998089310 \
  --body "Join CEOFLIGHTS Riga!" \
  --title "Now Hiring" \
  --link-url "https://ceoflightsriga.lv" \
  --call-to-action APPLY_NOW

# 4. Create ad (link creative to ad set)
./meta ads ad create <ADSET_ID> \
  --name "New Role — Image Ad" \
  --creative-id <CREATIVE_ID>

# 5. Review everything, then activate
./meta ads campaign update <CAMPAIGN_ID> --status ACTIVE
```

---

## Output Formats

```bash
# Table (default, human-readable)
./meta ads campaign list

# JSON (for scripting/piping)
./meta --output json ads campaign list

# Plain text
./meta --output plain ads campaign list

# Pipe JSON to jq
./meta --output json ads insights get --date-preset last_7d | jq '.data[0].spend'
```

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `Not authenticated` | Check `.env.meta-ads` has a valid token; run `./meta auth status` |
| `Token expired` | Regenerate in Meta Business Suite → Settings → System User |
| `(#100) Invalid parameter` | Check required fields; use `--help` on the command |
| `Dynamic Creative ads can only be...` | Add `--dynamic-creative` to the ad set |
| `Permissions error` | Ensure system user has `ads_management` scope |
