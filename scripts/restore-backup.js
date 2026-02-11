/**
 * AppSuite ITSM バックアップリストアスクリプト
 *
 * バックアップファイルからデータを復元する
 *
 * @version 1.0.0
 * @license MIT
 */

const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(prompt) {
    return new Promise(resolve => {
        rl.question(prompt, resolve);
    });
}

async function main() {
    console.log('========================================');
    console.log('📦 AppSuite ITSM バックアップリストア');
    console.log('========================================');
    console.log('');

    try {
        // Step 1: バックアップファイル一覧表示
        const backupDir = './backups';
        const files = await fs.readdir(backupDir);
        const backupFiles = files
            .filter(f => f.startsWith('appsuite_backup_') && f.endsWith('.json'))
            .sort()
            .reverse(); // 新しい順

        if (backupFiles.length === 0) {
            console.log('❌ バックアップファイルが見つかりません');
            console.log('');
            console.log('以下のいずれかを実施してください:');
            console.log('1. GitHub Actions から Artifacts をダウンロード');
            console.log('2. scripts/backup-automation.js を実行してバックアップ作成');
            console.log('');
            process.exit(1);
        }

        console.log('利用可能なバックアップファイル:');
        console.log('');

        for (let i = 0; i < Math.min(backupFiles.length, 10); i++) {
            const file = backupFiles[i];
            const filepath = path.join(backupDir, file);
            const stats = await fs.stat(filepath);
            const size = (stats.size / 1024).toFixed(2);
            const date = stats.mtime.toISOString().slice(0, 19).replace('T', ' ');
            console.log(`${i + 1}. ${file}`);
            console.log(`   サイズ: ${size} KB | 作成日時: ${date}`);
        }

        if (backupFiles.length > 10) {
            console.log(`... 他 ${backupFiles.length - 10} 件`);
        }

        console.log('');

        // Step 2: ファイル選択
        const answer = await question('リストアするファイル番号を入力してください (1-10): ');
        const fileIndex = parseInt(answer) - 1;

        if (fileIndex < 0 || fileIndex >= backupFiles.length) {
            console.log('❌ 無効な番号です');
            process.exit(1);
        }

        const selectedFile = backupFiles[fileIndex];
        const filepath = path.join(backupDir, selectedFile);

        console.log('');
        console.log(`選択されたファイル: ${selectedFile}`);
        console.log('');

        // Step 3: バックアップファイル読込
        console.log('📦 バックアップファイル読込中...');
        const backupData = JSON.parse(await fs.readFile(filepath, 'utf8'));

        console.log('✅ ファイル読込完了');
        console.log(`バックアップ日時: ${backupData.timestamp}`);
        console.log(`バージョン: ${backupData.version || '不明'}`);
        console.log('');

        // Step 4: データ統計表示
        console.log('📊 リストア対象データ:');
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

        // Step 5: 確認
        const confirm = await question('⚠️  現在のデータは上書きされます。リストアを実行しますか？ (yes/no): ');
        if (confirm.toLowerCase() !== 'yes') {
            console.log('リストアをキャンセルしました');
            process.exit(0);
        }

        // Step 6: リストア用HTMLファイル生成
        console.log('');
        console.log('📝 リストア用HTMLファイル生成中...');

        const restoreHtml = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AppSuite ITSM - データリストア</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .card {
            background: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            margin-top: 0;
        }
        .info {
            background: #e3f2fd;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .stat {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 4px;
        }
        .stat-label {
            font-size: 12px;
            color: #666;
            margin-bottom: 5px;
        }
        .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #1976d2;
        }
        button {
            background: #1976d2;
            color: white;
            border: none;
            padding: 12px 30px;
            font-size: 16px;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 20px;
        }
        button:hover {
            background: #1565c0;
        }
        button:disabled {
            background: #ccc;
            cursor: not-allowed;
        }
        #status {
            margin-top: 20px;
            padding: 15px;
            border-radius: 4px;
        }
        .success {
            background: #c8e6c9;
            color: #2e7d32;
        }
        .error {
            background: #ffcdd2;
            color: #c62828;
        }
        .warning {
            background: #fff9c4;
            color: #f57f17;
        }
    </style>
</head>
<body>
    <div class="card">
        <h1>📦 AppSuite ITSM - データリストア</h1>

        <div class="info">
            <strong>バックアップファイル:</strong> ${selectedFile}<br>
            <strong>バックアップ日時:</strong> ${backupData.timestamp}<br>
            <strong>バージョン:</strong> ${backupData.version || '1.0.0'}
        </div>

        <h2>リストア対象データ</h2>
        <div class="stats">
${Object.entries(backupData.collections).map(([key, value]) => {
    const count = Array.isArray(value) ? value.length : (typeof value === 'object' ? Object.keys(value).length : 0);
    return `            <div class="stat">
                <div class="stat-label">${key}</div>
                <div class="stat-value">${count}</div>
            </div>`;
}).join('\n')}
        </div>

        <p style="color: #d32f2f; font-weight: bold;">
            ⚠️ 警告: リストアを実行すると、現在のデータは完全に上書きされます。
        </p>

        <button onclick="restore()" id="restoreBtn">リストア実行</button>
        <div id="status"></div>
    </div>

    <script>
        const backupData = ${JSON.stringify(backupData.collections, null, 2)};

        function restore() {
            const statusDiv = document.getElementById('status');
            const btn = document.getElementById('restoreBtn');

            btn.disabled = true;
            statusDiv.className = 'warning';
            statusDiv.innerHTML = '<p>⏳ リストア中...</p>';

            try {
                // localStorageにデータを復元
                let restoredCount = 0;
                for (const [key, value] of Object.entries(backupData)) {
                    localStorage.setItem(key, JSON.stringify(value));
                    restoredCount++;
                }

                statusDiv.className = 'success';
                statusDiv.innerHTML = \`
                    <p><strong>✅ リストア完了</strong></p>
                    <p>\${restoredCount} コレクションを復元しました。</p>
                    <p>3秒後にメインページに移動します...</p>
                \`;

                setTimeout(() => {
                    window.location.href = '/';
                }, 3000);

            } catch (error) {
                statusDiv.className = 'error';
                statusDiv.innerHTML = '<p><strong>❌ リストア失敗:</strong> ' + error.message + '</p>';
                btn.disabled = false;
                console.error(error);
            }
        }
    </script>
</body>
</html>`;

        const restoreHtmlPath = './restore.html';
        await fs.writeFile(restoreHtmlPath, restoreHtml, 'utf8');

        console.log('✅ リストア用HTMLファイル生成完了: restore.html');
        console.log('');
        console.log('========================================');
        console.log('📝 次のステップ:');
        console.log('========================================');
        console.log('1. Webサーバーを起動してください:');
        console.log('   npm run dev:linux');
        console.log('   または');
        console.log('   npx http-server . -p 8888');
        console.log('');
        console.log('2. ブラウザで以下にアクセスしてください:');
        console.log('   http://localhost:8888/restore.html');
        console.log('');
        console.log('3. 「リストア実行」ボタンをクリックしてください');
        console.log('');

        rl.close();
        process.exit(0);

    } catch (error) {
        console.error('');
        console.error('========================================');
        console.error('❌ エラーが発生しました');
        console.error('========================================');
        console.error(error);
        console.error('');
        rl.close();
        process.exit(1);
    }
}

main();
