$headers = @{
    "Authorization" = "Bearer cues1gVpytmIvY_TyYn4QqNwVY4pcGvwCdfiZ9w0"
    "Content-Type" = "application/json"
}

Write-Host "Verifying Token..."
try {
    $verify = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/accounts/f139034ef7924a1d387c88f394b535a2/tokens/verify" -Method Get -Headers $headers
    Write-Host "Status: $($verify.result.status)"
    
    if ($verify.result.status -eq "active") {
        Write-Host "Token Verified!" -ForegroundColor Green
    }
} catch {
    Write-Host "Error verifying token: $_" -ForegroundColor Red
}
