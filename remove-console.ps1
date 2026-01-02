# Script to remove all console statements from JavaScript/JSX files

$files = Get-ChildItem -Path "src" -Include "*.js","*.jsx","*.ts","*.tsx" -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    # Remove console.log statements
    $content = $content -replace 'console\.log\([^;]*\);?\s*', ''
    
    # Remove console.error statements
    $content = $content -replace 'console\.error\([^;]*\);?\s*', ''
    
    # Remove console.warn statements
    $content = $content -replace 'console\.warn\([^;]*\);?\s*', ''
    
    # Remove console.info statements
    $content = $content -replace 'console\.info\([^;]*\);?\s*', ''
    
    # Remove console.debug statements
    $content = $content -replace 'console\.debug\([^;]*\);?\s*', ''
    
    # Remove standalone console statements with comments
    $content = $content -replace '(?m)^\s*console\.[a-z]+\([^\)]*\);\s*$\r?\n?', ''
    
    # Remove console statements that span multiple lines (basic pattern)
    $content = $content -replace '(?s)console\.[a-z]+\(\s*[^)]*?\);', ''
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host "Updated: $($file.FullName)"
    }
}

Write-Host "Console statements removal completed!"
