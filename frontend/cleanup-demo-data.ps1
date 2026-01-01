# PowerShell script to remove demo data from frontend
# Run from frontend directory: .\cleanup-demo-data.ps1

Write-Host "=== REMOVING ALL DEMO DATA FROM FRONTEND ===" -ForegroundColor Green
Write-Host ""

# Find and remove demo data patterns
$files = Get-ChildItem -Path "src" -Recurse -Filter "*.tsx" -File

$removedCount = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    $modified = $false

    # Remove mock data constants
    if ($content -match "const\s+\w+\s*=\s*\[.*?\]\s*;" -or 
        $content -match "const\s+\w+\s*=\s*\{.*?\}\s*;" -or
        $content -match "MOCK_|DEMO_|SAMPLE_|FAKE_") {
        
        # Remove entire mock data declarations
        $content = $content -replace "(?s)const\s+\w*MOCK\w*\s*=\s*\[.*?\];", ""
        $content = $content -replace "(?s)const\s+\w*DEMO\w*\s*=\s*\[.*?\];", ""
        $content = $content -replace "(?s)const\s+\w*SAMPLE\w*\s*=\s*\[.*?\];", ""
        $content = $content -replace "(?s)const\s+\w*FAKE\w*\s*=\s*\[.*?\];", ""
        
        $modified = $true
    }

    # Replace hardcoded useState arrays with empty arrays
    if ($content -match 'useState\(\[.*?\]\)') {
        $content = $content -replace 'useState\(\[.*?\]\)', 'useState<any[]>([])'
        $modified = $true
    }

    # Remove PROJECT_TYPES, SAMPLE_PROJECTS arrays
    if ($content -match "PROJECT_TYPES|SAMPLE_PROJECTS") {
        $content = $content -replace "(?s)const\s+PROJECT_TYPES\s*=\s*\[.*?\];", ""
        $content = $content -replace "(?s)const\s+SAMPLE_PROJECTS\s*=\s*\[.*?\];", ""
        $modified = $true
    }

    if ($modified) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "✅ Cleaned: $($file.Name)" -ForegroundColor Yellow
        $removedCount++
    }
}

Write-Host ""
Write-Host "✅ Demo data removal complete! Cleaned $removedCount files" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Review changes: git diff" -ForegroundColor Gray
Write-Host "2. Test locally: npm run dev" -ForegroundColor Gray
Write-Host "3. Commit: git add . && git commit -m 'Remove demo data'" -ForegroundColor Gray

