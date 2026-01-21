#!/bin/bash
# ========================================
# UserPromptSubmit Hook - コンフリクト防止
# ========================================
# ユーザープロンプト送信時に実行されるフック
# - 編集中ファイルのロックチェック
# - コンフリクト防止

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

LOCK_DIR=".claude/locks"
mkdir -p "$LOCK_DIR"

# コンフリクトチェック（必要に応じて実装）
# 現在のセッションIDを取得（環境変数から）
SESSION_ID="${CLAUDE_SESSION_ID:-$(uuidgen 2>/dev/null || echo "session-$$")}"

# ロックファイル作成（このセッションが作業中であることを示す）
echo "$SESSION_ID" > "$LOCK_DIR/session-${SESSION_ID}.lock"

# 正常終了（何もメッセージを出力しない場合は静かに終了）
exit 0
