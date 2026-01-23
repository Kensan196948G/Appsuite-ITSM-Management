# ========================================
# Git Worktree一覧表示スクリプト (PowerShell)
# ========================================

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = (Get-Item "$ScriptDir\..\.." ).FullName
Set-Location $ProjectRoot

Write-Host "========================================" -ForegroundColor Blue
Write-Host "  Git Worktree 一覧" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue
Write-Host ""

# Worktree一覧表示
git worktree list

Write-Host ""
$worktreeCount = (git worktree list | Measure-Object -Line).Lines
Write-Host "📊 統計: " -NoNewline
Write-Host "合計 " -NoNewline
Write-Host $worktreeCount -NoNewline -ForegroundColor Yellow
Write-Host " 個のWorktree"
Write-Host ""
