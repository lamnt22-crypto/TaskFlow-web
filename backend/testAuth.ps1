$baseUrl = 'http://localhost:5000/api/auth'

Write-Host "1. Registering user..."
try {
    $registerResp = Invoke-RestMethod -Uri "$baseUrl/register" -Method Post -Body (@{username='lamnguyen'; email='lam@gmail.com'; password='password123'} | ConvertTo-Json) -ContentType 'application/json'
    Write-Host "Register Success: $($registerResp.success)"
} catch {
    Write-Host "Register Failed or User Exists: $($_.Exception.Message)"
}

Write-Host "`n2. Logging in..."
$loginResp = Invoke-RestMethod -Uri "$baseUrl/login" -Method Post -Body (@{email='lam@gmail.com'; password='password123'} | ConvertTo-Json) -ContentType 'application/json'
Write-Host "Login Success: $($loginResp.success)"
$accessToken = $loginResp.accessToken
$refreshToken = $loginResp.refreshToken

Write-Host "`n3. Accessing protected route (/me)..."
$meResp = Invoke-RestMethod -Uri "$baseUrl/me" -Method Get -Headers @{Authorization="Bearer $accessToken"}
Write-Host "Me Route Success: $($meResp.success) - User Email: $($meResp.data.email)"

Write-Host "`n4. Refreshing token..."
$refreshResp = Invoke-RestMethod -Uri "$baseUrl/refresh-token" -Method Post -Body (@{refreshToken=$refreshToken} | ConvertTo-Json) -ContentType 'application/json'
Write-Host "Refresh Success: $($refreshResp.success)"
$newAccessToken = $refreshResp.accessToken

Write-Host "`n5. Accessing protected route with NEW token..."
$meResp2 = Invoke-RestMethod -Uri "$baseUrl/me" -Method Get -Headers @{Authorization="Bearer $newAccessToken"}
Write-Host "Me Route with New Token Success: $($meResp2.success)"

Write-Host "`n6. Logging out..."
$logoutResp = Invoke-RestMethod -Uri "$baseUrl/logout" -Method Post -Body (@{refreshToken=$refreshToken} | ConvertTo-Json) -ContentType 'application/json'
Write-Host "Logout Success: $($logoutResp.success)"

Write-Host "`n7. Verifying refresh token is deleted (should fail)..."
try {
    Invoke-RestMethod -Uri "$baseUrl/refresh-token" -Method Post -Body (@{refreshToken=$refreshToken} | ConvertTo-Json) -ContentType 'application/json'
    Write-Host "ERROR: Refresh token still works after logout!"
} catch {
    Write-Host "Refresh Token invalidated successfully (401 expected): $($_.Exception.Message)"
}
