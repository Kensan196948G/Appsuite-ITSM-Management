# ========================================
# AppSuite ITSM 本番環境起動スクリプト
# ========================================

$PORT = 8443
$ENV_NAME = "本番"

# 動的IPアドレス取得
$LOCAL_IP = (Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" } |
    Sort-Object -Property PrefixLength |
    Select-Object -First 1).IPAddress
if (-not $LOCAL_IP) { $LOCAL_IP = "127.0.0.1" }

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AppSuite ITSM Management System" -ForegroundColor White
Write-Host "  [$ENV_NAME] 環境起動中..." -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📌 設定情報:" -ForegroundColor Yellow
Write-Host "   環境: $ENV_NAME" -ForegroundColor White
Write-Host "   ポート: $PORT" -ForegroundColor White
Write-Host "   プロトコル: HTTPS (SSL/TLS)" -ForegroundColor White
Write-Host ""
Write-Host "🌐 アクセスURL:" -ForegroundColor Yellow
Write-Host "   ローカル: https://localhost:$PORT" -ForegroundColor Cyan
Write-Host "   LAN: https://${LOCAL_IP}:$PORT" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  注意事項:" -ForegroundColor Yellow
Write-Host "   - 自己署名SSL証明書を使用しています" -ForegroundColor White
Write-Host "   - ブラウザで「安全でない」警告が表示されます" -ForegroundColor White
Write-Host "   - 警告を承認してアクセスしてください" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# カレントディレクトリをWebUI-Productionに移動
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path (Split-Path $scriptPath -Parent) -Parent
Set-Location "$projectRoot\WebUI-Production"

# SSL証明書パスを確認
$certPath = "$projectRoot\ssl\prod-cert.pem"
$keyPath = "$projectRoot\ssl\prod-key.pem"

if (-Not (Test-Path $certPath)) {
    Write-Host "❌ エラー: SSL証明書が見つかりません: $certPath" -ForegroundColor Red
    Read-Host "Enterキーを押して終了してください"
    exit 1
}

if (-Not (Test-Path $keyPath)) {
    Write-Host "❌ エラー: SSL秘密鍵が見つかりません: $keyPath" -ForegroundColor Red
    Read-Host "Enterキーを押して終了してください"
    exit 1
}

Write-Host "🔒 HTTPSサーバー起動中..." -ForegroundColor Green
Write-Host ""

# http-serverをHTTPSモードで起動
npx http-server -p $PORT --ssl --cert $certPath --key $keyPath

Write-Host ""
Write-Host "サーバーを停止しました。" -ForegroundColor Yellow
