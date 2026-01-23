# ========================================
# Git Worktree作成スクリプト (PowerShell)
# ========================================
# 使い方: .\worktree-create.ps1 <branch-name> [base-branch]

param(
    [Parameter(Mandatory=$true)]
    [string]$BranchName,

    [Parameter(Mandatory=$false)]
    [string]$BaseBranch = "main"
)

$ErrorActionPreference = "Stop"

# プロジェクトルートを取得
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = (Get-Item "$ScriptDir\..\.." ).FullName
Set-Location $ProjectRoot

$WorktreePath = "worktrees\$BranchName"

Write-Host "========================================" -ForegroundColor Blue
Write-Host "  Git Worktree 作成" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue
Write-Host ""
Write-Host "  ブランチ名: " -NoNewline
Write-Host $BranchName -ForegroundColor Yellow
Write-Host "  ベースブランチ: " -NoNewline
Write-Host $BaseBranch -ForegroundColor Yellow
Write-Host "  Worktreeパス: " -NoNewline
Write-Host $WorktreePath -ForegroundColor Yellow
Write-Host ""

# Worktreeディレクトリの存在確認
if (Test-Path $WorktreePath) {
    Write-Host "❌ エラー: Worktree既に存在します: $WorktreePath" -ForegroundColor Red
    exit 1
}

# ブランチの存在確認
$branchExists = git show-ref --verify --quiet "refs/heads/$BranchName" 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "⚠️  ブランチ '$BranchName' は既に存在します" -ForegroundColor Yellow
    Write-Host "   既存のブランチでWorktreeを作成します..."
    git worktree add $WorktreePath $BranchName
} else {
    Write-Host "✓ 新しいブランチ '$BranchName' を作成します" -ForegroundColor Green
    git worktree add -b $BranchName $WorktreePath $BaseBranch
}

Write-Host ""
Write-Host "✅ Worktree作成完了！" -ForegroundColor Green
Write-Host ""
Write-Host "📌 次のステップ:" -ForegroundColor Blue
Write-Host "   1. cd $WorktreePath"
Write-Host "   2. 作業を開始"
Write-Host "   3. git add/commit/push"
Write-Host ""
Write-Host "🌳 現在のWorktree一覧:" -ForegroundColor Blue
git worktree list
Write-Host ""
