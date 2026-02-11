/**
 * AppSuite ITSM バックアップ自動化スクリプト
 *
 * Playwrightを使用してWebUIにアクセスし、localStorageからデータをエクスポート
 *
 * @version 1.0.0
 * @license MIT
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

// 設定
const CONFIG = {
    webUiUrl: process.env.WEBUI_URL || 'http://localhost:8888',
    backupDir: process.env.BACKUP_DIR || './backups',
    timeout: 30000
};

/**
 * メイン関数
 */
async function main() {
    console.log('========================================');
    console.log('📦 AppSuite ITSM バックアップ開始');
    console.log('========================================');
    console.log(`WebUI URL: ${CONFIG.webUiUrl}`);
    console.log(`Backup Dir: ${CONFIG.backupDir}`);
    console.log('');

    let browser;

    try {
        // Step 1: バックアップディレクトリ作成
        await fs.mkdir(CONFIG.backupDir, { recursive: true });
        console.log('✅ Backup directory created');

        // Step 2: ブラウザ起動
        console.log('🌐 Launching browser...');
        browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const context = await browser.newContext();
        const page = await context.newPage();

        // Step 3: WebUIにアクセス
        console.log(`🌐 Navigating to ${CONFIG.webUiUrl}...`);
        await page.goto(CONFIG.webUiUrl, {
            waitUntil: 'networkidle',
            timeout: CONFIG.timeout
        });
        console.log('✅ Page loaded');

        // Step 4: localStorage全データを取得
        console.log('📦 Extracting localStorage data...');
        const backupData = await page.evaluate(() => {
            const data = {};

            // 全localStorageキーを取得
            const keys = [
                'appsuite_users',
                'appsuite_apps',
                'appsuite_incidents',
                'appsuite_changes',
                'appsuite_logs',
                'appsuite_settings',
                'appsuiteSettings' // 統合設定
            ];

            for (const key of keys) {
                const value = localStorage.getItem(key);
                if (value) {
                    try {
                        data[key] = JSON.parse(value);
                    } catch (e) {
                        data[key] = value; // JSON以外の値
                    }
                }
            }

            return {
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                collections: data,
                metadata: {
                    userAgent: navigator.userAgent,
                    url: window.location.href,
                    backupSource: 'github-actions',
                    hostname: window.location.hostname
                }
            };
        });

        console.log('✅ Data extracted');

        // Step 5: 統計情報表示
        console.log('');
        console.log('📊 Backup Statistics:');
        let totalRecords = 0;
        for (const [key, value] of Object.entries(backupData.collections)) {
            const count = Array.isArray(value) ? value.length : (typeof value === 'object' ? Object.keys(value).length : 'N/A');
            console.log(`  - ${key}: ${count} records`);
            if (typeof count === 'number') {
                totalRecords += count;
            }
        }
        console.log(`  Total: ${totalRecords} records`);
        console.log('');

        // Step 6: バックアップファイル作成
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `appsuite_backup_${timestamp}.json`;
        const filepath = path.join(CONFIG.backupDir, filename);

        await fs.writeFile(
            filepath,
            JSON.stringify(backupData, null, 2),
            'utf8'
        );

        const filesize = (await fs.stat(filepath)).size;
        console.log(`✅ Backup file created: ${filename}`);
        console.log(`   Size: ${(filesize / 1024).toFixed(2)} KB`);
        console.log(`   Records: ${totalRecords}`);

        // Step 7: データ整合性検証
        console.log('🔍 Verifying backup integrity...');
        const readData = JSON.parse(await fs.readFile(filepath, 'utf8'));

        if (!readData.timestamp || !readData.collections) {
            throw new Error('Backup file is corrupted');
        }

        console.log('✅ Backup integrity verified');

        // Step 8: 古いバックアップの削除（ローカル実行時のみ）
        if (process.env.CLEANUP_OLD_BACKUPS === 'true') {
            console.log('🗑️  Cleaning up old backups...');
            const files = await fs.readdir(CONFIG.backupDir);
            const now = Date.now();
            const retentionDays = 30;
            let deletedCount = 0;

            for (const file of files) {
                if (!file.startsWith('appsuite_backup_') || !file.endsWith('.json')) {
                    continue;
                }

                const filePath = path.join(CONFIG.backupDir, file);
                const stats = await fs.stat(filePath);
                const age = (now - stats.mtimeMs) / (1000 * 60 * 60 * 24);

                if (age > retentionDays) {
                    await fs.unlink(filePath);
                    deletedCount++;
                    console.log(`  - Deleted: ${file} (${age.toFixed(1)} days old)`);
                }
            }

            if (deletedCount === 0) {
                console.log('  - No old backups to delete');
            } else {
                console.log(`✅ Deleted ${deletedCount} old backup(s)`);
            }
        }

        // Step 9: 完了
        console.log('');
        console.log('========================================');
        console.log('✅ バックアップ完了');
        console.log('========================================');
        console.log(`Backup file: ${filename}`);
        console.log(`Size: ${(filesize / 1024).toFixed(2)} KB`);
        console.log(`Records: ${totalRecords}`);
        console.log(`Timestamp: ${backupData.timestamp}`);
        console.log('');

        await browser.close();
        process.exit(0);

    } catch (error) {
        console.error('');
        console.error('========================================');
        console.error('❌ バックアップ失敗');
        console.error('========================================');
        console.error(error);
        console.error('');

        if (browser) {
            await browser.close();
        }

        process.exit(1);
    }
}

// 実行
main();
