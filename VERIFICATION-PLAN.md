# NammaShield Verification Plan (End-to-End)

Base URL used in examples:

- https://nammashield-guidewire-production.up.railway.app

## 1) Preflight Checks

### Steps

1. Run build locally:
   - `npm run build`
2. Open app in browser and confirm pages load:
   - `/`
   - `/onboarding`
   - `/dashboard`
   - `/dashboard/admin`
3. Confirm required Railway env vars exist:
   - `DATABASE_URL`
   - `ML_API_URL` (or `NEXT_PUBLIC_ML_API_URL`)
   - `OPENWEATHERMAP_API_KEY`
   - `MOCK_UPI_FAIL_RATE`

### Pass Criteria

- Build succeeds.
- No 500s on main pages.
- Demo login endpoint returns a valid worker id.

---

## 2) API Smoke Tests (Core + New Endpoints)

Use PowerShell:

```powershell
$base='https://nammashield-guidewire-production.up.railway.app'

# Demo login
Invoke-RestMethod -Method Post -Uri "$base/api/auth/demo" -ContentType 'application/json' -Body '{}'

# Risk quote
$quoteBody = @{ city='Chennai'; zone='Zone 3 - T Nagar'; streak_weeks=3; tier='Standard' } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "$base/api/risk/quote" -ContentType 'application/json' -Body $quoteBody

# Platform verify mock
$verifyBody = @{ platform='Swiggy'; screenshot_name='test.png' } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "$base/api/platforms/verify-partner" -ContentType 'application/json' -Body $verifyBody

# Traffic mock
Invoke-RestMethod -Method Get -Uri "$base/api/triggers/traffic?city=Chennai&zone=Zone%203%20-%20T%20Nagar"

# Disruptions mock (AQI + social)
Invoke-RestMethod -Method Get -Uri "$base/api/triggers/disruptions?city=Chennai&zone=Zone%203%20-%20T%20Nagar"
```

### Pass Criteria

- All endpoints return 200.
- Response schema is correct:
  - `/api/risk/quote` includes `risk_score`, `tier`, `weekly_premium`, `coverage_amount`.
  - `/api/platforms/verify-partner` includes `partnerId`, `confidence`.
  - Trigger mocks return non-empty payloads.

---

## 3) Server-Side Pricing Enforcement

Goal: verify backend computes persisted premium/coverage.

### Steps

1. Create/get worker via `/api/auth/demo`.
2. Patch worker city/zone.
3. Call policy switch with tier only:

```powershell
$switchBody = @{ tier='Pro' } | ConvertTo-Json
Invoke-RestMethod -Method Patch -Uri "$base/api/workers/$wid/policy" -ContentType 'application/json' -Body $switchBody
```

4. Check worker dashboard/policy API output to verify updated premium and coverage.

### Pass Criteria

- API responds with computed quote.
- Persisted values follow server quote logic, not UI constants.

---

## 4) Onboarding Flow Validation

### Steps

1. Complete onboarding UI flow end-to-end.
2. In platform step, ensure partner ID appears after verification.
3. In location step, ensure risk check runs and proceeds.
4. Activate plan.

### Pass Criteria

- Partner verification returns generated partner id.
- City/zone gets persisted before activation.
- Policy is created and dashboard opens.

---

## 5) Trigger Monitoring + Automation

### Steps

1. Run cron monitor repeatedly:

```powershell
Invoke-RestMethod -Method Get -Uri "$base/api/cron/trigger-monitor"
```

2. Also run manual simulation to seed claim flow:

```powershell
$simBody = @{ event_type='heavy_rain'; city='Chennai'; zone='Zone 3 - T Nagar'; severity='severe'; threshold_value=20; duration_hours=5 } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "$base/api/triggers/simulate" -ContentType 'application/json' -Body $simBody
```

3. Fetch admin summary and inspect trigger breakdown:

```powershell
Invoke-RestMethod -Method Get -Uri "$base/api/admin/summary"
```

### Pass Criteria

- Weather and non-weather trigger processing paths execute without errors.
- Claims are created from trigger events automatically.

---

## 6) Duplicate Prevention Checks

### Steps

1. Fire same simulation payload twice in short interval.
2. Fetch claims each time:

```powershell
Invoke-RestMethod -Method Get -Uri "$base/api/workers/$wid/claims?limit=20"
```

3. Compare claim counts and IDs.

### Pass Criteria

- No duplicate claims for same worker-policy-trigger combination.
- Trigger monitor does not spam repeated identical trigger inserts in dedupe window.

---

## 7) Fraud Detection Validation

### Steps

1. Seed GPS logs:

```powershell
Invoke-RestMethod -Method Post -Uri "$base/api/gps/simulate"
```

2. Run simulation and monitor.
3. Fetch queue and summary:

```powershell
Invoke-RestMethod -Method Get -Uri "$base/api/admin/queue"
Invoke-RestMethod -Method Get -Uri "$base/api/admin/summary"
```

### Pass Criteria

- Claims have fraud score and decision path.
- Reason codes appear in admin fraud view/summary payload.

---

## 8) Payout Flow Validation (Success + Failure)

### Success Path

1. Keep normal fail rate (e.g. `MOCK_UPI_FAIL_RATE=0.15`).
2. Trigger claims.
3. Check worker claims payload has:
   - `payout_status='completed'`
   - `payout_channel`
   - `payout_processed_at`

### Failure Path

1. Temporarily set high fail rate (e.g. `0.95`) in Railway.
2. Trigger claims again.
3. Check worker claims payload has:
   - `payout_status='failed'`
   - `payout_failure_reason`

### Pass Criteria

- Success and failure states are both visible.
- No silent failures.
- Retry/failure handling is persisted.

---

## 9) Dashboard Functional Checks

### Worker Dashboard

Verify visible and updating:

- Active weekly coverage status
- Upcoming coverage period
- Total earnings protected to date
- Recent claims and live trigger feed

### Admin Dashboard

Verify visible and updating:

- Active workers/policies, total payouts, loss ratio
- Zone loss ratios
- Predictive outlook
- Fraud audit trail
- Review queue

### Pass Criteria

- Data appears and updates after simulations/cron runs.
- No section fails with 500.

---

## 10) Regression and Stability

### Steps

1. Execute 3-5 cycles:
   - demo login
   - patch worker
   - simulate trigger
   - run trigger monitor
   - fetch claims/summary
2. Refresh dashboards repeatedly.

### Pass Criteria

- No crash loops.
- Claim/payout state transitions remain consistent.
- Duplicate guard remains effective under repeated runs.

---

## Suggested PowerShell Quick Run (Core Validation)

```powershell
$base='https://nammashield-guidewire-production.up.railway.app'

$demo = Invoke-RestMethod -Method Post -Uri "$base/api/auth/demo" -ContentType 'application/json' -Body '{}'
$wid = $demo.workerId
Write-Output "Worker: $wid"

$patchBody = @{ city='Chennai'; zone='Zone 3 - T Nagar'; name='Demo Partner'; is_onboarded=$true; streak_weeks=3 } | ConvertTo-Json
Invoke-RestMethod -Method Patch -Uri "$base/api/workers/$wid" -ContentType 'application/json' -Body $patchBody | Out-Null

$quoteBody = @{ city='Chennai'; zone='Zone 3 - T Nagar'; streak_weeks=3; tier='Standard' } | ConvertTo-Json
$quote = Invoke-RestMethod -Method Post -Uri "$base/api/risk/quote" -ContentType 'application/json' -Body $quoteBody
Write-Output "Quote weekly premium: $($quote.weekly_premium), tier: $($quote.tier)"

$verifyBody = @{ platform='Swiggy'; screenshot_name='test.png' } | ConvertTo-Json
$verify = Invoke-RestMethod -Method Post -Uri "$base/api/platforms/verify-partner" -ContentType 'application/json' -Body $verifyBody
Write-Output "Partner ID: $($verify.partnerId)"

$simBody = @{ event_type='heavy_rain'; city='Chennai'; zone='Zone 3 - T Nagar'; severity='severe'; threshold_value=20; duration_hours=5 } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "$base/api/triggers/simulate" -ContentType 'application/json' -Body $simBody | Out-Null

Invoke-RestMethod -Method Get -Uri "$base/api/cron/trigger-monitor" | Out-Null

$claims = Invoke-RestMethod -Method Get -Uri "$base/api/workers/$wid/claims?limit=10"
$summary = Invoke-RestMethod -Method Get -Uri "$base/api/admin/summary"

Write-Output "Claims fetched: $($claims.claims.Count)"
Write-Output "Admin active policies: $($summary.activePolicies), loss ratio: $($summary.lossRatio)"
```

---

## Final Sign-Off Checklist

Mark release-ready only when all are true:

- [ ] Build passes.
- [ ] Risk quote + platform verify endpoints pass.
- [ ] Policy pricing is backend-computed on activation/switch/renew.
- [ ] Trigger monitor runs without errors and creates actionable events.
- [ ] Duplicate claim prevention validated.
- [ ] Fraud scoring + reason codes visible in admin.
- [ ] Payout success and failure both correctly persisted and surfaced.
- [ ] Worker and admin dashboards reflect live updates.
- [ ] Repeated runs stay stable with no inconsistent states.
