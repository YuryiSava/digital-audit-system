# Release v0.3.0 - Pre-Audit Setup
# PowerShell скрипт для создания git tag и фиксации релиза

Write-Host "🎉 Creating Release v0.3.0" -ForegroundColor Green
Write-Host "==========================" -ForegroundColor Green
Write-Host ""

# Проверка что мы в правильной директории
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found. Run this script from project root." -ForegroundColor Red
    exit 1
}

# Проверка версии в package.json
$packageJson = Get-Content "package.json" | ConvertFrom-Json
$version = $packageJson.version
Write-Host "📦 Current version: $version" -ForegroundColor Cyan

if ($version -ne "0.3.0") {
    Write-Host "⚠️  Warning: package.json version is $version, expected 0.3.0" -ForegroundColor Yellow
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y") {
        exit 1
    }
}

Write-Host ""
Write-Host "📝 Release Notes:" -ForegroundColor Cyan
Write-Host "- Pre-Audit Setup Wizard (3 steps)"
Write-Host "- Freeze Baseline functionality"
Write-Host "- Requirement Set Publishing"
Write-Host "- Extended Project Model (6 new fields)"
Write-Host "- UI Cleanup (removed old AI parsing button)"
Write-Host ""

# Git operations
Write-Host "🔍 Checking git status..." -ForegroundColor Cyan
git status --short

Write-Host ""
$stageChanges = Read-Host "Stage all changes? (y/n)"
if ($stageChanges -eq "y") {
    git add .
    Write-Host "✅ Changes staged" -ForegroundColor Green
}

Write-Host ""
$createCommit = Read-Host "Create commit? (y/n)"
if ($createCommit -eq "y") {
    $commitMessage = @"
Release v0.3.0 - Pre-Audit Setup

Features:
- Pre-Audit Setup Wizard with 3 steps
- Freeze Baseline functionality
- Requirement Set Publishing
- Extended Project Model
- UI Cleanup

Technical:
- 9 new files
- 6 modified files
- Database migration for Project model
- Comprehensive documentation
"@
    git commit -m $commitMessage
    Write-Host "✅ Commit created" -ForegroundColor Green
}

Write-Host ""
$createTag = Read-Host "Create git tag v0.3.0? (y/n)"
if ($createTag -eq "y") {
    $tagMessage = @"
Release v0.3.0 - Pre-Audit Setup

Pre-Audit Setup Wizard, Freeze Baseline, Requirement Publishing

See RELEASE_v0.3.0.md for full release notes.
"@
    git tag -a v0.3.0 -m $tagMessage
    Write-Host "✅ Tag v0.3.0 created" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "📌 To push tag to remote:" -ForegroundColor Cyan
    Write-Host "   git push origin v0.3.0" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Release v0.3.0 prepared!" -ForegroundColor Green
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "   - CHANGELOG.md"
Write-Host "   - RELEASE_v0.3.0.md"
Write-Host "   - RELEASE_NOTES.md"
Write-Host "   - PRE_AUDIT_IMPLEMENTATION.md"
Write-Host "   - TESTING_PRE_AUDIT.md"
Write-Host ""
Write-Host "🚀 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Test the new features"
Write-Host "   2. Push changes: git push"
Write-Host "   3. Push tag: git push origin v0.3.0"
Write-Host ""
