# ========================================
# Windows タスクスケジューラ登録スクリプト
# ========================================
# 起動時の自動実行タスクを登録

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
    Write-Host "PowerShellを管理者として実行してください" -ForegroundColor Yellow
    exit 1
}

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = (Get-Item "$ScriptDir\..\.." ).FullName

Write-Host "========================================" -ForegroundColor Blue
Write-Host "  Windows タスクスケジューラ登録" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue
Write-Host ""

# 開発環境タスク登録
if ($Mode -eq "dev" -or $Mode -eq "both") {
    Write-Host "✓ 開発環境タスクを登録中..." -ForegroundColor Green

    $taskName = "AppSuite-ITSM-Dev"
    $scriptPath = "$ProjectRoot\scripts\windows\dev-start.ps1"

    # タスクアクション
    $action = New-ScheduledTaskAction -Execute "PowerShell.exe" `
        -Argument "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"$scriptPath`""

    # トリガー（起動時）
    $trigger = New-ScheduledTaskTrigger -AtStartup

    # プリンシパル（最高権限で実行）
    $principal = New-ScheduledTaskPrincipal -UserId "$env:USERNAME" -LogonType Interactive -RunLevel Highest

    # 設定
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries

    # タスク登録
    Register-ScheduledTask -TaskName $taskName `
        -Action $action `
        -Trigger $trigger `
        -Principal $principal `
        -Settings $settings `
        -Force | Out-Null

    Write-Host "✅ 開発環境タスク登録完了" -ForegroundColor Green
    Write-Host "   タスク名: $taskName" -ForegroundColor Yellow
    Write-Host ""
}

# 本番環境タスク登録
if ($Mode -eq "prod" -or $Mode -eq "both") {
    Write-Host "✓ 本番環境タスクを登録中..." -ForegroundColor Green

    # SSL証明書確認
    $certPath = "$ProjectRoot\ssl\prod-cert.pem"
    $keyPath = "$ProjectRoot\ssl\prod-key.pem"

    if (-not (Test-Path $certPath) -or -not (Test-Path $keyPath)) {
        Write-Host "⚠️  警告: SSL証明書が見つかりません" -ForegroundColor Yellow
        Write-Host "   先にSSL証明書を生成してください:" -ForegroundColor Yellow
        Write-Host "   npm run ssl:prod" -ForegroundColor Yellow
        exit 1
    }

    $taskName = "AppSuite-ITSM-Prod"
    $scriptPath = "$ProjectRoot\scripts\windows\prod-start.ps1"

    # タスクアクション
    $action = New-ScheduledTaskAction -Execute "PowerShell.exe" `
        -Argument "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"$scriptPath`""

    # トリガー（起動時）
    $trigger = New-ScheduledTaskTrigger -AtStartup

    # プリンシパル（最高権限で実行）
    $principal = New-ScheduledTaskPrincipal -UserId "$env:USERNAME" -LogonType Interactive -RunLevel Highest

    # 設定
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries

    # タスク登録
    Register-ScheduledTask -TaskName $taskName `
        -Action $action `
        -Trigger $trigger `
        -Principal $principal `
        -Settings $settings `
        -Force | Out-Null

    Write-Host "✅ 本番環境タスク登録完了" -ForegroundColor Green
    Write-Host "   タスク名: $taskName" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Blue
Write-Host "✅ すべての登録が完了しました" -ForegroundColor Green
Write-Host ""
Write-Host "📌 次のステップ:" -ForegroundColor Blue
Write-Host "   1. タスクを確認:"
Write-Host "      タスクスケジューラを開く"
Write-Host ""
Write-Host "   2. 手動でタスクを実行してテスト:"
if ($Mode -eq "dev" -or $Mode -eq "both") {
    Write-Host "      開発環境: Start-ScheduledTask -TaskName 'AppSuite-ITSM-Dev'" -ForegroundColor Yellow
}
if ($Mode -eq "prod" -or $Mode -eq "both") {
    Write-Host "      本番環境: Start-ScheduledTask -TaskName 'AppSuite-ITSM-Prod'" -ForegroundColor Yellow
}
Write-Host ""
Write-Host "   3. タスクを削除する場合:"
if ($Mode -eq "dev" -or $Mode -eq "both") {
    Write-Host "      開発環境: Unregister-ScheduledTask -TaskName 'AppSuite-ITSM-Dev'" -ForegroundColor Yellow
}
if ($Mode -eq "prod" -or $Mode -eq "both") {
    Write-Host "      本番環境: Unregister-ScheduledTask -TaskName 'AppSuite-ITSM-Prod'" -ForegroundColor Yellow
}
Write-Host ""
Write-Host "========================================" -ForegroundColor Blue
