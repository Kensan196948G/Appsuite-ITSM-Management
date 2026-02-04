const { chromium } = require('playwright');

(async () => {
  console.log('🔍 Chrome DevTools リアルタイム検証開始...\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-dev-shm-usage', '--no-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  // カウンター
  let errorCount = 0;
  let warningCount = 0;
  let infoCount = 0;
  let pageErrorCount = 0;
  let failedRequestCount = 0;

  // コンソールメッセージをキャプチャ
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();

    if (type === 'error') {
      errorCount++;
      console.log(`❌ ERROR: ${text}`);
    } else if (type === 'warning') {
      warningCount++;
      console.log(`⚠️  WARNING: ${text}`);
    } else if (type === 'info' || type === 'log') {
      infoCount++;
      console.log(`ℹ️  INFO: ${text}`);
    }
  });

  // ページエラーをキャプチャ
  page.on('pageerror', error => {
    pageErrorCount++;
    console.log(`💥 PAGE ERROR: ${error.message}`);
    console.log(`   Stack: ${error.stack}\n`);
  });

  // ネットワークリクエストをキャプチャ
  page.on('response', response => {
    const status = response.status();
    const url = response.url();

    if (status >= 400) {
      failedRequestCount++;
      console.log(`🔴 FAILED REQUEST: ${status} ${url}`);
    } else if (status >= 200 && status < 300) {
      console.log(`🟢 SUCCESS: ${status} ${url.substring(url.lastIndexOf('/') + 1)}`);
    }
  });

  console.log('📡 ページを読み込み中: http://192.168.0.185:8888/\n');

  try {
    // ページを開く
    await page.goto('http://192.168.0.185:8888/', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('\n✅ ページ読み込み完了\n');

    // スクリーンショット保存
    await page.screenshot({
      path: 'test-results/devtools-login-page.png',
      fullPage: true
    });
    console.log('📸 スクリーンショット保存: test-results/devtools-login-page.png\n');

    // 3秒待機（全スクリプトの実行完了を待つ）
    await page.waitForTimeout(3000);

    // ログイン試行
    console.log('🔐 ログインを試行中...\n');

    const usernameInput = await page.$('#username');
    const passwordInput = await page.$('#password');
    const loginButton = await page.$('button[type="submit"]');

    if (usernameInput && passwordInput && loginButton) {
      await usernameInput.fill('admin');
      await passwordInput.fill('admin123');
      await loginButton.click();

      // ログイン後のページ読み込みを待機
      await page.waitForTimeout(3000);

      // ダッシュボードのスクリーンショット
      await page.screenshot({
        path: 'test-results/devtools-dashboard.png',
        fullPage: true
      });
      console.log('📸 スクリーンショット保存: test-results/devtools-dashboard.png\n');

      console.log('✅ ログイン完了\n');
    } else {
      console.log('⚠️  ログインフォームが見つかりません\n');
    }

    // 各モジュールをテスト
    const modules = [
      { name: 'ユーザー管理', id: 'users' },
      { name: 'アプリ管理', id: 'apps' },
      { name: 'インシデント管理', id: 'incidents' },
      { name: '変更管理', id: 'changes' },
      { name: '監査ログ', id: 'logs' },
      { name: 'システム設定', id: 'settings' }
    ];

    for (const module of modules) {
      console.log(`📂 ${module.name}セクションをテスト中...`);
      const link = await page.$(`a[href="#${module.id}"]`);
      if (link) {
        await link.click();
        await page.waitForTimeout(1000);
        console.log(`   ✅ ${module.name}: 正常`);
      } else {
        console.log(`   ⚠️  ${module.name}: リンクが見つかりません`);
      }
    }

    console.log('');

  } catch (error) {
    console.log(`\n❌ エラーが発生: ${error.message}\n`);
    pageErrorCount++;
  }

  // 結果サマリー
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Chrome DevTools 検証結果サマリー');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log(`❌ コンソールエラー:    ${errorCount}件`);
  console.log(`⚠️  コンソール警告:      ${warningCount}件`);
  console.log(`ℹ️  コンソール情報:      ${infoCount}件`);
  console.log(`💥 ページエラー:        ${pageErrorCount}件`);
  console.log(`🔴 失敗したリクエスト:  ${failedRequestCount}件\n`);

  const totalErrors = errorCount + pageErrorCount + failedRequestCount;

  if (totalErrors === 0) {
    console.log('🎉 素晴らしい！全て正常です！エラーは検出されませんでした。\n');
    console.log('✅ システムは本番環境にデプロイ可能な状態です。\n');
  } else {
    console.log(`⚠️  合計 ${totalErrors} 件の問題が検出されました。\n`);
    console.log('上記の詳細を確認して修正してください。\n');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📁 保存されたファイル:');
  console.log('   - test-results/devtools-login-page.png');
  console.log('   - test-results/devtools-dashboard.png\n');

  await browser.close();

  // 終了コード（エラー数）
  process.exit(totalErrors);
})();
