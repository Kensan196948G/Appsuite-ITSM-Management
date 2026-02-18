/**
 * AppSuite 管理運用システム - 機能モジュール
 */

/**
 * メールアドレス検証
 * @param {string} value - 検証する値
 * @returns {boolean} - 有効なメールアドレスの場合true
 */
function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * 機密情報フィルタリング（ログ・エクスポート用）
 * CVE-004対策: パスワード、APIキー、トークン等の機密情報を除外
 * @param {string} text - フィルタリング対象のテキスト
 * @returns {string} - 機密情報をマスキングしたテキスト
 */
function sanitizeSensitiveData(text) {
    if (!text || typeof text !== 'string') {
        return text;
    }

    // 機密情報パターンのマスキング
    let sanitized = text;

    // パスワード関連
    sanitized = sanitized.replace(
        /(password|passwd|pwd)[\s:=]+['"]?[\w!@#$%^&*()_+-=]+['"]?/gi,
        '$1: ******'
    );

    // APIキー関連
    sanitized = sanitized.replace(
        /(api[-_]?key|apikey|token|bearer)[\s:=]+['"]?[\w-]+['"]?/gi,
        '$1: ******'
    );

    // 認証情報
    sanitized = sanitized.replace(/(authorization)[\s:=]+['"]?[\w\s]+['"]?/gi, '$1: ******');

    // クレジットカード番号パターン（念のため）
    sanitized = sanitized.replace(
        /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
        '****-****-****-****'
    );

    return sanitized;
}

// ユーザー管理モジュール
const UserModule = {
    refresh() {
        this.render(DataStore.users);
    },

    render(users) {
        const readOnly = window.ApiSync?.isReadOnly;
        const tbody = document.getElementById('usersTableBody');
        tbody.innerHTML = users
            .map(
                user => `
            <tr>
                <td>${escapeHtml(user.id)}</td>
                <td>${escapeHtml(user.username)}</td>
                <td>${escapeHtml(user.email)}</td>
                <td>${escapeHtml(user.department)}</td>
                <td><span class="badge ${user.role === '管理者' ? 'badge-primary' : 'badge-info'}">${escapeHtml(user.role)}</span></td>
                <td><span class="badge ${user.status === 'active' ? 'badge-success' : 'badge-secondary'}">${user.status === 'active' ? '有効' : '無効'}</span></td>
                <td>${escapeHtml(user.lastLogin)}</td>
                <td>
                    <button class="action-btn edit" onclick="UserModule.edit('${escapeHtml(user.id)}')" title="${readOnly ? '参照専用のため編集不可' : '編集'}" ${readOnly ? 'disabled' : ''}><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete" onclick="UserModule.delete('${escapeHtml(user.id)}')" title="${readOnly ? '参照専用のため削除不可' : '削除'}" ${readOnly ? 'disabled' : ''}><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `
            )
            .join('');
    },

    showAddModal() {
        openModal(
            'ユーザー追加',
            `
            <div class="form-group">
                <label>ユーザー名</label>
                <input type="text" id="newUserName" required>
            </div>
            <div class="form-group">
                <label>メールアドレス</label>
                <input type="email" id="newUserEmail" required>
            </div>
            <div class="form-group">
                <label>部署</label>
                <select id="newUserDept">
                    <option>情報システム部</option>
                    <option>営業部</option>
                    <option>総務部</option>
                    <option>開発部</option>
                    <option>経理部</option>
                </select>
            </div>
            <div class="form-group">
                <label>権限</label>
                <select id="newUserRole">
                    <option value="ユーザー">ユーザー</option>
                    <option value="管理者">管理者</option>
                </select>
            </div>
            <div class="form-group">
                <label>ステータス</label>
                <select id="newUserStatus">
                    <option value="active">有効</option>
                    <option value="inactive">無効</option>
                </select>
            </div>
        `,
            [
                { text: 'キャンセル', class: 'btn-secondary', onclick: closeModal },
                { text: '追加', class: 'btn-primary', onclick: () => UserModule.add() },
            ]
        );
    },

    add() {
        const username = document.getElementById('newUserName').value.trim();
        const email = document.getElementById('newUserEmail').value.trim();
        if (!username || username.length > 50) {
            showToast('ユーザー名は1-50文字で入力してください', 'error');
            return;
        }
        if (!isValidEmail(email)) {
            showToast('メールアドレス形式が正しくありません', 'error');
            return;
        }
        const newUser = {
            id: 'U' + String(DataStore.users.length + 1).padStart(4, '0'),
            username: username,
            email: email,
            department: document.getElementById('newUserDept').value,
            role: document.getElementById('newUserRole').value,
            status: document.getElementById('newUserStatus').value,
            lastLogin: '-',
        };
        DataStore.users.push(newUser);
        this.refresh();
        closeModal();
        showToast('ユーザーを追加しました', 'success');
        LogModule.addLog('create', 'ユーザー', 'user', '新規ユーザー追加: ' + newUser.username);
        updateDashboard();
    },

    edit(id) {
        const user = DataStore.users.find(u => u.id === id);
        openModal(
            'ユーザー編集',
            `
            <div class="form-group">
                <label>ユーザー名</label>
                <input type="text" id="editUserName" value="${escapeHtml(user.username)}">
            </div>
            <div class="form-group">
                <label>メールアドレス</label>
                <input type="email" id="editUserEmail" value="${escapeHtml(user.email)}">
            </div>
            <div class="form-group">
                <label>部署</label>
                <select id="editUserDept">
                    ${['情報システム部', '営業部', '総務部', '開発部', '経理部']
        .map(
            d => `<option ${d === user.department ? 'selected' : ''}>${d}</option>`
        )
        .join('')}
                </select>
            </div>
            <div class="form-group">
                <label>権限</label>
                <select id="editUserRole">
                    <option ${user.role === 'ユーザー' ? 'selected' : ''}>ユーザー</option>
                    <option ${user.role === '管理者' ? 'selected' : ''}>管理者</option>
                </select>
            </div>
            <div class="form-group">
                <label>ステータス</label>
                <select id="editUserStatus">
                    <option value="active" ${user.status === 'active' ? 'selected' : ''}>有効</option>
                    <option value="inactive" ${user.status === 'inactive' ? 'selected' : ''}>無効</option>
                </select>
            </div>
        `,
            [
                { text: 'キャンセル', class: 'btn-secondary', onclick: closeModal },
                { text: '保存', class: 'btn-primary', onclick: () => UserModule.save(id) },
            ]
        );
    },

    save(id) {
        const user = DataStore.users.find(u => u.id === id);
        const username = document.getElementById('editUserName').value.trim();
        const email = document.getElementById('editUserEmail').value.trim();
        if (!username || username.length > 50) {
            showToast('ユーザー名は1-50文字で入力してください', 'error');
            return;
        }
        if (!isValidEmail(email)) {
            showToast('メールアドレス形式が正しくありません', 'error');
            return;
        }
        user.username = username;
        user.email = email;
        user.department = document.getElementById('editUserDept').value;
        user.role = document.getElementById('editUserRole').value;
        user.status = document.getElementById('editUserStatus').value;
        this.refresh();
        closeModal();
        showToast('ユーザー情報を更新しました', 'success');
        LogModule.addLog('update', 'ユーザー', 'user', 'ユーザー更新: ' + user.username);
        updateDashboard();
    },

    delete(id) {
        const user = DataStore.users.find(u => u.id === id);
        if (confirm(`ユーザー「${user.username}」を削除しますか？`)) {
            const idx = DataStore.users.findIndex(u => u.id === id);
            DataStore.users.splice(idx, 1);
            this.refresh();
            showToast('ユーザーを削除しました', 'success');
            LogModule.addLog('delete', 'ユーザー', 'user', 'ユーザー削除: ' + user.username);
            updateDashboard();
        }
    },

    filter() {
        const search = document.getElementById('userSearch').value.toLowerCase();
        const status = document.getElementById('userStatusFilter').value;
        const role = document.getElementById('userRoleFilter').value;

        let filtered = DataStore.users;

        if (search) {
            filtered = filtered.filter(
                u =>
                    u.username.toLowerCase().includes(search) ||
                    u.email.toLowerCase().includes(search)
            );
        }
        if (status) {
            filtered = filtered.filter(u => u.status === status);
        }
        if (role) {
            filtered = filtered.filter(u => u.role === role);
        }

        this.render(filtered);
    },
};

// アプリ管理モジュール
const AppModule = {
    refresh() {
        this.render(DataStore.apps);
    },

    render(apps) {
        const readOnly = window.ApiSync?.isReadOnly;
        const tbody = document.getElementById('appsTableBody');
        tbody.innerHTML = apps
            .map(
                app => `
            <tr>
                <td>${escapeHtml(app.id)}</td>
                <td>${escapeHtml(app.name)}</td>
                <td>${escapeHtml(app.category)}</td>
                <td>${escapeHtml(app.creator)}</td>
                <td>${app.records.toLocaleString()}</td>
                <td><span class="badge ${this.getStatusBadge(app.status)}">${this.getStatusText(app.status)}</span></td>
                <td>${escapeHtml(app.updated)}</td>
                <td>
                    <button class="action-btn view" onclick="AppModule.view('${escapeHtml(app.id)}')" title="詳細"><i class="fas fa-eye"></i></button>
                    <button class="action-btn edit" onclick="AppModule.edit('${escapeHtml(app.id)}')" title="${readOnly ? '参照専用のため編集不可' : '編集'}" ${readOnly ? 'disabled' : ''}><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete" onclick="AppModule.delete('${escapeHtml(app.id)}')" title="${readOnly ? '参照専用のため削除不可' : '削除'}" ${readOnly ? 'disabled' : ''}><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `
            )
            .join('');
    },

    getStatusBadge(status) {
        const badges = {
            active: 'badge-success',
            maintenance: 'badge-warning',
            inactive: 'badge-secondary',
        };
        return badges[status] || 'badge-secondary';
    },

    getStatusText(status) {
        const texts = { active: '稼働中', maintenance: 'メンテナンス', inactive: '停止中' };
        return texts[status] || status;
    },

    showAddModal() {
        openModal(
            '新規アプリ登録',
            `
            <div class="form-group">
                <label>アプリ名</label>
                <input type="text" id="newAppName" required>
            </div>
            <div class="form-group">
                <label>カテゴリ</label>
                <select id="newAppCategory">
                    <option>業務管理</option>
                    <option>申請・承認</option>
                    <option>データ管理</option>
                    <option>その他</option>
                </select>
            </div>
            <div class="form-group">
                <label>作成者</label>
                <input type="text" id="newAppCreator" value="${document.getElementById('currentUser').textContent}">
            </div>
            <div class="form-group">
                <label>ステータス</label>
                <select id="newAppStatus">
                    <option value="active">稼働中</option>
                    <option value="maintenance">メンテナンス</option>
                    <option value="inactive">停止中</option>
                </select>
            </div>
            <div class="form-group">
                <label>説明</label>
                <textarea id="newAppDesc" rows="3" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;"></textarea>
            </div>
        `,
            [
                { text: 'キャンセル', class: 'btn-secondary', onclick: closeModal },
                { text: '登録', class: 'btn-primary', onclick: () => AppModule.add() },
            ]
        );
    },

    add() {
        const name = document.getElementById('newAppName').value.trim();
        const creator = document.getElementById('newAppCreator').value.trim();
        if (!name || name.length > 100) {
            showToast('アプリ名は1-100文字で入力してください', 'error');
            return;
        }
        if (!creator || creator.length > 50) {
            showToast('作成者は1-50文字で入力してください', 'error');
            return;
        }
        const newApp = {
            id: 'APP' + String(DataStore.apps.length + 1).padStart(3, '0'),
            name: name,
            category: document.getElementById('newAppCategory').value,
            creator: creator,
            records: 0,
            status: document.getElementById('newAppStatus').value,
            updated: new Date().toISOString().split('T')[0],
            description: document.getElementById('newAppDesc').value.trim(),
        };
        DataStore.apps.push(newApp);
        this.refresh();
        closeModal();
        showToast('アプリを登録しました', 'success');
        LogModule.addLog('create', newApp.name, 'app', '新規アプリ作成');
        updateDashboard();
    },

    view(id) {
        const app = DataStore.apps.find(a => a.id === id);
        openModal(
            'アプリ詳細: ' + app.name,
            `
            <div style="line-height: 2;">
                <p><strong>アプリID:</strong> ${app.id}</p>
                <p><strong>アプリ名:</strong> ${app.name}</p>
                <p><strong>カテゴリ:</strong> ${app.category}</p>
                <p><strong>作成者:</strong> ${app.creator}</p>
                <p><strong>レコード数:</strong> ${app.records.toLocaleString()}件</p>
                <p><strong>ステータス:</strong> ${this.getStatusText(app.status)}</p>
                <p><strong>最終更新:</strong> ${app.updated}</p>
                <p><strong>説明:</strong></p>
                <p style="background:#f8fafc;padding:10px;border-radius:8px;">${app.description || '（なし）'}</p>
            </div>
        `,
            [{ text: '閉じる', class: 'btn-secondary', onclick: closeModal }]
        );
    },

    edit(id) {
        const app = DataStore.apps.find(a => a.id === id);
        openModal(
            'アプリ編集: ' + app.name,
            `
            <div class="form-group">
                <label>アプリ名</label>
                <input type="text" id="editAppName" value="${escapeHtml(app.name)}">
            </div>
            <div class="form-group">
                <label>カテゴリ</label>
                <select id="editAppCategory">
                    ${['業務管理', '申請・承認', 'データ管理', 'その他']
        .map(c => `<option ${c === app.category ? 'selected' : ''}>${c}</option>`)
        .join('')}
                </select>
            </div>
            <div class="form-group">
                <label>作成者</label>
                <input type="text" id="editAppCreator" value="${escapeHtml(app.creator)}">
            </div>
            <div class="form-group">
                <label>ステータス</label>
                <select id="editAppStatus">
                    <option value="active" ${app.status === 'active' ? 'selected' : ''}>稼働中</option>
                    <option value="maintenance" ${app.status === 'maintenance' ? 'selected' : ''}>メンテナンス</option>
                    <option value="inactive" ${app.status === 'inactive' ? 'selected' : ''}>停止中</option>
                </select>
            </div>
            <div class="form-group">
                <label>説明</label>
                <textarea id="editAppDesc" rows="3" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;">${app.description || ''}</textarea>
            </div>
        `,
            [
                { text: 'キャンセル', class: 'btn-secondary', onclick: closeModal },
                { text: '保存', class: 'btn-primary', onclick: () => AppModule.save(id) },
            ]
        );
    },

    save(id) {
        const app = DataStore.apps.find(a => a.id === id);
        const name = document.getElementById('editAppName').value.trim();
        const creator = document.getElementById('editAppCreator').value.trim();
        if (!name || name.length > 100) {
            showToast('アプリ名は1-100文字で入力してください', 'error');
            return;
        }
        if (!creator || creator.length > 50) {
            showToast('作成者は1-50文字で入力してください', 'error');
            return;
        }
        app.name = name;
        app.category = document.getElementById('editAppCategory').value;
        app.creator = creator;
        app.status = document.getElementById('editAppStatus').value;
        app.updated = new Date().toISOString().split('T')[0];
        app.description = document.getElementById('editAppDesc').value.trim();
        this.refresh();
        closeModal();
        showToast('アプリ情報を更新しました', 'success');
        LogModule.addLog('update', app.name, 'app', 'アプリ設定を更新');
        updateDashboard();
    },

    delete(id) {
        const app = DataStore.apps.find(a => a.id === id);
        if (
            confirm(
                `アプリ「${app.name}」を削除しますか？\n※ ${app.records}件のレコードも削除されます。`
            )
        ) {
            const idx = DataStore.apps.findIndex(a => a.id === id);
            DataStore.apps.splice(idx, 1);
            this.refresh();
            showToast('アプリを削除しました', 'success');
            LogModule.addLog('delete', app.name, 'app', 'アプリ削除');
            updateDashboard();
        }
    },

    filter() {
        const search = document.getElementById('appSearch').value.toLowerCase();
        const category = document.getElementById('appCategoryFilter').value;
        const status = document.getElementById('appStatusFilter').value;

        let filtered = DataStore.apps;

        if (search) {
            filtered = filtered.filter(a => a.name.toLowerCase().includes(search));
        }
        if (category) {
            filtered = filtered.filter(a => a.category === category);
        }
        if (status) {
            filtered = filtered.filter(a => a.status === status);
        }

        this.render(filtered);
    },
};

// 監査ログモジュール
const LogModule = {
    refresh() {
        this.render(DataStore.logs);
    },

    render(logs) {
        const tbody = document.getElementById('logsTableBody');
        tbody.innerHTML = logs
            .map(
                log => `
            <tr>
                <td>${escapeHtml(log.timestamp)}</td>
                <td>${escapeHtml(log.user)}</td>
                <td><span class="badge ${this.getActionBadge(log.action)}">${this.getActionText(log.action)}</span></td>
                <td>${escapeHtml(log.target)}</td>
                <td>${escapeHtml(log.detail)}</td>
                <td>${escapeHtml(log.ip)}</td>
            </tr>
        `
            )
            .join('');
    },

    getActionBadge(action) {
        const badges = {
            login: 'badge-success',
            logout: 'badge-secondary',
            create: 'badge-info',
            update: 'badge-warning',
            delete: 'badge-danger',
            export: 'badge-info',
            escalation: 'badge-danger',
        };
        return badges[action] || 'badge-secondary';
    },

    getActionText(action) {
        const texts = {
            login: 'ログイン',
            logout: 'ログアウト',
            create: '作成',
            update: '更新',
            delete: '削除',
            export: 'エクスポート',
            escalation: 'エスカレート',
        };
        return texts[action] || action;
    },

    addLog(action, target, targetType, detail) {
        const now = new Date();
        const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

        // IPアドレスの取得
        // 注意: ブラウザ環境ではクライアントIPアドレスを直接取得することは
        // セキュリティ上の理由により不可能です。
        // 本番環境では、サーバーサイドでリクエストヘッダー（X-Forwarded-For等）から
        // IPアドレスを取得し、APIレスポンスに含めるか、サーバーサイドでログを記録してください。
        const clientIp = this.getClientIP();

        // CVE-004対策: 機密情報のフィルタリング
        const sanitizedDetail = sanitizeSensitiveData(detail);
        const sanitizedTarget = sanitizeSensitiveData(target);

        DataStore.logs.unshift({
            timestamp: timestamp,
            user: document.getElementById('currentUser').textContent,
            action: action,
            target: sanitizedTarget,
            targetType: targetType,
            detail: sanitizedDetail,
            ip: clientIp,
        });
    },

    /**
     * クライアントIPアドレス取得（ブラウザ環境では制限あり）
     * @returns {string} IPアドレス（取得不可の場合は'N/A'）
     */
    getClientIP() {
        // ブラウザ環境では真のクライアントIPを取得できないため、
        // 'N/A'を返します。
        //
        // 本番環境での推奨実装:
        // 1. サーバーAPIエンドポイント（/api/client-info）を作成
        // 2. サーバー側でリクエストヘッダーからIPを取得
        //    - req.headers['x-forwarded-for']（プロキシ経由の場合）
        //    - req.connection.remoteAddress（直接接続の場合）
        // 3. 各ログ記録時にAPIを呼び出してIPを取得
        //
        // 将来の実装例:
        // if (typeof ApiClient !== 'undefined' && ApiClient.getClientInfo) {
        //     return await ApiClient.getClientInfo();
        // }

        return 'N/A (ブラウザ側では取得不可)';
    },

    search() {
        const from = document.getElementById('logDateFrom').value;
        const to = document.getElementById('logDateTo').value;
        const actionType = document.getElementById('logTypeFilter').value;
        const targetType = document.getElementById('logTargetFilter').value;

        let filtered = DataStore.logs;

        if (actionType) {
            filtered = filtered.filter(l => l.action === actionType);
        }
        if (targetType) {
            filtered = filtered.filter(l => l.targetType === targetType);
        }
        if (from) {
            filtered = filtered.filter(l => l.timestamp >= from);
        }
        if (to) {
            filtered = filtered.filter(l => l.timestamp <= to + ' 23:59:59');
        }

        this.render(filtered);
        showToast(`${filtered.length}件のログが見つかりました`, 'success');
    },

    export() {
        const now = new Date();
        const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
        const csv =
            '\uFEFF日時,ユーザー,操作タイプ,対象,詳細,IPアドレス\n' +
            DataStore.logs
                .map(
                    l =>
                        `"${l.timestamp}","${l.user}","${this.getActionText(l.action)}","${l.target}","${l.detail}","${l.ip}"`
                )
                .join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'audit_log_' + timestamp + '.csv';
        a.click();
        showToast('ログをエクスポートしました', 'success');
        this.addLog('export', '監査ログ', 'system', 'CSVエクスポート実行');
    },

    /**
     * JSON形式でエクスポート
     */
    exportJSON() {
        const now = new Date();
        const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;

        const data = {
            exportedAt: now.toISOString(),
            version: '1.0.0',
            totalCount: DataStore.logs.length,
            logs: DataStore.logs.map(log => ({
                timestamp: log.timestamp,
                user: log.user,
                action: log.action,
                actionLabel: this.getActionText(log.action),
                target: log.target,
                targetType: log.targetType,
                detail: log.detail,
                ip: log.ip,
            })),
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json;charset=utf-8',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'audit_log_' + timestamp + '.json';
        a.click();
        URL.revokeObjectURL(url);

        showToast('ログをJSON形式でエクスポートしました', 'success');
        this.addLog('export', '監査ログ', 'system', 'JSONエクスポート実行');
    },

    /**
     * フィルタ付きエクスポート
     * @param {string} format - 'csv' または 'json'
     * @param {Object} filter - フィルタ条件
     */
    exportFiltered(format, filter = {}) {
        let logs = [...DataStore.logs];

        // フィルタ適用
        if (filter.from) {
            logs = logs.filter(l => l.timestamp >= filter.from);
        }
        if (filter.to) {
            logs = logs.filter(l => l.timestamp <= filter.to + ' 23:59:59');
        }
        if (filter.action) {
            logs = logs.filter(l => l.action === filter.action);
        }
        if (filter.targetType) {
            logs = logs.filter(l => l.targetType === filter.targetType);
        }

        const now = new Date();
        const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;

        if (format === 'json') {
            const data = {
                exportedAt: now.toISOString(),
                version: '1.0.0',
                filter: filter,
                totalCount: logs.length,
                logs: logs.map(log => ({
                    timestamp: log.timestamp,
                    user: log.user,
                    action: log.action,
                    actionLabel: this.getActionText(log.action),
                    target: log.target,
                    targetType: log.targetType,
                    detail: log.detail,
                    ip: log.ip,
                })),
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], {
                type: 'application/json;charset=utf-8',
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'audit_log_filtered_' + timestamp + '.json';
            a.click();
            URL.revokeObjectURL(url);
        } else {
            const csv =
                '\uFEFF日時,ユーザー,操作タイプ,対象,詳細,IPアドレス\n' +
                logs
                    .map(
                        l =>
                            `"${l.timestamp}","${l.user}","${this.getActionText(l.action)}","${l.target}","${l.detail}","${l.ip}"`
                    )
                    .join('\n');

            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'audit_log_filtered_' + timestamp + '.csv';
            a.click();
            URL.revokeObjectURL(url);
        }

        showToast(
            `${logs.length}件のログを${format.toUpperCase()}形式でエクスポートしました`,
            'success'
        );
        this.addLog(
            'export',
            '監査ログ',
            'system',
            `${format.toUpperCase()}エクスポート実行（フィルタ適用）`
        );
    },

    renderRecent() {
        const recentLogs = DataStore.logs.slice(0, 10);
        const container = document.getElementById('recentLogs');
        container.innerHTML = recentLogs
            .map(
                log => `
            <div class="log-item">
                <span class="log-time">${escapeHtml(log.timestamp)}</span>
                <span class="log-user">${escapeHtml(log.user)}</span>が
                <span class="badge ${this.getActionBadge(log.action)}" style="font-size:0.7rem;">${this.getActionText(log.action)}</span>
                ${escapeHtml(log.target)}
            </div>
        `
            )
            .join('');
    },
};

// インシデント管理モジュール
const IncidentModule = {
    refresh() {
        this.render(DataStore.incidents);
    },

    render(incidents) {
        const tbody = document.getElementById('incidentsTableBody');
        tbody.innerHTML = incidents
            .map(
                inc => `
            <tr>
                <td>${escapeHtml(inc.id)}</td>
                <td>${escapeHtml(inc.title)}</td>
                <td>${escapeHtml(inc.appName)}</td>
                <td><span class="badge ${this.getPriorityBadge(inc.priority)}">${this.getPriorityText(inc.priority)}</span></td>
                <td><span class="badge ${this.getStatusBadge(inc.status)}">${this.getStatusText(inc.status)}</span></td>
                <td>${escapeHtml(inc.reporter)}</td>
                <td>${escapeHtml(inc.assignee)}</td>
                <td>${escapeHtml(inc.created)}</td>
                <td>
                    <button class="action-btn view" onclick="IncidentModule.view('${escapeHtml(inc.id)}')" title="詳細"><i class="fas fa-eye"></i></button>
                    <button class="action-btn edit" onclick="IncidentModule.edit('${escapeHtml(inc.id)}')" title="編集"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete" onclick="IncidentModule.delete('${escapeHtml(inc.id)}')" title="削除"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `
            )
            .join('');
    },

    getPriorityBadge(priority) {
        const badges = { high: 'badge-danger', medium: 'badge-warning', low: 'badge-info' };
        return badges[priority] || 'badge-secondary';
    },

    getPriorityText(priority) {
        const texts = { high: '高', medium: '中', low: '低' };
        return texts[priority] || priority;
    },

    getStatusBadge(status) {
        const badges = {
            open: 'badge-danger',
            in_progress: 'badge-warning',
            resolved: 'badge-info',
            closed: 'badge-success',
        };
        return badges[status] || 'badge-secondary';
    },

    getStatusText(status) {
        const texts = {
            open: 'オープン',
            in_progress: '対応中',
            resolved: '解決済',
            closed: 'クローズ',
        };
        return texts[status] || status;
    },

    showAddModal() {
        const appOptions = DataStore.apps
            .map(a => `<option value="${a.id}" data-name="${a.name}">${a.name}</option>`)
            .join('');
        const userOptions = DataStore.users
            .filter(u => u.status === 'active')
            .map(u => `<option value="${u.username}">${u.username}</option>`)
            .join('');

        openModal(
            'インシデント登録',
            `
            <div class="form-group">
                <label>タイトル</label>
                <input type="text" id="newIncTitle" required>
            </div>
            <div class="form-group">
                <label>対象アプリ</label>
                <select id="newIncApp">
                    ${appOptions}
                </select>
            </div>
            <div class="form-group">
                <label>優先度</label>
                <select id="newIncPriority">
                    <option value="low">低</option>
                    <option value="medium" selected>中</option>
                    <option value="high">高</option>
                </select>
            </div>
            <div class="form-group">
                <label>担当者</label>
                <select id="newIncAssignee">
                    <option value="-">未割当</option>
                    ${userOptions}
                </select>
            </div>
            <div class="form-group">
                <label>説明</label>
                <textarea id="newIncDesc" rows="3" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;"></textarea>
            </div>
        `,
            [
                { text: 'キャンセル', class: 'btn-secondary', onclick: closeModal },
                { text: '登録', class: 'btn-primary', onclick: () => IncidentModule.add() },
            ]
        );
    },

    add() {
        const appSelect = document.getElementById('newIncApp');
        const selectedOption = appSelect.options[appSelect.selectedIndex];
        const newInc = {
            id: 'INC' + String(DataStore.incidents.length + 1).padStart(3, '0'),
            title: document.getElementById('newIncTitle').value,
            appId: appSelect.value,
            appName: selectedOption.dataset.name,
            priority: document.getElementById('newIncPriority').value,
            status: 'open',
            reporter: document.getElementById('currentUser').textContent,
            assignee: document.getElementById('newIncAssignee').value,
            created: new Date().toISOString().split('T')[0],
            description: document.getElementById('newIncDesc').value,
        };
        DataStore.incidents.push(newInc);
        this.refresh();
        closeModal();
        showToast('インシデントを登録しました', 'success');
        LogModule.addLog(
            'create',
            'インシデント',
            'incident',
            '新規インシデント登録: ' + newInc.title
        );
        updateDashboard();

        // 通知トリガー
        if (typeof NotificationManager !== 'undefined') {
            NotificationManager.notifyIncidentCreated(newInc);
            if (newInc.priority === 'high') {
                NotificationManager.notifyHighPriorityIncident(newInc);
            }
        }
    },

    view(id) {
        const inc = DataStore.incidents.find(i => i.id === id);
        openModal(
            'インシデント詳細: ' + inc.id,
            `
            <div style="line-height: 2;">
                <p><strong>インシデントID:</strong> ${inc.id}</p>
                <p><strong>タイトル:</strong> ${inc.title}</p>
                <p><strong>対象アプリ:</strong> ${inc.appName}</p>
                <p><strong>優先度:</strong> <span class="badge ${this.getPriorityBadge(inc.priority)}">${this.getPriorityText(inc.priority)}</span></p>
                <p><strong>ステータス:</strong> <span class="badge ${this.getStatusBadge(inc.status)}">${this.getStatusText(inc.status)}</span></p>
                <p><strong>報告者:</strong> ${inc.reporter}</p>
                <p><strong>担当者:</strong> ${inc.assignee}</p>
                <p><strong>登録日:</strong> ${inc.created}</p>
                <p><strong>説明:</strong></p>
                <p style="background:#f8fafc;padding:10px;border-radius:8px;">${inc.description || '（なし）'}</p>
            </div>
        `,
            [{ text: '閉じる', class: 'btn-secondary', onclick: closeModal }]
        );
    },

    edit(id) {
        const inc = DataStore.incidents.find(i => i.id === id);
        const appOptions = DataStore.apps
            .map(
                a =>
                    `<option value="${a.id}" data-name="${a.name}" ${a.id === inc.appId ? 'selected' : ''}>${a.name}</option>`
            )
            .join('');
        const userOptions = DataStore.users
            .filter(u => u.status === 'active')
            .map(
                u =>
                    `<option value="${u.username}" ${u.username === inc.assignee ? 'selected' : ''}>${u.username}</option>`
            )
            .join('');

        openModal(
            'インシデント編集: ' + inc.id,
            `
            <div class="form-group">
                <label>タイトル</label>
                <input type="text" id="editIncTitle" value="${escapeHtml(inc.title)}">
            </div>
            <div class="form-group">
                <label>対象アプリ</label>
                <select id="editIncApp">
                    ${appOptions}
                </select>
            </div>
            <div class="form-group">
                <label>優先度</label>
                <select id="editIncPriority">
                    <option value="low" ${inc.priority === 'low' ? 'selected' : ''}>低</option>
                    <option value="medium" ${inc.priority === 'medium' ? 'selected' : ''}>中</option>
                    <option value="high" ${inc.priority === 'high' ? 'selected' : ''}>高</option>
                </select>
            </div>
            <div class="form-group">
                <label>ステータス</label>
                <select id="editIncStatus">
                    <option value="open" ${inc.status === 'open' ? 'selected' : ''}>オープン</option>
                    <option value="in_progress" ${inc.status === 'in_progress' ? 'selected' : ''}>対応中</option>
                    <option value="resolved" ${inc.status === 'resolved' ? 'selected' : ''}>解決済</option>
                    <option value="closed" ${inc.status === 'closed' ? 'selected' : ''}>クローズ</option>
                </select>
            </div>
            <div class="form-group">
                <label>担当者</label>
                <select id="editIncAssignee">
                    <option value="-" ${inc.assignee === '-' ? 'selected' : ''}>未割当</option>
                    ${userOptions}
                </select>
            </div>
            <div class="form-group">
                <label>説明</label>
                <textarea id="editIncDesc" rows="3" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;">${inc.description || ''}</textarea>
            </div>
        `,
            [
                { text: 'キャンセル', class: 'btn-secondary', onclick: closeModal },
                { text: '保存', class: 'btn-primary', onclick: () => IncidentModule.save(id) },
            ]
        );
    },

    save(id) {
        const inc = DataStore.incidents.find(i => i.id === id);
        const appSelect = document.getElementById('editIncApp');
        const selectedOption = appSelect.options[appSelect.selectedIndex];
        const nextStatus = document.getElementById('editIncStatus').value;
        const newAssignee = document.getElementById('editIncAssignee').value;

        // ステータス遷移検証（WorkflowEngineまたはローカル検証）
        if (typeof WorkflowEngine !== 'undefined') {
            const result = WorkflowEngine.isValidIncidentTransition(inc.status, nextStatus);
            if (!result.valid) {
                showToast(result.message, 'error');
                return;
            }
        } else if (!this.isValidStatusTransition(inc.status, nextStatus)) {
            showToast('ステータス遷移ルールに違反しています', 'error');
            return;
        }

        // 変更前の値を保存（通知用）
        const oldStatus = inc.status;
        const oldAssignee = inc.assignee;

        // 値を更新
        inc.title = document.getElementById('editIncTitle').value;
        inc.appId = appSelect.value;
        inc.appName = selectedOption.dataset.name;
        inc.priority = document.getElementById('editIncPriority').value;
        inc.status = nextStatus;
        inc.assignee = newAssignee;
        inc.description = document.getElementById('editIncDesc').value;
        inc.updatedAt = new Date().toISOString();

        this.refresh();
        closeModal();
        showToast('インシデントを更新しました', 'success');
        LogModule.addLog('update', 'インシデント', 'incident', 'インシデント更新: ' + inc.title);
        updateDashboard();

        // 通知トリガー
        if (typeof NotificationManager !== 'undefined') {
            // ステータス変更通知
            if (oldStatus !== nextStatus) {
                NotificationManager.notifyStatusChange(inc, 'incident', nextStatus);
            }
            // 担当者変更通知
            if (oldAssignee !== newAssignee && newAssignee !== '-') {
                NotificationManager.notifyAssignment(inc);
            }
        }
    },

    delete(id) {
        const inc = DataStore.incidents.find(i => i.id === id);
        if (confirm(`インシデント「${inc.title}」を削除しますか？`)) {
            const idx = DataStore.incidents.findIndex(i => i.id === id);
            DataStore.incidents.splice(idx, 1);
            this.refresh();
            showToast('インシデントを削除しました', 'success');
            LogModule.addLog(
                'delete',
                'インシデント',
                'incident',
                'インシデント削除: ' + inc.title
            );
            updateDashboard();
        }
    },

    filter() {
        const search = document.getElementById('incidentSearch').value.toLowerCase();
        const priority = document.getElementById('incidentPriorityFilter').value;
        const status = document.getElementById('incidentStatusFilter').value;

        let filtered = DataStore.incidents;

        if (search) {
            filtered = filtered.filter(
                i =>
                    i.title.toLowerCase().includes(search) ||
                    (i.description || '').toLowerCase().includes(search)
            );
        }
        if (priority) {
            filtered = filtered.filter(i => i.priority === priority);
        }
        if (status) {
            filtered = filtered.filter(i => i.status === status);
        }

        this.render(filtered);
    },

    isValidStatusTransition(currentStatus, nextStatus) {
        if (currentStatus === nextStatus) {
            return true;
        }
        const transitions = {
            open: ['in_progress', 'closed'],
            in_progress: ['resolved', 'open'],
            resolved: ['closed', 'in_progress'],
            closed: ['in_progress'],
        };
        return (transitions[currentStatus] || []).includes(nextStatus);
    },
};

// システム設定モジュール
const SettingsModule = {
    // 設定データのデフォルト値
    defaults: {
        api: {
            url: '',
            key: '',
            authMethod: 'bearer',
            timeout: 30,
            syncInterval: 30,
        },
        general: {
            systemName: 'AppSuite 管理運用システム',
            orgName: '',
            adminEmail: '',
            theme: 'light',
            language: 'ja',
            dateFormat: 'yyyy-MM-dd',
            pageSize: 25,
        },
        notification: {
            incidentNew: true,
            incidentHigh: true,
            changeApproval: true,
            changeComplete: false,
            smtpHost: '',
            smtpPort: 587,
            smtpUser: '',
            smtpPass: '',
            smtpSsl: true,
        },
        security: {
            pwMinLength: 8,
            pwRequireUpper: true,
            pwRequireNumber: true,
            pwRequireSpecial: false,
            pwExpireDays: 90,
            sessionTimeout: 30,
            maxSessions: 3,
            enableTwoFactor: false,
            maxLoginAttempts: 5,
            lockoutDuration: 15,
        },
        workflow: {
            incidentAutoAssign: false,
            incidentDefaultAssignee: '',
            incidentEscalation: 24,
            changeRequireApproval: true,
            changeApprover: 'manager',
            changeLeadTime: 3,
            allowSkipStatus: false,
            requireComment: true,
        },
        backup: {
            autoBackup: true,
            backupInterval: 'daily',
            backupRetention: 7,
        },
    },

    // 設定読み込み
    load() {
        const saved = localStorage.getItem('appsuiteSettings');
        return saved ? JSON.parse(saved) : this.defaults;
    },

    // 設定保存
    save(settings) {
        localStorage.setItem('appsuiteSettings', JSON.stringify(settings));
    },

    // タブ切り替え初期化
    initTabs() {
        document.querySelectorAll('.settings-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                // タブのアクティブ状態を切り替え
                document
                    .querySelectorAll('.settings-tab')
                    .forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                // パネルの表示を切り替え
                const tabName = tab.dataset.tab;
                document
                    .querySelectorAll('.settings-panel')
                    .forEach(p => p.classList.remove('active'));
                document.getElementById('panel-' + tabName).classList.add('active');
            });
        });
    },

    // フォームに設定を反映
    loadToForm() {
        const settings = this.load();

        // API設定
        document.getElementById('apiUrl').value = settings.api?.url || '';
        document.getElementById('apiKey').value = settings.api?.key || '';
        document.getElementById('authMethod').value = settings.api?.authMethod || 'bearer';
        document.getElementById('timeout').value = settings.api?.timeout || 30;
        document.getElementById('syncInterval').value = settings.api?.syncInterval || 30;

        // 基本設定
        document.getElementById('systemName').value =
            settings.general?.systemName || 'AppSuite 管理運用システム';
        document.getElementById('orgName').value = settings.general?.orgName || '';
        document.getElementById('adminEmail').value = settings.general?.adminEmail || '';
        document.getElementById('themeSelect').value = settings.general?.theme || 'light';
        document.getElementById('langSelect').value = settings.general?.language || 'ja';
        document.getElementById('dateFormat').value = settings.general?.dateFormat || 'yyyy-MM-dd';
        document.getElementById('pageSize').value = settings.general?.pageSize || 25;

        // 通知設定
        document.getElementById('notifyIncidentNew').checked =
            settings.notification?.incidentNew !== false;
        document.getElementById('notifyIncidentHigh').checked =
            settings.notification?.incidentHigh !== false;
        document.getElementById('notifyChangeApproval').checked =
            settings.notification?.changeApproval !== false;
        document.getElementById('notifyChangeComplete').checked =
            settings.notification?.changeComplete === true;
        document.getElementById('smtpHost').value = settings.notification?.smtpHost || '';
        document.getElementById('smtpPort').value = settings.notification?.smtpPort || 587;
        document.getElementById('smtpUser').value = settings.notification?.smtpUser || '';
        document.getElementById('smtpPass').value = settings.notification?.smtpPass || '';
        document.getElementById('smtpSsl').checked = settings.notification?.smtpSsl !== false;

        // セキュリティ設定
        document.getElementById('pwMinLength').value = settings.security?.pwMinLength || 8;
        document.getElementById('pwRequireUpper').checked =
            settings.security?.pwRequireUpper !== false;
        document.getElementById('pwRequireNumber').checked =
            settings.security?.pwRequireNumber !== false;
        document.getElementById('pwRequireSpecial').checked =
            settings.security?.pwRequireSpecial === true;
        document.getElementById('pwExpireDays').value = settings.security?.pwExpireDays || 90;
        document.getElementById('sessionTimeout').value = settings.security?.sessionTimeout || 30;
        document.getElementById('maxSessions').value = settings.security?.maxSessions || 3;
        document.getElementById('enableTwoFactor').checked =
            settings.security?.enableTwoFactor === true;
        document.getElementById('maxLoginAttempts').value =
            settings.security?.maxLoginAttempts || 5;
        document.getElementById('lockoutDuration').value = settings.security?.lockoutDuration || 15;

        // ワークフロー設定
        document.getElementById('incidentAutoAssign').checked =
            settings.workflow?.incidentAutoAssign === true;
        document.getElementById('incidentDefaultAssignee').value =
            settings.workflow?.incidentDefaultAssignee || '';
        document.getElementById('incidentEscalation').value =
            settings.workflow?.incidentEscalation || 24;
        document.getElementById('changeRequireApproval').checked =
            settings.workflow?.changeRequireApproval !== false;
        document.getElementById('changeApprover').value =
            settings.workflow?.changeApprover || 'manager';
        document.getElementById('changeLeadTime').value = settings.workflow?.changeLeadTime || 3;
        document.getElementById('allowSkipStatus').checked =
            settings.workflow?.allowSkipStatus === true;
        document.getElementById('requireComment').checked =
            settings.workflow?.requireComment !== false;

        // バックアップ設定（BackupManagerと連携）
        if (typeof BackupManager !== 'undefined') {
            BackupManager.updateAutoBackupUI();
        } else {
            document.getElementById('autoBackup').checked = settings.backup?.autoBackup !== false;
            document.getElementById('backupInterval').value =
                settings.backup?.backupInterval || 'daily';
            document.getElementById('backupRetention').value =
                settings.backup?.backupRetention || 7;
        }

        // バックアップ状態を更新
        this.updateBackupStatus();
    },

    // API設定保存
    saveApi() {
        const settings = this.load();
        settings.api = {
            url: document.getElementById('apiUrl').value,
            key: document.getElementById('apiKey').value,
            authMethod: document.getElementById('authMethod').value,
            timeout: parseInt(document.getElementById('timeout').value),
            syncInterval: parseInt(document.getElementById('syncInterval').value),
        };
        this.save(settings);
        showToast('API設定を保存しました', 'success');
        LogModule.addLog('update', 'システム設定', 'system', 'API設定を更新');
        if (window.ApiSync) {
            ApiSync.applySettings();
        }
    },

    // API接続テスト
    testApi() {
        const url = document.getElementById('apiUrl').value;
        if (!url) {
            showToast('APIのURLを入力してください', 'error');
            return;
        }

        showToast('接続テスト中...', 'info');
        // シミュレーション（実際の実装ではfetchを使用）
        setTimeout(() => {
            document.getElementById('apiStatus').textContent = '接続成功';
            document.getElementById('apiStatus').className = 'status-value badge badge-success';
            document.getElementById('lastSync').textContent = new Date().toLocaleString('ja-JP');
            document.getElementById('apiVersion').textContent = 'V7.5';
            showToast('API接続に成功しました', 'success');
        }, 1500);
    },

    syncNow() {
        if (window.ApiSync) {
            ApiSync.syncAll();
        }
    },

    // 基本設定保存
    saveGeneral() {
        const settings = this.load();
        settings.general = {
            systemName: document.getElementById('systemName').value,
            orgName: document.getElementById('orgName').value,
            adminEmail: document.getElementById('adminEmail').value,
            theme: document.getElementById('themeSelect').value,
            language: document.getElementById('langSelect').value,
            dateFormat: document.getElementById('dateFormat').value,
            pageSize: parseInt(document.getElementById('pageSize').value),
        };
        this.save(settings);

        // システム名を反映
        document.querySelector('.sidebar-header h1').innerHTML =
            '<i class="fas fa-cogs"></i> ' + settings.general.systemName.substring(0, 15);

        showToast('基本設定を保存しました', 'success');
        LogModule.addLog('update', 'システム設定', 'system', '基本設定を更新');
    },

    // 基本設定リセット
    resetGeneral() {
        if (confirm('基本設定を初期値にリセットしますか？')) {
            const settings = this.load();
            settings.general = this.defaults.general;
            this.save(settings);
            this.loadToForm();
            showToast('基本設定をリセットしました', 'success');
        }
    },

    // 通知設定保存
    saveNotification() {
        const settings = this.load();
        settings.notification = {
            incidentNew: document.getElementById('notifyIncidentNew').checked,
            incidentHigh: document.getElementById('notifyIncidentHigh').checked,
            changeApproval: document.getElementById('notifyChangeApproval').checked,
            changeComplete: document.getElementById('notifyChangeComplete').checked,
            smtpHost: document.getElementById('smtpHost').value,
            smtpPort: parseInt(document.getElementById('smtpPort').value),
            smtpUser: document.getElementById('smtpUser').value,
            smtpPass: document.getElementById('smtpPass').value,
            smtpSsl: document.getElementById('smtpSsl').checked,
        };
        this.save(settings);
        showToast('通知設定を保存しました', 'success');
        LogModule.addLog('update', 'システム設定', 'system', '通知設定を更新');
    },

    // テストメール送信
    testEmail() {
        const host = document.getElementById('smtpHost').value;
        if (!host) {
            showToast('SMTPホストを入力してください', 'error');
            return;
        }
        showToast('テストメールを送信中...', 'info');
        setTimeout(() => {
            showToast('テストメールを送信しました', 'success');
        }, 1500);
    },

    // セキュリティ設定保存
    saveSecurity() {
        const settings = this.load();
        settings.security = {
            pwMinLength: parseInt(document.getElementById('pwMinLength').value),
            pwRequireUpper: document.getElementById('pwRequireUpper').checked,
            pwRequireNumber: document.getElementById('pwRequireNumber').checked,
            pwRequireSpecial: document.getElementById('pwRequireSpecial').checked,
            pwExpireDays: parseInt(document.getElementById('pwExpireDays').value),
            sessionTimeout: parseInt(document.getElementById('sessionTimeout').value),
            maxSessions: parseInt(document.getElementById('maxSessions').value),
            enableTwoFactor: document.getElementById('enableTwoFactor').checked,
            maxLoginAttempts: parseInt(document.getElementById('maxLoginAttempts').value),
            lockoutDuration: parseInt(document.getElementById('lockoutDuration').value),
        };
        this.save(settings);
        showToast('セキュリティ設定を保存しました', 'success');
        LogModule.addLog('update', 'システム設定', 'system', 'セキュリティ設定を更新');
    },

    // ワークフロー設定保存
    saveWorkflow() {
        const settings = this.load();
        settings.workflow = {
            incidentAutoAssign: document.getElementById('incidentAutoAssign').checked,
            incidentDefaultAssignee: document.getElementById('incidentDefaultAssignee').value,
            incidentEscalation: parseInt(document.getElementById('incidentEscalation').value),
            changeRequireApproval: document.getElementById('changeRequireApproval').checked,
            changeApprover: document.getElementById('changeApprover').value,
            changeLeadTime: parseInt(document.getElementById('changeLeadTime').value),
            allowSkipStatus: document.getElementById('allowSkipStatus').checked,
            requireComment: document.getElementById('requireComment').checked,
        };
        this.save(settings);
        showToast('ワークフロー設定を保存しました', 'success');
        LogModule.addLog('update', 'システム設定', 'system', 'ワークフロー設定を更新');
    },

    // バックアップ作成
    createBackup() {
        const data = {
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            settings: this.load(),
            users: DataStore.users,
            apps: DataStore.apps,
            incidents: DataStore.incidents,
            changes: DataStore.changes,
            logs: DataStore.logs,
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'appsuite_backup_' + new Date().toISOString().split('T')[0] + '.json';
        a.click();

        // バックアップ履歴を保存
        const backups = JSON.parse(localStorage.getItem('backupHistory') || '[]');
        backups.unshift({
            date: new Date().toISOString(),
            size: blob.size,
        });
        localStorage.setItem('backupHistory', JSON.stringify(backups.slice(0, 10)));

        this.updateBackupStatus();
        showToast('バックアップを作成しました', 'success');
        LogModule.addLog('export', 'バックアップ', 'system', 'データバックアップを作成');
    },

    // バックアップ状態更新
    updateBackupStatus() {
        const backups = JSON.parse(localStorage.getItem('backupHistory') || '[]');
        document.getElementById('lastBackup').textContent =
            backups.length > 0 ? new Date(backups[0].date).toLocaleString('ja-JP') : '-';
        document.getElementById('backupCount').textContent = backups.length;

        // データサイズを計算
        const dataSize = new Blob([
            JSON.stringify({
                settings: this.load(),
                users: DataStore.users,
                apps: DataStore.apps,
                incidents: DataStore.incidents,
                changes: DataStore.changes,
                logs: DataStore.logs,
            }),
        ]).size;
        document.getElementById('dataSize').textContent = this.formatBytes(dataSize);

        // バックアップリスト表示
        const listEl = document.getElementById('backupList');
        if (backups.length > 0) {
            listEl.innerHTML = backups
                .slice(0, 5)
                .map(
                    b => `
                <div class="backup-item">
                    <span>${new Date(b.date).toLocaleString('ja-JP')}${b.type === 'auto' ? ' <small>(自動)</small>' : ''}</span>
                    <span>${this.formatBytes(b.size)}</span>
                </div>
            `
                )
                .join('');
        } else {
            listEl.innerHTML = '<p class="text-muted">バックアップはありません</p>';
        }

        // 自動バックアップ状態表示
        const autoBackupStatusEl = document.getElementById('autoBackupStatus');
        if (autoBackupStatusEl && typeof BackupManager !== 'undefined') {
            const stats = BackupManager.getStatistics();
            if (stats.autoBackupEnabled) {
                autoBackupStatusEl.innerHTML = '<span class="badge badge-success">有効</span>';
            } else {
                autoBackupStatusEl.innerHTML = '<span class="badge badge-secondary">無効</span>';
            }
        }
    },

    // バイト数フォーマット
    formatBytes(bytes) {
        if (bytes === 0) {
            return '0 Bytes';
        }
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    // リストア実行
    restoreBackup() {
        const fileInput = document.getElementById('restoreFile');
        const file = fileInput.files[0];

        if (!file) {
            showToast('バックアップファイルを選択してください', 'error');
            return;
        }

        if (!confirm('現在のデータは上書きされます。リストアを実行しますか？')) {
            return;
        }

        const reader = new FileReader();
        reader.onload = e => {
            try {
                const data = JSON.parse(e.target.result);

                // データの復元
                if (data.settings) {
                    this.save(data.settings);
                }
                if (data.users) {
                    DataStore.users = data.users;
                }
                if (data.apps) {
                    DataStore.apps = data.apps;
                }
                if (data.incidents) {
                    DataStore.incidents = data.incidents;
                }
                if (data.changes) {
                    DataStore.changes = data.changes;
                }
                if (data.logs) {
                    DataStore.logs = data.logs;
                }

                this.loadToForm();
                refreshAllModules();
                updateDashboard();

                showToast('データをリストアしました', 'success');
                LogModule.addLog('update', 'バックアップ', 'system', 'データリストアを実行');
            } catch (error) {
                showToast('バックアップファイルの読み込みに失敗しました', 'error');
            }
        };
        reader.readAsText(file);
    },

    // データエクスポート
    exportData() {
        const data = {
            exportDate: new Date().toISOString(),
            users: DataStore.users,
            apps: DataStore.apps,
            incidents: DataStore.incidents,
            changes: DataStore.changes,
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'appsuite_data_' + new Date().toISOString().split('T')[0] + '.json';
        a.click();

        showToast('データをエクスポートしました', 'success');
        LogModule.addLog('export', 'データ', 'system', 'データエクスポートを実行');
    },

    // データ初期化
    clearData() {
        if (!confirm('全てのデータを初期化しますか？この操作は取り消せません。')) {
            return;
        }
        if (!confirm('本当に初期化してよろしいですか？')) {
            return;
        }

        localStorage.removeItem('appsuiteSettings');
        localStorage.removeItem('backupHistory');
        DataStore.users = [];
        DataStore.apps = [];
        DataStore.incidents = [];
        DataStore.changes = [];
        DataStore.logs = [];

        this.loadToForm();
        refreshAllModules();
        updateDashboard();

        showToast('データを初期化しました', 'warning');
    },
};

// 変更管理モジュール
const ChangeModule = {
    refresh() {
        this.render(DataStore.changes);
    },

    render(changes) {
        const tbody = document.getElementById('changesTableBody');
        tbody.innerHTML = changes
            .map(
                chg => `
            <tr>
                <td>${escapeHtml(chg.id)}</td>
                <td>${escapeHtml(chg.title)}</td>
                <td>${escapeHtml(chg.appName)}</td>
                <td><span class="badge ${this.getTypeBadge(chg.type)}">${this.getTypeText(chg.type)}</span></td>
                <td><span class="badge ${this.getStatusBadge(chg.status)}">${this.getStatusText(chg.status)}</span></td>
                <td>${escapeHtml(chg.requester)}</td>
                <td>${escapeHtml(chg.scheduled)}</td>
                <td>
                    <button class="action-btn view" onclick="ChangeModule.view('${escapeHtml(chg.id)}')" title="詳細"><i class="fas fa-eye"></i></button>
                    <button class="action-btn edit" onclick="ChangeModule.edit('${escapeHtml(chg.id)}')" title="編集"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete" onclick="ChangeModule.delete('${escapeHtml(chg.id)}')" title="削除"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `
            )
            .join('');
    },

    getTypeBadge(type) {
        const badges = {
            feature: 'badge-success',
            improvement: 'badge-info',
            modification: 'badge-warning',
            bugfix: 'badge-danger',
        };
        return badges[type] || 'badge-secondary';
    },

    getTypeText(type) {
        const texts = {
            feature: '新機能',
            improvement: '改善',
            modification: '変更',
            bugfix: 'バグ修正',
        };
        return texts[type] || type;
    },

    getStatusBadge(status) {
        const badges = {
            draft: 'badge-secondary',
            pending: 'badge-warning',
            approved: 'badge-info',
            in_progress: 'badge-primary',
            completed: 'badge-success',
            rejected: 'badge-danger',
        };
        return badges[status] || 'badge-secondary';
    },

    getStatusText(status) {
        const texts = {
            draft: '下書き',
            pending: '申請中',
            approved: '承認済',
            in_progress: '実施中',
            completed: '完了',
            rejected: '却下',
        };
        return texts[status] || status;
    },

    showAddModal() {
        const appOptions = DataStore.apps
            .map(a => `<option value="${a.id}" data-name="${a.name}">${a.name}</option>`)
            .join('');

        openModal(
            '変更要求登録',
            `
            <div class="form-group">
                <label>タイトル</label>
                <input type="text" id="newChgTitle" required>
            </div>
            <div class="form-group">
                <label>対象アプリ</label>
                <select id="newChgApp">
                    ${appOptions}
                </select>
            </div>
            <div class="form-group">
                <label>変更種別</label>
                <select id="newChgType">
                    <option value="feature">新機能</option>
                    <option value="improvement">改善</option>
                    <option value="modification">変更</option>
                    <option value="bugfix">バグ修正</option>
                </select>
            </div>
            <div class="form-group">
                <label>実施予定日</label>
                <input type="date" id="newChgScheduled">
            </div>
            <div class="form-group">
                <label>説明</label>
                <textarea id="newChgDesc" rows="3" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;"></textarea>
            </div>
        `,
            [
                { text: 'キャンセル', class: 'btn-secondary', onclick: closeModal },
                { text: '登録', class: 'btn-primary', onclick: () => ChangeModule.add() },
            ]
        );
    },

    add() {
        const appSelect = document.getElementById('newChgApp');
        const selectedOption = appSelect.options[appSelect.selectedIndex];
        const newChg = {
            id: 'CHG' + String(DataStore.changes.length + 1).padStart(3, '0'),
            title: document.getElementById('newChgTitle').value,
            appId: appSelect.value,
            appName: selectedOption.dataset.name,
            type: document.getElementById('newChgType').value,
            status: 'draft',
            requester: document.getElementById('currentUser').textContent,
            scheduled: document.getElementById('newChgScheduled').value || '-',
            description: document.getElementById('newChgDesc').value,
        };
        DataStore.changes.push(newChg);
        this.refresh();
        closeModal();
        showToast('変更要求を登録しました', 'success');
        LogModule.addLog('create', '変更要求', 'change', '新規変更要求登録: ' + newChg.title);
        updateDashboard();
    },

    view(id) {
        const chg = DataStore.changes.find(c => c.id === id);
        openModal(
            '変更要求詳細: ' + chg.id,
            `
            <div style="line-height: 2;">
                <p><strong>変更ID:</strong> ${chg.id}</p>
                <p><strong>タイトル:</strong> ${chg.title}</p>
                <p><strong>対象アプリ:</strong> ${chg.appName}</p>
                <p><strong>変更種別:</strong> <span class="badge ${this.getTypeBadge(chg.type)}">${this.getTypeText(chg.type)}</span></p>
                <p><strong>ステータス:</strong> <span class="badge ${this.getStatusBadge(chg.status)}">${this.getStatusText(chg.status)}</span></p>
                <p><strong>依頼者:</strong> ${chg.requester}</p>
                <p><strong>実施予定日:</strong> ${chg.scheduled}</p>
                <p><strong>説明:</strong></p>
                <p style="background:#f8fafc;padding:10px;border-radius:8px;">${chg.description || '（なし）'}</p>
            </div>
        `,
            [{ text: '閉じる', class: 'btn-secondary', onclick: closeModal }]
        );
    },

    edit(id) {
        const chg = DataStore.changes.find(c => c.id === id);
        const appOptions = DataStore.apps
            .map(
                a =>
                    `<option value="${a.id}" data-name="${a.name}" ${a.id === chg.appId ? 'selected' : ''}>${a.name}</option>`
            )
            .join('');

        openModal(
            '変更要求編集: ' + chg.id,
            `
            <div class="form-group">
                <label>タイトル</label>
                <input type="text" id="editChgTitle" value="${escapeHtml(chg.title)}">
            </div>
            <div class="form-group">
                <label>対象アプリ</label>
                <select id="editChgApp">
                    ${appOptions}
                </select>
            </div>
            <div class="form-group">
                <label>変更種別</label>
                <select id="editChgType">
                    <option value="feature" ${chg.type === 'feature' ? 'selected' : ''}>新機能</option>
                    <option value="improvement" ${chg.type === 'improvement' ? 'selected' : ''}>改善</option>
                    <option value="modification" ${chg.type === 'modification' ? 'selected' : ''}>変更</option>
                    <option value="bugfix" ${chg.type === 'bugfix' ? 'selected' : ''}>バグ修正</option>
                </select>
            </div>
            <div class="form-group">
                <label>ステータス</label>
                <select id="editChgStatus">
                    <option value="draft" ${chg.status === 'draft' ? 'selected' : ''}>下書き</option>
                    <option value="pending" ${chg.status === 'pending' ? 'selected' : ''}>申請中</option>
                    <option value="approved" ${chg.status === 'approved' ? 'selected' : ''}>承認済</option>
                    <option value="in_progress" ${chg.status === 'in_progress' ? 'selected' : ''}>実施中</option>
                    <option value="completed" ${chg.status === 'completed' ? 'selected' : ''}>完了</option>
                    <option value="rejected" ${chg.status === 'rejected' ? 'selected' : ''}>却下</option>
                </select>
            </div>
            <div class="form-group">
                <label>実施予定日</label>
                <input type="date" id="editChgScheduled" value="${chg.scheduled !== '-' ? chg.scheduled : ''}">
            </div>
            <div class="form-group">
                <label>説明</label>
                <textarea id="editChgDesc" rows="3" style="width:100%;padding:10px;border:1px solid #e2e8f0;border-radius:8px;">${chg.description || ''}</textarea>
            </div>
        `,
            [
                { text: 'キャンセル', class: 'btn-secondary', onclick: closeModal },
                { text: '保存', class: 'btn-primary', onclick: () => ChangeModule.save(id) },
            ]
        );
    },

    save(id) {
        const chg = DataStore.changes.find(c => c.id === id);
        const appSelect = document.getElementById('editChgApp');
        const selectedOption = appSelect.options[appSelect.selectedIndex];
        const nextStatus = document.getElementById('editChgStatus').value;

        // ステータス遷移検証（WorkflowEngineが利用可能な場合）
        if (typeof WorkflowEngine !== 'undefined') {
            const result = WorkflowEngine.isValidChangeTransition(chg.status, nextStatus);
            if (!result.valid) {
                showToast(result.message, 'error');
                return;
            }
        }

        // 変更前の値を保存（通知用）
        const oldStatus = chg.status;

        // 値を更新
        chg.title = document.getElementById('editChgTitle').value;
        chg.appId = appSelect.value;
        chg.appName = selectedOption.dataset.name;
        chg.type = document.getElementById('editChgType').value;
        chg.status = nextStatus;
        chg.scheduled = document.getElementById('editChgScheduled').value || '-';
        chg.description = document.getElementById('editChgDesc').value;
        chg.updatedAt = new Date().toISOString();

        this.refresh();
        closeModal();
        showToast('変更要求を更新しました', 'success');
        LogModule.addLog('update', '変更要求', 'change', '変更要求更新: ' + chg.title);
        updateDashboard();

        // 通知トリガー
        if (typeof NotificationManager !== 'undefined' && oldStatus !== nextStatus) {
            // 承認待ちになった場合
            if (nextStatus === 'pending') {
                NotificationManager.notifyChangeApproval(chg);
            }
            // 承認または却下された場合
            if (nextStatus === 'approved' || nextStatus === 'rejected') {
                NotificationManager.notifyChangeDecision(chg, nextStatus);
            }
            // その他のステータス変更
            NotificationManager.notifyStatusChange(chg, 'change', nextStatus);
        }
    },

    delete(id) {
        const chg = DataStore.changes.find(c => c.id === id);
        if (confirm(`変更要求「${chg.title}」を削除しますか？`)) {
            const idx = DataStore.changes.findIndex(c => c.id === id);
            DataStore.changes.splice(idx, 1);
            this.refresh();
            showToast('変更要求を削除しました', 'success');
            LogModule.addLog('delete', '変更要求', 'change', '変更要求削除: ' + chg.title);
            updateDashboard();
        }
    },

    filter() {
        const search = document.getElementById('changeSearch').value.toLowerCase();
        const type = document.getElementById('changeTypeFilter').value;
        const status = document.getElementById('changeStatusFilter').value;

        let filtered = DataStore.changes;

        if (search) {
            filtered = filtered.filter(
                c =>
                    c.title.toLowerCase().includes(search) ||
                    (c.description || '').toLowerCase().includes(search)
            );
        }
        if (type) {
            filtered = filtered.filter(c => c.type === type);
        }
        if (status) {
            filtered = filtered.filter(c => c.status === status);
        }

        this.render(filtered);
    },
};

// Export modules to global scope for inline onclick handlers and testing
window.UserModule = UserModule;
window.AppModule = AppModule;
window.IncidentModule = IncidentModule;
window.ChangeModule = ChangeModule;
window.LogModule = LogModule;
window.SettingsModule = SettingsModule;
