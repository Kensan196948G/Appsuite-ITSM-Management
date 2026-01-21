#!/bin/bash
# ========================================
# ToolCall Hook - ファイル操作監視
# ========================================
# ツール呼び出し時に実行されるフック
# - 重要ファイルの変更を監視
# - バックアップ作成

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

# 引数から情報を取得（ClaudeCodeから渡される）
TOOL_NAME="${1:-unknown}"
FILE_PATH="${2:-}"

# 重要ファイルのバックアップ（Write/Editツールの場合）
if [[ "$TOOL_NAME" == "Write" ]] || [[ "$TOOL_NAME" == "Edit" ]]; then
    if [ -n "$FILE_PATH" ] && [ -f "$FILE_PATH" ]; then
        BACKUP_DIR=".claude/backups/$(date +%Y%m%d)"
        mkdir -p "$BACKUP_DIR"

        # ファイル名からディレクトリ構造を保持したバックアップ
        BACKUP_PATH="$BACKUP_DIR/$(echo "$FILE_PATH" | sed 's/\//_/g')"
        cp "$FILE_PATH" "${BACKUP_PATH}.$(date +%H%M%S)" 2>/dev/null
    fi
fi

exit 0
