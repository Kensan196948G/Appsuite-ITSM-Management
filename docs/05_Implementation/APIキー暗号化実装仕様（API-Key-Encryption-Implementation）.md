# APIキー暗号化実装仕様（API Key Encryption Implementation）
**プロジェクト**: Appsuite専用運用管理システム  
**作成日**: 2026-02-25  

## 1. 概要
DeskNet's Neo APIキーをブラウザのIndexedDBにAES-256-GCM暗号化して安全に保存する。

## 2. 暗号化アルゴリズム
- **方式**: AES-256-GCM（Web Crypto API使用）
- **鍵導出**: PBKDF2（ユーザーパスワード + ランダムソルトから導出）
- **IV（初期化ベクトル）**: 96ビットランダム値（暗号化毎に生成）

## 3. 実装詳細

### 3.1 鍵生成
```javascript
async function deriveKey(password, salt) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}
```

### 3.2 暗号化フロー
1. ユーザーがAPIキーを設定画面で入力
2. ランダムソルト（128bit）とIV（96bit）を生成
3. セッションパスワードからAES-256-GCM鍵を導出
4. APIキーを暗号化
5. `{salt, iv, ciphertext}` をIndexedDBに保存

### 3.3 復号フロー
1. セッション確認
2. IndexedDBから `{salt, iv, ciphertext}` を取得
3. セッションパスワードで鍵を再導出
4. 復号してAPIキーを取得
5. メモリ上でのみ使用（再保存しない）

## 4. セキュリティ考慮事項
- ソルトはユーザーごとに固有
- IVは暗号化ごとに新規生成
- 復号されたAPIキーはメモリ上でのみ使用
- セッション終了時にメモリから削除
