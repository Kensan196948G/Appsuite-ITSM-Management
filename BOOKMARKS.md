# AppSuite ITSM Management - ブックマーク設定ガイド

## 環境別アクセスURL

### 【開発】開発環境

#### ローカルアクセス
- **URL**: http://localhost:3100
- **プロトコル**: HTTP
- **用途**: ローカル開発・デバッグ
- **ブックマーク名**: 【開発】AppSuite ITSM - Local
- **ポート**: 3100（本プロジェクト専用、変更不可）

#### LAN内アクセス
- **URL**: http://192.168.0.145:3100
- **プロトコル**: HTTP
- **用途**: 同一ネットワーク内からのアクセス
- **ブックマーク名**: 【開発】AppSuite ITSM - LAN

---

### 【本番】本番環境

#### ローカルアクセス
- **URL**: https://localhost:8443
- **プロトコル**: HTTPS (自己署名証明書)
- **用途**: 本番環境のローカルテスト
- **ブックマーク名**: 【本番】AppSuite ITSM - Local
- **注意**: 初回アクセス時に証明書の警告が表示されます

#### LAN内アクセス
- **URL**: https://192.168.0.145:8443
- **プロトコル**: HTTPS (自己署名証明書)
- **用途**: 同一ネットワーク内からの本番アクセス
- **ブックマーク名**: 【本番】AppSuite ITSM - LAN
- **注意**: 初回アクセス時に証明書の警告が表示されます

---

## ブラウザ別ブックマーク設定

### Google Chrome / Microsoft Edge

1. ブックマークマネージャーを開く (Ctrl+Shift+O)
2. 「AppSuite ITSM」フォルダを作成
3. 以下のブックマークを追加:

```
📁 AppSuite ITSM
  ├─ 【開発】AppSuite ITSM - Local
  │   http://localhost:3000
  ├─ 【開発】AppSuite ITSM - LAN
  │   http://192.168.0.145:3000
  ├─ 【本番】AppSuite ITSM - Local
  │   https://localhost:8443
  └─ 【本番】AppSuite ITSM - LAN
      https://192.168.0.145:8443
```

### Firefox

1. ブックマークメニューを開く (Ctrl+Shift+B)
2. 「AppSuite ITSM」フォルダを作成
3. 上記と同様にブックマークを追加

---

## 環境の特徴

### 開発環境の特徴
- ✅ サンプルデータが表示される
- ✅ デバッグモード有効
- ✅ CORSが有効
- ✅ キャッシュ無効
- ✅ ホットリロード対応
- ⚠️ HTTPプロトコル（暗号化なし）

### 本番環境の特徴
- ✅ 本番データのみ表示（ダミーデータなし）
- ✅ HTTPSプロトコル（暗号化）
- ✅ キャッシュ有効（パフォーマンス最適化）
- ✅ 圧縮有効
- ❌ デバッグ機能無効
- ❌ CORS制限あり

---

## ポート番号の固定

### 開発環境
- **ポート番号**: 3000
- **変更禁止**: 開発途中での変更不可

### 本番環境
- **ポート番号**: 8443
- **変更禁止**: 開発途中での変更不可

---

## 自己署名SSL証明書について

### 警告メッセージの対処法

#### Chrome / Edge
1. 「詳細設定」をクリック
2. 「localhost にアクセスする（安全ではありません）」をクリック

#### Firefox
1. 「詳細設定」をクリック
2. 「例外を追加」をクリック
3. 「セキュリティ例外を承認」をクリック

### 証明書の更新
証明書は365日間有効です。期限切れの場合:
```bash
npm run ssl:generate
```

---

## アクセステスト

### 開発環境テスト
```bash
# Linux
curl -I http://localhost:3000

# Windows (PowerShell)
Invoke-WebRequest -Uri http://localhost:3000 -Method Head
```

### 本番環境テスト
```bash
# Linux
curl -I -k https://localhost:8443

# Windows (PowerShell)
Invoke-WebRequest -Uri https://localhost:8443 -Method Head -SkipCertificateCheck
```

---

## トラブルシューティング

### ポートが既に使用されている
```bash
# Linux: ポート使用状況確認
sudo lsof -i :3000
sudo lsof -i :8443

# Windows: ポート使用状況確認
netstat -ano | findstr :3000
netstat -ano | findstr :8443
```

### サービスが起動しない
```bash
# Linux: ログ確認
journalctl -u appsuite-itsm-dev -f
journalctl -u appsuite-itsm-prod -f

# Windows: タスクスケジューラで確認
Get-ScheduledTask -TaskName "AppSuite-ITSM-*"
```

### ブラウザからアクセスできない
1. ファイアウォール設定を確認
2. サービスが起動しているか確認
3. IPアドレスが正しいか確認

---

## ファイアウォール設定

### Linux (ufw)
```bash
# 開発環境ポート開放
sudo ufw allow 3000/tcp

# 本番環境ポート開放
sudo ufw allow 8443/tcp
```

### Windows Defender
1. コントロールパネル > システムとセキュリティ > Windows Defender ファイアウォール
2. 「詳細設定」をクリック
3. 「受信の規則」で新しいポート規則を追加（3000, 8443）

---

## 推奨ブラウザ

- ✅ Google Chrome 90+
- ✅ Microsoft Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
