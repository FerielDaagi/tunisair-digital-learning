Write-Host "Test d'upload avec PowerShell"

# Creer un fichier de test
"Contenu de test" | Out-File -FilePath "test-file.txt" -Encoding UTF8

Write-Host "Test 1: Upload simple"
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5002/test1" -Method POST -ContentType "multipart/form-data" -InFile "test-file.txt"
    Write-Host "Test 1 reussi"
    Write-Host $response.Content
} catch {
    Write-Host "Test 1 echoue: $($_.Exception.Message)"
}

Write-Host "Test 2: Upload avec urlencoded"
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5002/test2" -Method POST -ContentType "multipart/form-data" -InFile "test-file.txt"
    Write-Host "Test 2 reussi"
    Write-Host $response.Content
} catch {
    Write-Host "Test 2 echoue: $($_.Exception.Message)"
}

# Nettoyage
Remove-Item "test-file.txt" -ErrorAction SilentlyContinue

Write-Host "Tests termines"
