# Release Script for v0.6.0 Phase 1
# Автоматический коммит и пуш изменений

param(
    [switch]$NoPush,
    [string]$CustomMessage
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Release Script v0.6.0 Phase 1" -ForegroundColor Cyan
Write-Host ""

# Check if git is available
try {
    git --version | Out-Null
} catch {
    Write-Host "❌ Git не найден. Установите Git и попробуйте снова." -ForegroundColor Red
    exit 1
}

# Check for uncommitted changes
$status = git status --porcelain
if ([string]::IsNullOrEmpty($status)) {
    Write-Host "✅ Нет изменений для коммита" -ForegroundColor Green
    exit 0
}

Write-Host "📝 Найдены изменения:" -ForegroundColor Yellow
git status --short

Write-Host ""
$confirm = Read-Host "Продолжить коммит? (y/n)"
if ($confirm -ne 'y') {
    Write-Host "❌ Отменено пользователем" -ForegroundColor Red
    exit 0
}

# Commit message
$commitMessage = if ($CustomMessage) {
    $CustomMessage
} else {
    @"
v0.6.0 Phase 1: Offline Mode + Mobile UI Fixes

✨ New Features:
- Offline sync with IndexedDB (Dexie.js)
- Manual sync button with spinner
- Connection status indicators (online/offline)
- Sync queue for offline operations

🔧 Fixes:
- Completion modal touch events on mobile (onTouchEnd handlers)
- Defects counter now calculates real VIOLATION count
- Field App back button navigation to /field/projects
- Project title text wrapping (no overflow)
- Button sizes increased to 48px for touch-friendly UX

📱 Mobile UI:
- Responsive padding and typography
- Active states for visual feedback
- Touch targets meet 44x44px minimum

🎯 Components Modified:
- components/audit/audit-execution-list.tsx
- components/audit/audit-workspace.tsx
- app/field/projects/[id]/page.tsx
- app/actions/audit.ts
- hooks/use-offline-sync.ts (integrated)

📦 Dependencies:
- Added dexie@^4.0.10

📄 Documentation:
- RELEASE_v0.6.0_PHASE1.md
- CHANGELOG_v0.6.0.md
- Updated task.md and walkthrough.md
"@
}

Write-Host ""
Write-Host "📝 Commit message:" -ForegroundColor Cyan
Write-Host $commitMessage -ForegroundColor Gray
Write-Host ""

# Add all changes
Write-Host "➕ Adding files..." -ForegroundColor Yellow
git add .

# Show what will be committed
Write-Host ""
Write-Host "📋 Files to commit:" -ForegroundColor Yellow
git diff --cached --name-status

Write-Host ""
$confirmCommit = Read-Host "Создать коммит? (y/n)"
if ($confirmCommit -ne 'y') {
    Write-Host "❌ Отменено. Откат git add..." -ForegroundColor Red
    git reset
    exit 0
}

# Create commit
Write-Host "💾 Creating commit..." -ForegroundColor Yellow
git commit -m $commitMessage

Write-Host "✅ Commit создан успешно!" -ForegroundColor Green

# Push to remote
if (-not $NoPush) {
    Write-Host ""
    $confirmPush = Read-Host "Запушить на удаленный репозиторий? (y/n)"
    if ($confirmPush -eq 'y') {
        Write-Host "🚀 Pushing to remote..." -ForegroundColor Yellow
        
        # Get current branch
        $branch = git rev-parse --abbrev-ref HEAD
        
        try {
            git push origin $branch
            Write-Host "✅ Push успешен!" -ForegroundColor Green
        } catch {
            Write-Host "❌ Ошибка при push. Попробуйте вручную: git push origin $branch" -ForegroundColor Red
            exit 1
        }
    }
}

Write-Host ""
Write-Host "🎉 v0.6.0 Phase 1 зафиксирован!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Статус:" -ForegroundColor Cyan
git log -1 --oneline

Write-Host ""
Write-Host "✅ Готово! Можно переходить к Phase 2" -ForegroundColor Green
