$headers = @{
    "Authorization" = "Bearer cues1gVpytmIvY_TyYn4QqNwVY4pcGvwCdfiZ9w0"
    "Content-Type" = "application/json"
}
try {
    $response = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/dd6f87708289237323be906271272de6/zaraz/config" -Method Get -Headers $headers
    $response.result | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $_"
}