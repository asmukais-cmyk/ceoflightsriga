# TestGorilla API Workflow (`/testgorilla`)

When the user types `/testgorilla` in any conversation, use this reference to interact with the TestGorilla API.

---

## Authentication

**Credentials** are stored in `c:\ANTIGRAVITY\CF Riga Video\.env`:
```
Username: austin@ceoflights.com
Password: Samsung23$#%
```

**Login endpoint** — returns a session token:
```
POST https://app.testgorilla.com/api/profiles/login/
Headers: Content-Type: application/json, Origin: https://app.testgorilla.com
Body: {"username":"austin@ceoflights.com","password":"Samsung23$#%"}
Response: {"token": "625fd23d..."}
```

**Use the token** in all subsequent requests:
```
Authorization: Token <TOKEN>
```

> **Note:** Tokens may expire. If you get a 401, re-authenticate via the login endpoint.

---

## API Reference

Base URL: `https://app.testgorilla.com/api/`

### 1. Assessments

#### List All Assessments
```
GET /api/assessments/
Query Params:
  status    = new | active | archived (comma-separated, default: all)
  ordering  = modified | name | candidates | finished_percentage (prefix - for desc)
  limit     = number (default: 10)
  offset    = number (default: 0)
```

**Live data (21 assessments total):**

| ID | Status | Name |
|---|---|---|
| 1107931 | archived | Travel Agent - Worldwide - Remote |
| 1279422 | active | Travel Agent |
| 1292916 | archived | Worldwide and 2 other - Hybrid |
| 1355802 | archived | Travel Agent (Riga) |
| 1355805 | archived | Travel Agent - Latvia - On-site |
| 1368427 | archived | Copy of Travel Agent |
| 1368428 | archived | Customer Service Manager |
| 1369110 | active | Customer Service Manager |
| 1370216 | active | Ticketing Agent |
| 1374051 | active | Travel Agent (2) |

#### Get Assessment Detail
```
GET /api/assessments/<ASSESSMENT_ID>/
```
Returns: tests, public_links, candidate counts, status, etc.

---

### 2. Candidates

#### List Candidates for an Assessment
```
GET /api/assessments/candidature/?assessment=<ASSESSMENT_ID>
Query Params:
  status   = invited | started | completed (default: all)
  stage    = NYE | EVA | IFI | INT | IFT | TTC | REF | OFS | HIR | REJ (default: all)
  ordering = created | _full_name | avg_score | rating (prefix - for desc)
  limit    = number (default: 10)
  offset   = number (default: 0)
```

**Stage codes:**
| Code | Meaning |
|---|---|
| NYE | Not Yet Evaluated |
| EVA | Evaluated |
| IFI | Invited for Interview |
| INT | Interviewed |
| IFT | Invited for Take-Home Test |
| TTC | Take-Home Test Completed |
| REF | References Checked |
| OFS | Offer Sent |
| HIR | Hired |
| REJ | Rejected |
| CWD | Custom Workflow Default (undocumented) |

**Response fields:** `id` (candidature_id), `full_name`, `email`, `avg_score`, `status`, `stage`, `testtaker_id`, `rating`, `invitation_link`, `invitation_uuid`

#### Get Candidate Detail
```
GET /api/assessments/candidates/<TESTTAKER_ID>/
```
Returns: full_name, email, tests taken, assessments list, last_activity

#### Get Anti-Cheating Flags
```
GET /api/assessments/candidates/<TESTTAKER_ID>/?candidature=<CANDIDATURE_ID>
```
Returns: `is_exited_full_screen`, `is_left_screen`, `repeated_ip`, `is_camera_enabled`

---

### 3. Test Results

#### Get Results for a Candidate in an Assessment
```
GET /api/assessments/results/?candidature__assessment=<ASSESSMENT_ID>&candidature__test_taker=<TESTTAKER_ID>
```
Both params required.

**Response fields per test:**
- `id` — test result ID
- `name` — test name (e.g., "Travel Agent Customer Interaction Assessment")
- `score` — numeric score (null for personality/custom)
- `algorithm` — `basic` | `custom_questions` | `big_5` | `enneagram` | `disc` | `16_types` | `culture_fit` | `noop`
- `score_display` — formatted score string
- `display_normalized_percentile_score` — percentile vs all TG candidates
- `completed` — boolean
- `custom_questions` — array of question/answer objects (for custom_questions algorithm)

#### Get Individual Test Result Detail
```
GET /api/assessments/results/<TEST_RESULT_ID>/
```
Returns: `duration` (seconds allowed), `response_time` (seconds used), question details

#### Download Results as PDF
```
GET /api/assessments/candidates/<TESTTAKER_ID>/render_pdf/?candidature=<CANDIDATURE_ID>
```
Returns: PDF binary stream

---

### 4. Invitations

#### Invite Candidate by Email
```
POST /api/assessments/<ASSESSMENT_ID>/invite_candidate/
Body: {"email":"john@example.com","first_name":"John","last_name":"Smith"}
```
Add `?no_email=true` to suppress the invitation email (returns `invitation_link` instead).

#### Re-invite Candidate
```
POST /api/assessments/candidature/<CANDIDATURE_ID>/send-invitation/
Body: {}
```

#### Create/Manage Public Links
```
GET https://app.testgorilla.com/testtaker/publicinvitation/<PUBLIC_LINK_UUID>
PUT /api/assessments/public_links/<PUBLIC_LINK_ID>/
Body: {"active": true|false, "label":"Main", "assessment":<ASSESSMENT_ID>}
```

---

### 5. Candidate Management

#### Change Candidature Stage (e.g., Reject)
```
PATCH /api/assessments/candidature/<CANDIDATURE_ID>/change_stage/
Body: {"stage": "REJ"}
```

#### Delete Candidate from Assessment
```
DELETE /api/assessments/candidature/<CANDIDATURE_ID>/
```

#### Send Rejection Reminder Email
```
POST /api/assessments/candidature/<CANDIDATURE_ID>/send-reminder/
```
Candidature must already be in REJ status.

---

### 6. Personality & Coding Tests

#### Get Personality Description
```
GET /api/tests/personality/<ALGORITHM>/<SCORE>
```
Example: `GET /api/tests/personality/16_types/INTJ` → HTML description

#### Get Coding Test Report
```
GET /api/assessments/code_questions/<TEST_RESULT_ID>/invitation_token/
```
Returns `invitation_uuid` → Report URL: `https://app.testgorilla.com/customer/candidates/code-report/<UUID>`

---

## Result Type Algorithms

| Algorithm | Score Field | Description |
|---|---|---|
| `basic` | `score` (0-100) | Standard skill tests |
| `custom_questions` | `score` (0-100) | Your custom questions |
| `big_5` | `score_display` | Format: `E-A-C-ES-O_raw` (1-5 calibrated + decimal raw) |
| `enneagram` | `score_display` | Text type (e.g., "Go-getter", "Pioneer") |
| `disc` | `score_display` | DISC profile type |
| `16_types` | `score_display` | MBTI-style (e.g., "INTJ", "ENFP") |
| `culture_fit` | `score_display` | Culture add result |
| `noop` | — | No automatic scoring (manually review) |

---

## Rate Limits

- Rate limits are **per minute per token**
- Response headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- Exceeding returns `429 Too Many Requests`
- Implement exponential backoff

---

## PowerShell Quick Reference

### Authenticate
```powershell
$body = '{"username":"austin@ceoflights.com","password":"Samsung23$#%"}'
$r = Invoke-RestMethod -Uri "https://app.testgorilla.com/api/profiles/login/" -Method POST -Headers @{"Content-Type"="application/json"; "Origin"="https://app.testgorilla.com"} -Body $body
$token = $r.token
$headers = @{"Authorization"="Token $token"; "Content-Type"="application/json"}
```

### List Active Assessments
```powershell
$r = Invoke-RestMethod -Uri "https://app.testgorilla.com/api/assessments/?status=active" -Headers $headers
$r.results | ForEach-Object { Write-Host "$($_.id) | $($_.name)" }
```

### Get Completed Candidates for Assessment
```powershell
$r = Invoke-RestMethod -Uri "https://app.testgorilla.com/api/assessments/candidature/?assessment=1374051&status=completed&limit=50" -Headers $headers
$r.results | ForEach-Object { Write-Host "$($_.full_name) | Score: $($_.avg_score) | Stage: $($_.stage)" }
```

### Get Test Results for a Candidate
```powershell
$r = Invoke-RestMethod -Uri "https://app.testgorilla.com/api/assessments/results/?candidature__assessment=1374051&candidature__test_taker=6386717" -Headers $headers
$r.results | ForEach-Object { Write-Host "$($_.name): $($_.score) (percentile: $($_.display_normalized_percentile_score))" }
```

### Reject a Candidate
```powershell
Invoke-RestMethod -Uri "https://app.testgorilla.com/api/assessments/candidature/<CANDIDATURE_ID>/change_stage/" -Method PATCH -Headers $headers -Body '{"stage":"REJ"}'
```

---

## Typical Workflow

1. **Authenticate** → get token
2. **List assessments** → find the right assessment ID
3. **List candidates** → filter by `status=completed`, sort by `ordering=-avg_score`
4. **Get results** → for each candidate, pull detailed test scores
5. **Review** → check anti-cheating flags, custom question answers
6. **Manage** → change stage (IFI, HIR, REJ), send rejection emails

## Official Documentation
- [Assessments](https://docs.testgorilla.com/apis/assessments)
- [Invitations](https://docs.testgorilla.com/apis/invitations)
- [Candidates](https://docs.testgorilla.com/apis/candidates)
- [Test Results](https://docs.testgorilla.com/apis/results)
- [Result Types](https://docs.testgorilla.com/apis/result-types)
- [Rate Limits](https://docs.testgorilla.com/apis/rate-limits)
