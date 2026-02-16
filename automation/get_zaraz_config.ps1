$headers = @{
    "Authorization" = "Bearer $env:CLOUDFLARE_API_TOKEN"
    "Content-Type" = "application/json"
}

if (-not $env:CLOUDFLARE_API_TOKEN -or -not $env:CLOUDFLARE_ZONE_ID) {
    Write-Host "Missing CLOUDFLARE_API_TOKEN or CLOUDFLARE_ZONE_ID environment variables." -ForegroundColor Red
    exit 1
}
try {
    $response = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$($env:CLOUDFLARE_ZONE_ID)/zaraz/config" -Method Get -Headers $headers
    $response.result | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $_"
}
