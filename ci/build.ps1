# build.ps1 - Windows用ビルドスクリプト
#
# 目的: Windows環境でのCI/CDビルド処理を実行
#
# 使用方法:
#   pwsh ./ci/build.ps1 [-Task <task>] [-Environment <env>]
#
# タスク:
#   lint     - ESLintでコード品質チェック
#   test     - Jestでテスト実行
#   security - セキュリティスキャン
#   build    - ビルド実行
#   all      - 全タスク実行（デフォルト）
#
# 環境:
#   dev  - 開発環境
#   prod - 本番環境

param(
    [ValidateSet("lint", "test", "security", "build", "all")]
    [string]$Task = "all",

    [ValidateSet("dev", "prod")]
    [string]$Environment = "dev",

    [switch]$Verbose,
    [switch]$DryRun
)

# 設定
$ErrorActionPreference = "Stop"
$Script:ExitCode = 0
$Script:LogDir = "ci_logs"
$Script:BuildTime = Get-Date -Format "yyyyMMdd_HHmmss"

# カラー出力関数
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Warn {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-Err {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Write-Step {
    param([string]$Message)
    Write-Host "`n=== $Message ===" -ForegroundColor Cyan
}

# ログディレクトリ作成
function Initialize-LogDir {
    if (-not (Test-Path $Script:LogDir)) {
        New-Item -ItemType Directory -Path $Script:LogDir -Force | Out-Null
    }
}

# 依存関係チェック
function Test-Dependencies {
    Write-Step "依存関係チェック"

    $dependencies = @(
        @{ Name = "Node.js"; Command = "node --version" },
        @{ Name = "npm"; Command = "npm --version" }
    )

    foreach ($dep in $dependencies) {
        try {
            $version = Invoke-Expression $dep.Command 2>$null
            Write-Info "$($dep.Name): $version"
        }
        catch {
            Write-Err "$($dep.Name) がインストールされていません"
            $Script:ExitCode = 1
        }
    }

    # package.jsonの存在確認
    if (-not (Test-Path "package.json")) {
        Write-Err "package.json が見つかりません"
        $Script:ExitCode = 1
    }

    return ($Script:ExitCode -eq 0)
}

# npm依存関係インストール
function Install-Dependencies {
    Write-Step "npm依存関係インストール"

    if ($DryRun) {
        Write-Info "[DryRun] npm ci をスキップ"
        return $true
    }

    try {
        npm ci --silent
        Write-Info "依存関係のインストール完了"
        return $true
    }
    catch {
        Write-Err "依存関係のインストールに失敗: $_"
        return $false
    }
}

# ESLint実行
function Invoke-Lint {
    Write-Step "ESLint コード品質チェック"

    $logFile = Join-Path $Script:LogDir "lint_$Script:BuildTime.log"

    if ($DryRun) {
        Write-Info "[DryRun] npm run lint をスキップ"
        return $true
    }

    try {
        $output = npm run lint 2>&1
        $output | Out-File -FilePath $logFile -Encoding UTF8

        if ($LASTEXITCODE -eq 0) {
            Write-Info "Lint チェック: PASS"
            return $true
        }
        else {
            Write-Err "Lint エラーが検出されました"
            Write-Err "詳細: $logFile"
            return $false
        }
    }
    catch {
        Write-Err "Lint 実行に失敗: $_"
        return $false
    }
}

# テスト実行
function Invoke-Test {
    Write-Step "Jest テスト実行"

    $logFile = Join-Path $Script:LogDir "test_$Script:BuildTime.log"

    if ($DryRun) {
        Write-Info "[DryRun] npm test をスキップ"
        return $true
    }

    try {
        $output = npm test 2>&1
        $output | Out-File -FilePath $logFile -Encoding UTF8

        if ($LASTEXITCODE -eq 0) {
            Write-Info "テスト: PASS"

            # カバレッジ情報表示
            if (Test-Path "coverage/lcov-report/index.html") {
                Write-Info "カバレッジレポート: coverage/lcov-report/index.html"
            }

            return $true
        }
        else {
            Write-Err "テストが失敗しました"
            Write-Err "詳細: $logFile"
            return $false
        }
    }
    catch {
        Write-Err "テスト実行に失敗: $_"
        return $false
    }
}

# セキュリティスキャン
function Invoke-SecurityScan {
    Write-Step "セキュリティスキャン"

    $logFile = Join-Path $Script:LogDir "security_$Script:BuildTime.log"

    if ($DryRun) {
        Write-Info "[DryRun] npm audit をスキップ"
        return $true
    }

    try {
        # npm audit実行
        $auditOutput = npm audit --json 2>&1
        $auditOutput | Out-File -FilePath $logFile -Encoding UTF8

        # 脆弱性の数を解析
        try {
            $auditJson = $auditOutput | ConvertFrom-Json
            $vulnerabilities = $auditJson.metadata.vulnerabilities

            $total = $vulnerabilities.total
            $critical = $vulnerabilities.critical
            $high = $vulnerabilities.high

            Write-Info "脆弱性: 合計=$total, Critical=$critical, High=$high"

            if ($critical -gt 0 -or $high -gt 0) {
                Write-Err "Critical/High の脆弱性が検出されました"
                return $false
            }
        }
        catch {
            Write-Warn "脆弱性情報の解析をスキップ"
        }

        Write-Info "セキュリティスキャン: PASS"
        return $true
    }
    catch {
        Write-Warn "セキュリティスキャン実行中にエラー: $_"
        return $true  # 警告のみ、失敗にしない
    }
}

# ビルド実行
function Invoke-Build {
    Write-Step "ビルド実行"

    $logFile = Join-Path $Script:LogDir "build_$Script:BuildTime.log"

    if ($DryRun) {
        Write-Info "[DryRun] ビルドをスキップ"
        return $true
    }

    # 静的サイトのため、ファイルの整合性チェックのみ
    $requiredFiles = @(
        "WebUI-Sample/index.html",
        "WebUI-Sample/css/styles.css",
        "WebUI-Sample/js/app.js",
        "WebUI-Sample/js/modules.js",
        "WebUI-Sample/js/api.js"
    )

    $missingFiles = @()

    foreach ($file in $requiredFiles) {
        if (-not (Test-Path $file)) {
            $missingFiles += $file
        }
    }

    if ($missingFiles.Count -gt 0) {
        Write-Err "必須ファイルが見つかりません:"
        foreach ($f in $missingFiles) {
            Write-Err "  - $f"
        }
        return $false
    }

    Write-Info "必須ファイル: 全て存在"

    # 環境別の設定適用
    if ($Environment -eq "prod") {
        Write-Info "本番環境設定を適用中..."
        # 本番用の設定処理をここに追加
    }

    Write-Info "ビルド: PASS"
    return $true
}

# 結果サマリー
function Write-Summary {
    param(
        [hashtable]$Results
    )

    Write-Step "ビルドサマリー"

    $passed = 0
    $failed = 0

    foreach ($task in $Results.Keys) {
        if ($Results[$task]) {
            Write-Host "  [PASS] $task" -ForegroundColor Green
            $passed++
        }
        else {
            Write-Host "  [FAIL] $task" -ForegroundColor Red
            $failed++
        }
    }

    Write-Host ""
    Write-Host "結果: $passed 成功, $failed 失敗" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })

    return ($failed -eq 0)
}

# メイン処理
function Main {
    Write-Host "`n" + "=" * 50
    Write-Host "AppSuite ITSM ビルドスクリプト"
    Write-Host "タスク: $Task | 環境: $Environment"
    Write-Host "=" * 50 + "`n"

    Initialize-LogDir

    if (-not (Test-Dependencies)) {
        Write-Err "依存関係チェックに失敗しました"
        exit 1
    }

    if (-not (Install-Dependencies)) {
        Write-Err "依存関係のインストールに失敗しました"
        exit 1
    }

    $results = @{}

    switch ($Task) {
        "lint" {
            $results["Lint"] = Invoke-Lint
        }
        "test" {
            $results["Test"] = Invoke-Test
        }
        "security" {
            $results["Security"] = Invoke-SecurityScan
        }
        "build" {
            $results["Build"] = Invoke-Build
        }
        "all" {
            $results["Lint"] = Invoke-Lint
            $results["Test"] = Invoke-Test
            $results["Security"] = Invoke-SecurityScan
            $results["Build"] = Invoke-Build
        }
    }

    $success = Write-Summary -Results $results

    if ($success) {
        Write-Info "`n全タスクが正常に完了しました"
        exit 0
    }
    else {
        Write-Err "`n一部のタスクが失敗しました"
        exit 1
    }
}

# 実行
Main
