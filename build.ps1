#!/usr/bin/env pwsh
#Requires -Version 7.0

<#
.SYNOPSIS
    Appsuite-ITSM-Management ビルド・検証スクリプト

.DESCRIPTION
    PowerShell 7.x で動作するビルド検証スクリプト
    - 構文チェック（PSScriptAnalyzer）
    - 単体テスト（Pester）
    - メイン処理ドライラン

.PARAMETER DryRun
    ドライランモードで実行（実際のデプロイを行わない）

.EXAMPLE
    pwsh ./build.ps1
    pwsh ./build.ps1 -DryRun
#>

[CmdletBinding()]
param(
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# ========================================
# ヘッダー表示
# ========================================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🏗️  Appsuite-ITSM-Management Build" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PowerShell Version: $($PSVersionTable.PSVersion)" -ForegroundColor Gray
Write-Host "OS: $($PSVersionTable.OS)" -ForegroundColor Gray
Write-Host "Dry Run: $DryRun" -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ========================================
# Step 1: 構文チェック（PSScriptAnalyzer）
# ========================================
Write-Host "Step 1: PowerShell Syntax Check" -ForegroundColor Yellow

# PSScriptAnalyzer がインストールされているか確認
if (-not (Get-Module -ListAvailable -Name PSScriptAnalyzer)) {
    Write-Host "⚠️  PSScriptAnalyzer not installed. Installing..." -ForegroundColor Yellow
    try {
        Install-Module -Name PSScriptAnalyzer -Force -Scope CurrentUser -AllowClobber
        Write-Host "✅ PSScriptAnalyzer installed successfully" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Failed to install PSScriptAnalyzer: $_" -ForegroundColor Red
        Write-Host "   Skipping syntax check..." -ForegroundColor Yellow
    }
}

if (Get-Module -ListAvailable -Name PSScriptAnalyzer) {
    $psFiles = Get-ChildItem -Path . -Recurse -Filter *.ps1 -File |
               Where-Object { $_.FullName -notmatch '[\\/](node_modules|\.git|\.claude)[\\/]' }

    $totalErrors = 0
    $totalWarnings = 0

    foreach ($file in $psFiles) {
        Write-Host "  Analyzing: $($file.Name)" -ForegroundColor Gray

        $results = Invoke-ScriptAnalyzer -Path $file.FullName -Severity Error, Warning

        if ($results) {
            foreach ($result in $results) {
                $color = if ($result.Severity -eq 'Error') { 'Red' } else { 'Yellow' }
                Write-Host "    [$($result.Severity)] $($result.RuleName): $($result.Message)" -ForegroundColor $color
                Write-Host "      Line $($result.Line): $($result.ScriptName)" -ForegroundColor Gray

                if ($result.Severity -eq 'Error') {
                    $totalErrors++
                }
                else {
                    $totalWarnings++
                }
            }
        }
    }

    Write-Host ""
    if ($totalErrors -gt 0) {
        Write-Host "❌ Syntax check failed: $totalErrors errors, $totalWarnings warnings" -ForegroundColor Red
        exit 1
    }
    elseif ($totalWarnings -gt 0) {
        Write-Host "⚠️  Syntax check completed with warnings: $totalWarnings warnings" -ForegroundColor Yellow
    }
    else {
        Write-Host "✅ Syntax check passed: No errors or warnings" -ForegroundColor Green
    }
}
else {
    Write-Host "⚠️  PSScriptAnalyzer not available. Skipping syntax check." -ForegroundColor Yellow
}

Write-Host ""

# ========================================
# Step 2: 単体テスト（Pester）
# ========================================
Write-Host "Step 2: Unit Tests (Pester)" -ForegroundColor Yellow

# Pester がインストールされているか確認
if (-not (Get-Module -ListAvailable -Name Pester)) {
    Write-Host "⚠️  Pester not installed. Installing..." -ForegroundColor Yellow
    try {
        Install-Module -Name Pester -Force -Scope CurrentUser -SkipPublisherCheck -AllowClobber
        Write-Host "✅ Pester installed successfully" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Failed to install Pester: $_" -ForegroundColor Red
        Write-Host "   Skipping unit tests..." -ForegroundColor Yellow
    }
}

if (Get-Module -ListAvailable -Name Pester) {
    if (Test-Path ./tests/*.Tests.ps1) {
        $config = New-PesterConfiguration
        $config.Run.Path = './tests'
        $config.Output.Verbosity = 'Detailed'
        $config.Run.Exit = $false

        $results = Invoke-Pester -Configuration $config

        if ($results.FailedCount -gt 0) {
            Write-Host ""
            Write-Host "❌ Unit tests failed: $($results.FailedCount) failed, $($results.PassedCount) passed" -ForegroundColor Red
            exit 1
        }
        else {
            Write-Host ""
            Write-Host "✅ Unit tests passed: $($results.PassedCount) tests" -ForegroundColor Green
        }
    }
    else {
        Write-Host "ℹ️  No Pester tests found in ./tests/" -ForegroundColor Cyan
    }
}
else {
    Write-Host "⚠️  Pester not available. Skipping unit tests." -ForegroundColor Yellow
}

Write-Host ""

# ========================================
# Step 3: JavaScript 検証（ESLint）
# ========================================
Write-Host "Step 3: JavaScript Validation (ESLint)" -ForegroundColor Yellow

if (Get-Command npx -ErrorAction SilentlyContinue) {
    $jsFiles = Get-ChildItem -Path WebUI-Sample/js, WebUI-Production/js -Filter *.js -File -ErrorAction SilentlyContinue

    if ($jsFiles) {
        Write-Host "  Running ESLint on JavaScript files..." -ForegroundColor Gray

        $eslintResult = & npx eslint WebUI-Sample/js/*.js WebUI-Production/js/*.js --format compact 2>&1

        if ($LASTEXITCODE -ne 0) {
            Write-Host ""
            Write-Host "❌ ESLint validation failed:" -ForegroundColor Red
            Write-Host $eslintResult -ForegroundColor Gray
            exit 1
        }
        else {
            Write-Host "✅ ESLint validation passed" -ForegroundColor Green
        }
    }
    else {
        Write-Host "ℹ️  No JavaScript files found" -ForegroundColor Cyan
    }
}
else {
    Write-Host "⚠️  npm/npx not available. Skipping JavaScript validation." -ForegroundColor Yellow
}

Write-Host ""

# ========================================
# Step 4: メイン処理ドライラン（将来拡張用）
# ========================================
Write-Host "Step 4: Main Process Dry Run" -ForegroundColor Yellow

if ($DryRun) {
    Write-Host "ℹ️  Dry Run mode: Skipping actual deployment" -ForegroundColor Cyan
}
else {
    Write-Host "ℹ️  No main process defined yet" -ForegroundColor Cyan
}

Write-Host ""

# ========================================
# 成功
# ========================================
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ Build completed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

exit 0
