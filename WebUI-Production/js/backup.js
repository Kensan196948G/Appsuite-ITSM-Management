/**
 * AppSuite ITSM管理システム - バックアップ管理モジュール
 * Sprint 4: 自動バックアップスケジューリング、検証、選択的リストア
 */

const BackupManager = {
    // 定数
    STORAGE_KEY: 'appsuite_backup_config',
    HISTORY_KEY: 'backupHistory',
    AUTO_BACKUP_INTERVAL: null,
    VERSION: '2.0.0',

    // バックアップスキーマ定義
    SCHEMA: {
        requiredFields: ['version', 'timestamp'],
        dataFields: ['settings', 'users', 'apps', 'incidents', 'changes', 'logs'],
        settingsFields: ['api', 'general', 'notification', 'security', 'workflow', 'backup'],
    },

    /**
     * 初期化
     */
    init() {
        this.loadConfig();
        this.startAutoBackup();
        console.log('[BackupManager] 初期化完了');
    },

    /**
     * クリーンアップ
     */
    cleanup() {
        this.stopAutoBackup();
        console.log('[BackupManager] クリーンアップ完了');
    },

    /**
     * 設定読み込み
     */
    loadConfig() {
        const saved = localStorage.getItem(this.STORAGE_KEY);
        if (saved) {
            return JSON.parse(saved);
        }
        return {
            autoBackupEnabled: true,
            intervalMinutes: 1440, // デフォルト: 24時間
            retentionDays: 7,
            includeData: {
                settings: true,
                users: true,
                apps: true,
                incidents: true,
                changes: true,
                logs: true,
            },
            lastAutoBackup: null,
        };
    },

    /**
     * 設定保存
     */
    saveConfig(config) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
    },

    /**
     * 自動バックアップ開始
     */
    startAutoBackup() {
        const config = this.loadConfig();

        if (!config.autoBackupEnabled) {
            console.log('[BackupManager] 自動バックアップは無効です');
            return;
        }

        // 既存のインターバルをクリア
        this.stopAutoBackup();

        // インターバルを設定（最小5分）
        const intervalMs = Math.max(config.intervalMinutes, 5) * 60 * 1000;

        this.AUTO_BACKUP_INTERVAL = setInterval(() => {
            this.performAutoBackup();
        }, intervalMs);

        console.log(`[BackupManager] 自動バックアップ開始: ${config.intervalMinutes}分間隔`);

        // 前回のバックアップから時間が経っていればすぐに実行
        if (config.lastAutoBackup) {
            const lastBackup = new Date(config.lastAutoBackup);
            const now = new Date();
            const elapsed = now - lastBackup;
            if (elapsed > intervalMs) {
                console.log('[BackupManager] 前回のバックアップから時間経過 - 即時実行');
                this.performAutoBackup();
            }
        }
    },

    /**
     * 自動バックアップ停止
     */
    stopAutoBackup() {
        if (this.AUTO_BACKUP_INTERVAL) {
            clearInterval(this.AUTO_BACKUP_INTERVAL);
            this.AUTO_BACKUP_INTERVAL = null;
            console.log('[BackupManager] 自動バックアップ停止');
        }
    },

    /**
     * 自動バックアップ実行
     */
    performAutoBackup() {
        const config = this.loadConfig();

        try {
            const backupData = this.createBackupData(config.includeData);

            // localStorageに保存（ファイルダウンロードなし）
            const backups = this.getBackupHistory();
            backups.unshift({
                id: this.generateBackupId(),
                date: new Date().toISOString(),
                type: 'auto',
                size: new Blob([JSON.stringify(backupData)]).size,
                data: backupData,
            });

            // 保持期間を超えた古いバックアップを削除
            const retentionMs = config.retentionDays * 24 * 60 * 60 * 1000;
            const now = new Date();
            const filteredBackups = backups
                .filter(b => {
                    const backupDate = new Date(b.date);
                    return now - backupDate < retentionMs;
                })
                .slice(0, 20); // 最大20件

            this.saveBackupHistory(filteredBackups);

            // 最終バックアップ時刻を更新
            config.lastAutoBackup = new Date().toISOString();
            this.saveConfig(config);

            console.log('[BackupManager] 自動バックアップ完了');

            // UI更新
            if (typeof SettingsModule !== 'undefined' && SettingsModule.updateBackupStatus) {
                SettingsModule.updateBackupStatus();
            }
        } catch (error) {
            console.error('[BackupManager] 自動バックアップエラー:', error);
        }
    },

    /**
     * バックアップID生成
     */
    generateBackupId() {
        return 'BKP-' + Date.now().toString(36).toUpperCase();
    },

    /**
     * バックアップデータ作成
     */
    createBackupData(includeOptions = null) {
        const include = includeOptions || {
            settings: true,
            users: true,
            apps: true,
            incidents: true,
            changes: true,
            logs: true,
        };

        const data = {
            version: this.VERSION,
            timestamp: new Date().toISOString(),
            appVersion: '1.0.0',
            exportedBy: 'BackupManager',
        };

        if (include.settings && typeof SettingsModule !== 'undefined') {
            data.settings = SettingsModule.load();
        }
        if (include.users && typeof DataStore !== 'undefined') {
            data.users = DataStore.users || [];
        }
        if (include.apps && typeof DataStore !== 'undefined') {
            data.apps = DataStore.apps || [];
        }
        if (include.incidents && typeof DataStore !== 'undefined') {
            data.incidents = DataStore.incidents || [];
        }
        if (include.changes && typeof DataStore !== 'undefined') {
            data.changes = DataStore.changes || [];
        }
        if (include.logs && typeof DataStore !== 'undefined') {
            data.logs = DataStore.logs || [];
        }

        return data;
    },

    /**
     * バックアップ履歴取得
     */
    getBackupHistory() {
        const saved = localStorage.getItem(this.HISTORY_KEY);
        return saved ? JSON.parse(saved) : [];
    },

    /**
     * バックアップ履歴保存
     */
    saveBackupHistory(history) {
        localStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));
    },

    /**
     * 手動バックアップ（ファイルダウンロード）
     */
    createManualBackup(options = {}) {
        const includeData = options.includeData || {
            settings: true,
            users: true,
            apps: true,
            incidents: true,
            changes: true,
            logs: true,
        };

        const backupData = this.createBackupData(includeData);

        // チェックサム追加
        backupData.checksum = this.calculateChecksum(backupData);

        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `appsuite_backup_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // 履歴に追加
        const backups = this.getBackupHistory();
        backups.unshift({
            id: this.generateBackupId(),
            date: new Date().toISOString(),
            type: 'manual',
            size: blob.size,
            filename: a.download,
        });
        this.saveBackupHistory(backups.slice(0, 50));

        if (typeof showToast === 'function') {
            showToast('バックアップを作成しました', 'success');
        }
        if (typeof LogModule !== 'undefined') {
            LogModule.addLog('export', 'バックアップ', 'system', '手動バックアップを作成');
        }

        return backupData;
    },

    /**
     * チェックサム計算（簡易版）
     */
    calculateChecksum(data) {
        const str = JSON.stringify({
            users: data.users?.length || 0,
            apps: data.apps?.length || 0,
            incidents: data.incidents?.length || 0,
            changes: data.changes?.length || 0,
            logs: data.logs?.length || 0,
            timestamp: data.timestamp,
        });

        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    },

    /**
     * バックアップ検証
     */
    validateBackup(data) {
        const errors = [];
        const warnings = [];

        // 必須フィールドチェック
        for (const field of this.SCHEMA.requiredFields) {
            if (!data[field]) {
                errors.push(`必須フィールド "${field}" がありません`);
            }
        }

        // バージョンチェック
        if (data.version) {
            const [major] = data.version.split('.');
            const [currentMajor] = this.VERSION.split('.');
            if (parseInt(major) > parseInt(currentMajor)) {
                warnings.push(
                    `バックアップバージョン(${data.version})が現在のバージョン(${this.VERSION})より新しいです`
                );
            }
        }

        // データフィールドの型チェック
        for (const field of this.SCHEMA.dataFields) {
            if (data[field] !== undefined) {
                if (field === 'settings') {
                    if (typeof data[field] !== 'object' || Array.isArray(data[field])) {
                        errors.push(`"${field}" は設定オブジェクトである必要があります`);
                    }
                } else {
                    if (!Array.isArray(data[field])) {
                        errors.push(`"${field}" は配列である必要があります`);
                    }
                }
            }
        }

        // チェックサム検証
        if (data.checksum) {
            const originalChecksum = data.checksum;
            const dataWithoutChecksum = { ...data };
            delete dataWithoutChecksum.checksum;
            const calculatedChecksum = this.calculateChecksum(dataWithoutChecksum);
            if (originalChecksum !== calculatedChecksum) {
                warnings.push('チェックサムが一致しません。データが変更されている可能性があります');
            }
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings,
            summary: {
                users: data.users?.length || 0,
                apps: data.apps?.length || 0,
                incidents: data.incidents?.length || 0,
                changes: data.changes?.length || 0,
                logs: data.logs?.length || 0,
            },
        };
    },

    /**
     * 選択的リストア
     */
    selectiveRestore(data, options = {}) {
        const restoreOptions = {
            settings: options.settings !== false,
            users: options.users !== false,
            apps: options.apps !== false,
            incidents: options.incidents !== false,
            changes: options.changes !== false,
            logs: options.logs !== false,
            merge: options.merge || false, // true: マージ, false: 上書き
        };

        const validation = this.validateBackup(data);
        if (!validation.valid) {
            return {
                success: false,
                errors: validation.errors,
            };
        }

        const restored = {
            settings: false,
            users: 0,
            apps: 0,
            incidents: 0,
            changes: 0,
            logs: 0,
        };

        try {
            // 設定のリストア
            if (restoreOptions.settings && data.settings) {
                if (typeof SettingsModule !== 'undefined') {
                    SettingsModule.save(data.settings);
                    restored.settings = true;
                }
            }

            // DataStoreへのリストア
            if (typeof DataStore !== 'undefined') {
                if (restoreOptions.users && data.users) {
                    if (restoreOptions.merge) {
                        DataStore.users = this.mergeArrays(DataStore.users, data.users, 'id');
                    } else {
                        DataStore.users = data.users;
                    }
                    restored.users = data.users.length;
                }

                if (restoreOptions.apps && data.apps) {
                    if (restoreOptions.merge) {
                        DataStore.apps = this.mergeArrays(DataStore.apps, data.apps, 'id');
                    } else {
                        DataStore.apps = data.apps;
                    }
                    restored.apps = data.apps.length;
                }

                if (restoreOptions.incidents && data.incidents) {
                    if (restoreOptions.merge) {
                        DataStore.incidents = this.mergeArrays(
                            DataStore.incidents,
                            data.incidents,
                            'id'
                        );
                    } else {
                        DataStore.incidents = data.incidents;
                    }
                    restored.incidents = data.incidents.length;
                }

                if (restoreOptions.changes && data.changes) {
                    if (restoreOptions.merge) {
                        DataStore.changes = this.mergeArrays(DataStore.changes, data.changes, 'id');
                    } else {
                        DataStore.changes = data.changes;
                    }
                    restored.changes = data.changes.length;
                }

                if (restoreOptions.logs && data.logs) {
                    if (restoreOptions.merge) {
                        DataStore.logs = this.mergeArrays(DataStore.logs, data.logs, 'id');
                    } else {
                        DataStore.logs = data.logs;
                    }
                    restored.logs = data.logs.length;
                }
            }

            // UI更新
            if (typeof refreshAllModules === 'function') {
                refreshAllModules();
            }
            if (typeof updateDashboard === 'function') {
                updateDashboard();
            }
            if (typeof SettingsModule !== 'undefined' && SettingsModule.loadToForm) {
                SettingsModule.loadToForm();
            }

            if (typeof LogModule !== 'undefined') {
                LogModule.addLog(
                    'update',
                    'バックアップ',
                    'system',
                    `選択的リストア実行: Users=${restored.users}, Apps=${restored.apps}, ` +
                        `Incidents=${restored.incidents}, Changes=${restored.changes}`
                );
            }

            return {
                success: true,
                restored,
                warnings: validation.warnings,
            };
        } catch (error) {
            console.error('[BackupManager] リストアエラー:', error);
            return {
                success: false,
                errors: [error.message],
            };
        }
    },

    /**
     * 配列マージ（IDで重複排除）
     */
    mergeArrays(existing, incoming, idField = 'id') {
        const existingMap = new Map(existing.map(item => [item[idField], item]));
        for (const item of incoming) {
            existingMap.set(item[idField], item);
        }
        return Array.from(existingMap.values());
    },

    /**
     * リストアダイアログ表示
     */
    showRestoreDialog(file) {
        const reader = new FileReader();

        reader.onload = e => {
            try {
                const data = JSON.parse(e.target.result);
                const validation = this.validateBackup(data);

                const modalContent = `
                    <div class="restore-dialog">
                        <div class="restore-validation ${validation.valid ? 'valid' : 'invalid'}">
                            <h4><i class="fas ${validation.valid ? 'fa-check-circle' : 'fa-exclamation-triangle'}"></i>
                                検証結果: ${validation.valid ? '有効' : '無効'}</h4>
                            ${
    validation.errors.length > 0
        ? `
                                <div class="validation-errors">
                                    <strong>エラー:</strong>
                                    <ul>${validation.errors.map(e => `<li>${escapeHtml(e)}</li>`).join('')}</ul>
                                </div>
                            `
        : ''
}
                            ${
    validation.warnings.length > 0
        ? `
                                <div class="validation-warnings">
                                    <strong>警告:</strong>
                                    <ul>${validation.warnings.map(w => `<li>${escapeHtml(w)}</li>`).join('')}</ul>
                                </div>
                            `
        : ''
}
                        </div>

                        <div class="restore-summary">
                            <h4><i class="fas fa-database"></i> バックアップ内容</h4>
                            <table class="summary-table">
                                <tr><td>バージョン</td><td>${escapeHtml(data.version || '-')}</td></tr>
                                <tr><td>作成日時</td><td>${data.timestamp ? new Date(data.timestamp).toLocaleString('ja-JP') : '-'}</td></tr>
                                <tr><td>ユーザー</td><td>${validation.summary.users}件</td></tr>
                                <tr><td>アプリ</td><td>${validation.summary.apps}件</td></tr>
                                <tr><td>インシデント</td><td>${validation.summary.incidents}件</td></tr>
                                <tr><td>変更要求</td><td>${validation.summary.changes}件</td></tr>
                                <tr><td>ログ</td><td>${validation.summary.logs}件</td></tr>
                            </table>
                        </div>

                        <div class="restore-options">
                            <h4><i class="fas fa-cog"></i> リストアオプション</h4>
                            <div class="option-group">
                                <label><input type="checkbox" id="restoreSettings" checked> 設定</label>
                                <label><input type="checkbox" id="restoreUsers" checked> ユーザー</label>
                                <label><input type="checkbox" id="restoreApps" checked> アプリ</label>
                                <label><input type="checkbox" id="restoreIncidents" checked> インシデント</label>
                                <label><input type="checkbox" id="restoreChanges" checked> 変更要求</label>
                                <label><input type="checkbox" id="restoreLogs" checked> ログ</label>
                            </div>
                            <div class="merge-option">
                                <label><input type="checkbox" id="restoreMerge"> 既存データとマージ（チェックなしで上書き）</label>
                            </div>
                        </div>
                    </div>
                `;

                if (typeof openModal === 'function') {
                    openModal('バックアップのリストア', modalContent, () => {
                        if (!validation.valid) {
                            showToast('無効なバックアップファイルです', 'error');
                            return;
                        }

                        const options = {
                            settings: document.getElementById('restoreSettings')?.checked,
                            users: document.getElementById('restoreUsers')?.checked,
                            apps: document.getElementById('restoreApps')?.checked,
                            incidents: document.getElementById('restoreIncidents')?.checked,
                            changes: document.getElementById('restoreChanges')?.checked,
                            logs: document.getElementById('restoreLogs')?.checked,
                            merge: document.getElementById('restoreMerge')?.checked,
                        };

                        const result = this.selectiveRestore(data, options);

                        if (result.success) {
                            showToast('リストアが完了しました', 'success');
                        } else {
                            showToast(
                                'リストアに失敗しました: ' + result.errors.join(', '),
                                'error'
                            );
                        }
                    });
                }
            } catch (error) {
                console.error('[BackupManager] ファイル解析エラー:', error);
                if (typeof showToast === 'function') {
                    showToast('バックアップファイルの解析に失敗しました', 'error');
                }
            }
        };

        reader.readAsText(file);
    },

    /**
     * 自動バックアップ設定UI更新
     */
    updateAutoBackupUI() {
        const config = this.loadConfig();

        const autoBackupEl = document.getElementById('autoBackup');
        if (autoBackupEl) {
            autoBackupEl.checked = config.autoBackupEnabled;
        }

        const intervalEl = document.getElementById('backupInterval');
        if (intervalEl) {
            const intervalMap = {
                60: 'hourly',
                1440: 'daily',
                10080: 'weekly',
            };
            intervalEl.value = intervalMap[config.intervalMinutes] || 'daily';
        }

        const retentionEl = document.getElementById('backupRetention');
        if (retentionEl) {
            retentionEl.value = config.retentionDays;
        }
    },

    /**
     * 自動バックアップ設定保存
     */
    saveAutoBackupSettings() {
        const config = this.loadConfig();

        const autoBackupEl = document.getElementById('autoBackup');
        if (autoBackupEl) {
            config.autoBackupEnabled = autoBackupEl.checked;
        }

        const intervalEl = document.getElementById('backupInterval');
        if (intervalEl) {
            const intervalMap = {
                hourly: 60,
                daily: 1440,
                weekly: 10080,
            };
            config.intervalMinutes = intervalMap[intervalEl.value] || 1440;
        }

        const retentionEl = document.getElementById('backupRetention');
        if (retentionEl) {
            config.retentionDays = parseInt(retentionEl.value) || 7;
        }

        this.saveConfig(config);

        // スケジューラー再起動
        this.stopAutoBackup();
        if (config.autoBackupEnabled) {
            this.startAutoBackup();
        }

        if (typeof showToast === 'function') {
            showToast('自動バックアップ設定を保存しました', 'success');
        }
        if (typeof LogModule !== 'undefined') {
            LogModule.addLog('update', 'システム設定', 'system', '自動バックアップ設定を更新');
        }
    },

    /**
     * バックアップ統計取得
     */
    getStatistics() {
        const history = this.getBackupHistory();
        const config = this.loadConfig();

        const autoBackups = history.filter(b => b.type === 'auto');
        const manualBackups = history.filter(b => b.type === 'manual');
        const totalSize = history.reduce((sum, b) => sum + (b.size || 0), 0);

        return {
            totalBackups: history.length,
            autoBackups: autoBackups.length,
            manualBackups: manualBackups.length,
            totalSize,
            lastBackup: history[0]?.date || null,
            nextScheduled:
                config.autoBackupEnabled && config.lastAutoBackup
                    ? new Date(
                        new Date(config.lastAutoBackup).getTime() +
                              config.intervalMinutes * 60 * 1000
                    )
                    : null,
            autoBackupEnabled: config.autoBackupEnabled,
        };
    },
};

// グローバルエクスポート
if (typeof window !== 'undefined') {
    window.BackupManager = BackupManager;
}
