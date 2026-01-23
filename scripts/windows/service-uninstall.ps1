# ========================================
# Windows タスクスケジューラ削除スクリプト
# ========================================

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("dev", "prod", "both")]
    [string]$Mode = "both"
)

$ErrorActionPreference = "Stop"

# 管理者権限確認
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "❌ このスクリプトは管理者権限で実行する必要があります" -ForegroundColor Red
    exit 1
}

Write-Host "========================================" -ForegroundColor Blue
Write-Host "  Windows タスクスケジューラ削除" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue
Write-Host ""

# 開発環境タスク削除
if ($Mode -eq "dev" -or $Mode -eq "both") {
    $taskName = "AppSuite-ITSM-Dev"

    if (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue) {
        Write-Host "✓ 開発環境タスクを削除中..." -ForegroundColor Green
        Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
        Write-Host "✅ 開発環境タスク削除完了" -ForegroundColor Green
    } else {
        Write-Host "⚠️  開発環境タスクは登録されていません" -ForegroundColor Yellow
    }
    Write-Host ""
}

# 本番環境タスク削除
if ($Mode -eq "prod" -or $Mode -eq "both") {
    $taskName = "AppSuite-ITSM-Prod"

    if (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue) {
        Write-Host "✓ 本番環境タスクを削除中..." -ForegroundColor Green
        Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
        Write-Host "✅ 本番環境タスク削除完了" -ForegroundColor Green
    } else {
        Write-Host "⚠️  本番環境タスクは登録されていません" -ForegroundColor Yellow
    }
    Write-Host ""
}

Write-Host "✅ 削除完了" -ForegroundColor Green
Write-Host ""
