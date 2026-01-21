# ========================================
# Git Worktree削除スクリプト (PowerShell)
# ========================================
# 使い方: .\worktree-remove.ps1 <branch-name>

param(
    [Parameter(Mandatory=$true)]
    [string]$BranchName
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = (Get-Item "$ScriptDir\..\.." ).FullName
Set-Location $ProjectRoot

$WorktreePath = "worktrees\$BranchName"

Write-Host "========================================" -ForegroundColor Blue
Write-Host "  Git Worktree 削除" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue
Write-Host ""

if (-not (Test-Path $WorktreePath)) {
    Write-Host "❌ エラー: Worktreeが見つかりません: $WorktreePath" -ForegroundColor Red
    exit 1
}

# 未コミットの変更確認
Push-Location $WorktreePath
$hasUncommitted = $false
if ((git diff --quiet; $LASTEXITCODE -ne 0) -or (git diff --cached --quiet; $LASTEXITCODE -ne 0)) {
    $hasUncommitted = $true
    Write-Host "⚠️  警告: 未コミットの変更があります" -ForegroundColor Yellow
    git status --short
    Write-Host ""
    $confirm = Read-Host "本当に削除しますか？ (yes/no)"
    if ($confirm -ne "yes") {
        Write-Host "キャンセルしました" -ForegroundColor Yellow
        Pop-Location
        exit 0
    }
}
Pop-Location

# Worktree削除
Write-Host "✓ Worktreeを削除中..." -ForegroundColor Green
git worktree remove $WorktreePath --force

# ブランチ削除確認
$deleteBranch = Read-Host "ブランチ '$BranchName' も削除しますか？ (yes/no)"
if ($deleteBranch -eq "yes") {
    git branch -D $BranchName
    Write-Host "✓ ブランチも削除しました" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ Worktree削除完了！" -ForegroundColor Green
Write-Host ""
Write-Host "🌳 残りのWorktree一覧:" -ForegroundColor Blue
git worktree list
Write-Host ""
