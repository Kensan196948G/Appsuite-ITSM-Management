#!/usr/bin/env node
/**
 * Claude Code StatusLine Script (Cross-platform)
 * Windows/Mac/Linux対応
 */

const { execSync } = require('child_process');

// 標準入力からJSONを読み取る
let input = '';
process.stdin.setEncoding('utf8');

process.stdin.on('readable', () => {
    let chunk;
    while ((chunk = process.stdin.read()) !== null) {
        input += chunk;
    }
});

process.stdin.on('end', () => {
    try {
        const data = JSON.parse(input || '{}');

        // カレントディレクトリ
        const cwd = data.workspace?.current_dir || data.cwd || process.cwd();

        // モデル名
        const model = data.model?.display_name || 'Claude';

        // コンテキスト使用率
        const usedPct = data.context_window?.used_percentage;
        const contextInfo = usedPct ? ` | 📊 Context: ${usedPct}%` : '';

        // Gitブランチ
        let gitBranch = '';
        try {
            const branch = execSync('git branch --show-current', {
                encoding: 'utf8',
                stdio: ['pipe', 'pipe', 'ignore'],
                timeout: 3000
            }).trim();
            if (branch) {
                gitBranch = ` | 🌿 ${branch}`;
            }
        } catch (e) {
            // Git not available or not in a repo
        }

        // 現在時刻
        const now = new Date();
        const time = now.toTimeString().slice(0, 8);

        // 出力（絵文字アイコン付き）
        process.stdout.write(`📁 ${cwd} | 🤖 ${model}${contextInfo}${gitBranch} | ⏱️ ${time}`);

    } catch (e) {
        process.stdout.write('StatusLine Error');
    }
});
