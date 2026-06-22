$body = '{"username":"austin@ceoflights.com","password":"Samsung23$#%"}'
$r = Invoke-RestMethod -Uri "https://app.testgorilla.com/api/profiles/login/" -Method POST -Headers @{"Content-Type"="application/json"; "Origin"="https://app.testgorilla.com"} -Body $body
$token = $r.token
$headers = @{"Authorization"="Token $token"; "Content-Type"="application/json"}

# Get the full candidature details for Austin's test invite
Write-Host "=== Candidature Details for UUID 2cdec151 ==="
$r = Invoke-RestMethod -Uri "https://app.testgorilla.com/api/assessments/candidature/?assessment=1547206&search=austin@ceoflights.com&limit=5" -Headers $headers
foreach ($c in $r.results) {
    Write-Host "full_name: $($c.full_name)"
    Write-Host "email: $($c.email)"
    Write-Host "invitation_uuid: $($c.invitation_uuid)"
    Write-Host "invitation_link: $($c.invitation_link)"
    Write-Host "status: $($c.status)"
    Write-Host "---"
}

# Also try a fresh invite to see what the API returns
Write-Host "`n=== Testing Fresh Invite Response ==="
$inviteBody = '{"email":"test.redirect.check@gmail.com","first_name":"Redirect","last_name":"Check"}'
try {
    $inv = Invoke-RestMethod -Uri "https://app.testgorilla.com/api/assessments/1547206/invite_candidate/?no_email=true" -Method POST -Headers $headers -Body $inviteBody
    Write-Host "Raw response:"
    $inv | ConvertTo-Json -Depth 5
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $body = $reader.ReadToEnd()
    Write-Host "Body: $body"
}
