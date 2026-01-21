# ========================================
# AppSuite ITSM 開発環境起動スクリプト
# ========================================

$PORT = 3000
$ENV_NAME = "開発"

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
Write-Host "   LAN: http://192.168.0.145:$PORT" -ForegroundColor Cyan
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# カレントディレクトリをWebUI-Sampleに移動
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path (Split-Path $scriptPath -Parent) -Parent
Set-Location "$projectRoot\WebUI-Sample"

Write-Host "🚀 サーバー起動中..." -ForegroundColor Green
Write-Host ""

# http-serverを起動（キャッシュ無効、CORS有効）
npx http-server -p $PORT -c-1 --cors

Write-Host ""
Write-Host "サーバーを停止しました。" -ForegroundColor Yellow
