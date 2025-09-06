Write-Host "🧪 Test d'upload avec PowerShell" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

# Créer un fichier de test
"Contenu de test" | Out-File -FilePath "test-file.txt" -Encoding UTF8

Write-Host "`n📋 Test 1: Upload simple avec fichier" -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5002/test1" -Method POST -ContentType "multipart/form-data" -InFile "test-file.txt"
    Write-Host "✅ Test 1 réussi" -ForegroundColor Green
    Write-Host $response.Content
} catch {
    Write-Host "❌ Test 1 échoué: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n📋 Test 2: Upload avec urlencoded" -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5002/test2" -Method POST -ContentType "multipart/form-data" -InFile "test-file.txt"
    Write-Host "✅ Test 2 réussi" -ForegroundColor Green
    Write-Host $response.Content
} catch {
    Write-Host "❌ Test 2 échoué: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n📋 Test 3: Upload avec json + urlencoded" -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5002/test3" -Method POST -ContentType "multipart/form-data" -InFile "test-file.txt"
    Write-Host "✅ Test 3 réussi" -ForegroundColor Green
    Write-Host $response.Content
} catch {
    Write-Host "❌ Test 3 échoué: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🧹 Nettoyage" -ForegroundColor Yellow
Remove-Item "test-file.txt" -ErrorAction SilentlyContinue

Write-Host "`n✅ Tests terminés!" -ForegroundColor Green
