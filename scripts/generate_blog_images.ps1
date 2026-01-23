Write-Host "Triggering Blog Image Generation (Nano Banana Pro Style)..."
try {
    $response = Invoke-RestMethod -Method Post -Uri "http://localhost:5000/api/ai/generate-blog-images"
    Write-Host "Success!"
    Write-Host $response.message
    $response.results | Format-Table
} catch {
    Write-Error "Failed to connect to backend server. Make sure 'npm run server' is running on port 5000."
    Write-Error $_
}
