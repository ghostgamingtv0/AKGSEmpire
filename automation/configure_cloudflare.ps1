# Cloudflare Best Settings Script for AKGS Empire
# Zone ID: dd6f87708289237323be906271272de6

$zoneId = "dd6f87708289237323be906271272de6"
$token = "cues1gVpytmIvY_TyYn4QqNwVY4pcGvwCdfiZ9w0"
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

function Update-Setting ($setting, $body) {
    $url = "https://api.cloudflare.com/client/v4/zones/$zoneId/settings/$setting"
    try {
        Write-Host "Updating $setting..." -NoNewline
        $response = Invoke-RestMethod -Uri $url -Method Patch -Headers $headers -Body ($body | ConvertTo-Json -Depth 5)
        if ($response.success) {
            Write-Host " [OK] ✅" -ForegroundColor Green
        } else {
            Write-Host " [FAILED] ❌" -ForegroundColor Red
            Write-Host $response.errors[0].message -ForegroundColor Yellow
        }
    } catch {
        Write-Host " [ERROR] ❌" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Yellow
    }
}

# 1. SSL/TLS: Full (Strict)
Update-Setting "ssl" @{ value = "strict" }

# 2. Always Use HTTPS: On
Update-Setting "always_use_https" @{ value = "on" }

# 3. Auto Minify: All On
Update-Setting "minify" @{ value = @{ css = "on"; html = "on"; js = "on" } }

# 4. Brotli Compression: On
Update-Setting "brotli" @{ value = "on" }

# 5. Rocket Loader: Off (Critical for React/Vite to prevent hydration issues)
Update-Setting "rocket_loader" @{ value = "off" }

# 6. Security Level: Medium
Update-Setting "security_level" @{ value = "medium" }

# 7. Browser Cache TTL: Respect Existing Headers (0 or higher if preferred, usually 0 for SPA updates)
# Update-Setting "browser_cache_ttl" @{ value = 0 }

Write-Host "`nCloudflare Best Settings Configuration Complete! 🚀" -ForegroundColor Cyan
