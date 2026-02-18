# ========================================
# AppSuite ITSM 開発環境起動スクリプト
# ========================================

$PORT = 3100
$ENV_NAME = "開発"

# 動的IPアドレス取得
$LOCAL_IP = (Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" } |
    Sort-Object -Property PrefixLength |
    Select-Object -First 1).IPAddress
if (-not $LOCAL_IP) { $LOCAL_IP = "127.0.0.1" }

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AppSuite ITSM Management System" -ForegroundColor White
Write-Host "  [$ENV_NAME] 環境起動中..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📌 設定情報:" -ForegroundColor Yellow
Write-Host "   環境: $ENV_NAME" -ForegroundColor White
Write-Host "   ポート: $PORT" -ForegroundColor White
Write-Host "   プロトコル: HTTP" -ForegroundColor White
Write-Host ""
Write-Host "🌐 アクセスURL:" -ForegroundColor Yellow
Write-Host "   ローカル: http://localhost:$PORT" -ForegroundColor Cyan
Write-Host "   LAN: http://${LOCAL_IP}:$PORT" -ForegroundColor Cyan
Write-Host ""
Write-Host "📌 ポート情報:" -ForegroundColor Yellow
Write-Host "   このプロジェクト専用ポート（変更不可）: $PORT" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# カレントディレクトリをWebUI-Sampleに移動
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path (Split-Path $scriptPath -Parent) -Parent
Set-Location "$projectRoot\WebUI-Production"

Write-Host "🚀 サーバー起動中..." -ForegroundColor Green
Write-Host ""

# http-serverを起動（キャッシュ無効、CORS有効）
npx http-server -p $PORT -c-1 --cors

Write-Host ""
Write-Host "サーバーを停止しました。" -ForegroundColor Yellow
