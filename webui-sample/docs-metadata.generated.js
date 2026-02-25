(function (global) {
  "use strict";
  global.APPSUITE_DOCS_METADATA = {
  "generatedAt": "2026-02-25T08:52:41.909Z",
  "sources": [
    "docs/01_Requirements/詳細要件定義書(Requirements-Specification).md"
  ],
  "modules": {
    "users": {
      "title": "3.2 ユーザー管理機能",
      "fields": {
        "id": "ユーザーID（自動採番）",
        "username": "ユーザー名",
        "email": "メールアドレス",
        "department": "部署名",
        "role": "権限（管理者/ユーザー）",
        "status": "ステータス（有効/無効）",
        "lastLogin": "最終ログイン日時",
        "createdAt": "作成日時",
        "updatedAt": "更新日時"
      },
      "schema": {
        "id": {
          "type": "String",
          "required": true,
          "enumValues": null,
          "maxLength": null
        },
        "username": {
          "type": "String",
          "required": true,
          "enumValues": null,
          "maxLength": null
        },
        "email": {
          "type": "String",
          "required": true,
          "enumValues": null,
          "maxLength": null
        },
        "department": {
          "type": "String",
          "required": false,
          "enumValues": null,
          "maxLength": null
        },
        "role": {
          "type": "Enum",
          "required": true,
          "enumValues": [
            "管理者",
            "ユーザー"
          ],
          "maxLength": null
        },
        "status": {
          "type": "Enum",
          "required": true,
          "enumValues": [
            "有効",
            "無効"
          ],
          "maxLength": null
        },
        "lastLogin": {
          "type": "DateTime",
          "required": false,
          "enumValues": null,
          "maxLength": null
        },
        "createdAt": {
          "type": "DateTime",
          "required": true,
          "enumValues": null,
          "maxLength": null
        },
        "updatedAt": {
          "type": "DateTime",
          "required": true,
          "enumValues": null,
          "maxLength": null
        }
      }
    },
    "apps": {
      "title": "3.3 アプリ管理機能",
      "fields": {
        "id": "アプリID（自動採番）",
        "name": "アプリ名",
        "category": "カテゴリ（業務管理/申請・承認/データ管理/その他）",
        "creator": "作成者",
        "recordCount": "レコード数",
        "status": "ステータス（稼働中/メンテナンス/停止中）",
        "description": "説明",
        "createdAt": "作成日時",
        "updatedAt": "最終更新日時"
      },
      "schema": {
        "id": {
          "type": "String",
          "required": true,
          "enumValues": null,
          "maxLength": null
        },
        "name": {
          "type": "String",
          "required": true,
          "enumValues": null,
          "maxLength": null
        },
        "category": {
          "type": "Enum",
          "required": true,
          "enumValues": [
            "業務管理",
            "申請・承認",
            "データ管理",
            "その他"
          ],
          "maxLength": null
        },
        "creator": {
          "type": "String",
          "required": true,
          "enumValues": null,
          "maxLength": null
        },
        "recordCount": {
          "type": "Number",
          "required": false,
          "enumValues": null,
          "maxLength": null
        },
        "status": {
          "type": "Enum",
          "required": true,
          "enumValues": [
            "稼働中",
            "メンテナンス",
            "停止中"
          ],
          "maxLength": null
        },
        "description": {
          "type": "String",
          "required": false,
          "enumValues": null,
          "maxLength": null
        },
        "createdAt": {
          "type": "DateTime",
          "required": true,
          "enumValues": null,
          "maxLength": null
        },
        "updatedAt": {
          "type": "DateTime",
          "required": true,
          "enumValues": null,
          "maxLength": null
        }
      }
    },
    "incidents": {
      "title": "3.4 インシデント管理機能",
      "fields": {
        "id": "インシデントID（自動採番）",
        "title": "タイトル",
        "description": "詳細説明",
        "appId": "対象アプリID",
        "priority": "優先度（高/中/低）",
        "status": "ステータス（オープン/対応中/解決済み/クローズ）",
        "reporter": "報告者",
        "assignee": "担当者",
        "reportedAt": "報告日時",
        "resolvedAt": "解決日時"
      },
      "schema": {
        "id": {
          "type": "String",
          "required": true,
          "enumValues": null,
          "maxLength": null
        },
        "title": {
          "type": "String",
          "required": true,
          "enumValues": null,
          "maxLength": null
        },
        "description": {
          "type": "String",
          "required": true,
          "enumValues": null,
          "maxLength": null
        },
        "appId": {
          "type": "String",
          "required": true,
          "enumValues": null,
          "maxLength": null
        },
        "priority": {
          "type": "Enum",
          "required": true,
          "enumValues": [
            "高",
            "中",
            "低"
          ],
          "maxLength": null
        },
        "status": {
          "type": "Enum",
          "required": true,
          "enumValues": [
            "オープン",
            "対応中",
            "解決済み",
            "クローズ"
          ],
          "maxLength": null
        },
        "reporter": {
          "type": "String",
          "required": true,
          "enumValues": null,
          "maxLength": null
        },
        "assignee": {
          "type": "String",
          "required": false,
          "enumValues": null,
          "maxLength": null
        },
        "reportedAt": {
          "type": "DateTime",
          "required": true,
          "enumValues": null,
          "maxLength": null
        },
        "resolvedAt": {
          "type": "DateTime",
          "required": false,
          "enumValues": null,
          "maxLength": null
        }
      }
    },
    "changes": {
      "title": "3.5 変更管理機能",
      "fields": {
        "id": "変更要求ID（自動採番）",
        "title": "タイトル",
        "description": "詳細説明",
        "appId": "対象アプリID",
        "type": "タイプ（機能追加/機能変更/バグ修正/改善）",
        "status": "ステータス（下書き/承認待ち/承認済み/実装中/完了/却下）",
        "requester": "申請者",
        "approver": "承認者",
        "plannedDate": "予定実施日",
        "completedDate": "完了日"
      },
      "schema": {
        "id": {
          "type": "String",
          "required": true,
          "enumValues": null,
          "maxLength": null
        },
        "title": {
          "type": "String",
          "required": true,
          "enumValues": null,
          "maxLength": null
        },
        "description": {
          "type": "String",
          "required": true,
          "enumValues": null,
          "maxLength": null
        },
        "appId": {
          "type": "String",
          "required": true,
          "enumValues": null,
          "maxLength": null
        },
        "type": {
          "type": "Enum",
          "required": true,
          "enumValues": [
            "機能追加",
            "機能変更",
            "バグ修正",
            "改善"
          ],
          "maxLength": null
        },
        "status": {
          "type": "Enum",
          "required": true,
          "enumValues": [
            "下書き",
            "承認待ち",
            "承認済み",
            "実装中",
            "完了",
            "却下"
          ],
          "maxLength": null
        },
        "requester": {
          "type": "String",
          "required": true,
          "enumValues": null,
          "maxLength": null
        },
        "approver": {
          "type": "String",
          "required": false,
          "enumValues": null,
          "maxLength": null
        },
        "plannedDate": {
          "type": "Date",
          "required": false,
          "enumValues": null,
          "maxLength": null
        },
        "completedDate": {
          "type": "Date",
          "required": false,
          "enumValues": null,
          "maxLength": null
        }
      }
    },
    "logs": {
      "title": "3.6 監査ログ機能",
      "fields": {
        "id": "ログID（自動採番）",
        "timestamp": "操作日時",
        "userId": "操作ユーザーID",
        "username": "操作ユーザー名",
        "action": "操作タイプ（ログイン/ログアウト/作成/更新/削除/エクスポート）",
        "target": "対象（ユーザー/アプリ/レコード/システム）",
        "targetId": "対象ID",
        "details": "詳細情報",
        "ipAddress": "IPアドレス"
      },
      "schema": {
        "id": {
          "type": "String",
          "required": true,
          "enumValues": null,
          "maxLength": null
        },
        "timestamp": {
          "type": "DateTime",
          "required": true,
          "enumValues": null,
          "maxLength": null
        },
        "userId": {
          "type": "String",
          "required": true,
          "enumValues": null,
          "maxLength": null
        },
        "username": {
          "type": "String",
          "required": true,
          "enumValues": null,
          "maxLength": null
        },
        "action": {
          "type": "Enum",
          "required": true,
          "enumValues": [
            "ログイン",
            "ログアウト",
            "作成",
            "更新",
            "削除",
            "エクスポート"
          ],
          "maxLength": null
        },
        "target": {
          "type": "Enum",
          "required": true,
          "enumValues": [
            "ユーザー",
            "アプリ",
            "レコード",
            "システム"
          ],
          "maxLength": null
        },
        "targetId": {
          "type": "String",
          "required": false,
          "enumValues": null,
          "maxLength": null
        },
        "details": {
          "type": "String",
          "required": false,
          "enumValues": null,
          "maxLength": null
        },
        "ipAddress": {
          "type": "String",
          "required": true,
          "enumValues": null,
          "maxLength": null
        }
      }
    }
  },
  "settings": {
    "categories": {
      "api": {
        "title": "3.7.2.1 API接続設定",
        "fields": {
          "apiUrl": "DeskNet's Neo APIエンドポイントURL",
          "apiKey": "APIキー/トークン",
          "authMethod": "認証方式（Bearer Token/Basic認証/APIキー）",
          "timeout": "タイムアウト（秒）",
          "syncInterval": "自動同期間隔（分）"
        },
        "schema": {
          "apiUrl": {
            "type": "String",
            "required": false,
            "enumValues": null,
            "maxLength": null,
            "defaultValue": "-"
          },
          "apiKey": {
            "type": "String",
            "required": false,
            "enumValues": null,
            "maxLength": null,
            "defaultValue": "-"
          },
          "authMethod": {
            "type": "Enum",
            "required": false,
            "enumValues": [
              "Bearer Token",
              "Basic認証",
              "APIキー"
            ],
            "maxLength": null,
            "defaultValue": "bearer"
          },
          "timeout": {
            "type": "Number",
            "required": false,
            "enumValues": null,
            "maxLength": null,
            "defaultValue": "30"
          },
          "syncInterval": {
            "type": "Number",
            "required": false,
            "enumValues": null,
            "maxLength": null,
            "defaultValue": "15"
          }
        }
      },
      "basic": {
        "title": "3.7.2.2 基本設定",
        "fields": {
          "systemName": "システム名",
          "orgName": "組織名",
          "adminEmail": "管理者メールアドレス",
          "theme": "テーマ（ライト/ダーク/システム）",
          "language": "言語（日本語/English）",
          "dateFormat": "日付形式",
          "pageSize": "1ページあたりの表示件数"
        },
        "schema": {
          "systemName": {
            "type": "String",
            "required": false,
            "enumValues": null,
            "maxLength": null,
            "defaultValue": "AppSuite管理運用システム"
          },
          "orgName": {
            "type": "String",
            "required": false,
            "enumValues": null,
            "maxLength": null,
            "defaultValue": "-"
          },
          "adminEmail": {
            "type": "String",
            "required": false,
            "enumValues": null,
            "maxLength": null,
            "defaultValue": "-"
          },
          "theme": {
            "type": "Enum",
            "required": false,
            "enumValues": [
              "ライト",
              "ダーク",
              "システム"
            ],
            "maxLength": null,
            "defaultValue": "light"
          },
          "language": {
            "type": "Enum",
            "required": false,
            "enumValues": [
              "日本語",
              "English"
            ],
            "maxLength": null,
            "defaultValue": "ja"
          },
          "dateFormat": {
            "type": "String",
            "required": false,
            "enumValues": null,
            "maxLength": null,
            "defaultValue": "yyyy-MM-dd"
          },
          "pageSize": {
            "type": "Number",
            "required": false,
            "enumValues": null,
            "maxLength": null,
            "defaultValue": "25"
          }
        }
      },
      "notify": {
        "title": "3.7.2.3 通知設定",
        "fields": {
          "notifyIncidentNew": "新規インシデント登録時通知",
          "notifyIncidentHigh": "高優先度インシデント発生時通知",
          "notifyChangeApproval": "変更要求の承認依頼時通知",
          "notifyChangeComplete": "変更完了時通知",
          "smtpHost": "SMTPホスト",
          "smtpPort": "SMTPポート",
          "smtpUser": "SMTPユーザー名",
          "smtpPass": "SMTPパスワード",
          "smtpSsl": "SSL/TLS使用"
        },
        "schema": {
          "notifyIncidentNew": {
            "type": "Boolean",
            "required": false,
            "enumValues": null,
            "maxLength": null,
            "defaultValue": "true"
          },
          "notifyIncidentHigh": {
            "type": "Boolean",
            "required": false,
            "enumValues": null,
            "maxLength": null,
            "defaultValue": "true"
          },
          "notifyChangeApproval": {
            "type": "Boolean",
            "required": false,
            "enumValues": null,
            "maxLength": null,
            "defaultValue": "true"
          },
          "notifyChangeComplete": {
            "type": "Boolean",
            "required": false,
            "enumValues": null,
            "maxLength": null,
            "defaultValue": "false"
          },
          "smtpHost": {
            "type": "String",
            "required": false,
            "enumValues": null,
            "maxLength": null,
            "defaultValue": "-"
          },
          "smtpPort": {
            "type": "Number",
            "required": false,
            "enumValues": null,
            "maxLength": null,
            "defaultValue": "587"
          },
          "smtpUser": {
            "type": "String",
            "required": false,
            "enumValues": null,
            "maxLength": null,
            "defaultValue": "-"
          },
          "smtpPass": {
            "type": "String",
            "required": false,
            "enumValues": null,
            "maxLength": null,
            "defaultValue": "-"
          },
          "smtpSsl": {
            "type": "Boolean",
            "required": false,
            "enumValues": null,
            "maxLength": null,
            "defaultValue": "true"
          }
        }
      },
      "security": {
        "title": "3.7.2.4 セキュリティ設定",
        "fields": {
          "pwMinLength": "パスワード最小文字数",
          "pwRequireUpper": "大文字必須",
          "pwRequireNumber": "数字必須",
          "pwRequireSpecial": "特殊文字必須",
          "pwExpireDays": "パスワード有効期限（日）",
          "sessionTimeout": "セッションタイムアウト（分）",
          "maxSessions": "最大同時ログイン数",
          "enableTwoFactor": "二要素認証",
          "maxLoginAttempts": "ログイン失敗許容回数",
          "lockoutDuration": "アカウントロック時間（分）"
        },
        "schema": {
          "pwMinLength": {
            "type": "Number",
            "required": false,
            "enumValues": null,
            "maxLength": null,
            "defaultValue": "8"
          },
          "pwRequireUpper": {
            "type": "Boolean",
            "required": false,
            "enumValues": null,
            "maxLength": null,
            "defaultValue": "true"
          },
          "pwRequireNumber": {
            "type": "Boolean",
            "required": false,
            "enumValues": null,
            "maxLength": null,
            "defaultValue": "true"
          },
          "pwRequireSpecial": {
            "type": "Boolean",
            "required": false,
            "enumValues": null,
            "maxLength": null,
            "defaultValue": "false"
          },
          "pwExpireDays": {
            "type": "Number",
            "required": false,
            "enumValues": null,
            "maxLength": null,
            "defaultValue": "90"
          },
          "sessionTimeout": {
            "type": "Number",
            "required": false,
            "enumValues": null,
            "maxLength": null,
            "defaultValue": "30"
          },
          "maxSessions": {
            "type": "Number",
            "required": false,
            "enumValues": null,
            "maxLength": null,
            "defaultValue": "3"
          },
          "enableTwoFactor": {
            "type": "Boolean",
            "required": false,
            "enumValues": null,
            "maxLength": null,
            "defaultValue": "false"
          },
          "maxLoginAttempts": {
            "type": "Number",
            "required": false,
            "enumValues": null,
            "maxLength": null,
            "defaultValue": "5"
          },
          "lockoutDuration": {
            "type": "Number",
            "required": false,
            "enumValues": null,
            "maxLength": null,
            "defaultValue": "15"
          }
        }
      },
      "workflow": {
        "title": "3.7.2.5 ワークフロー設定",
        "fields": {
          "incidentAutoAssign": "インシデント自動割当",
          "incidentDefaultAssignee": "デフォルト担当者",
          "incidentEscalation": "エスカレーション期限（時間）",
          "changeRequireApproval": "変更要求承認必須",
          "changeApprover": "承認者",
          "changeLeadTime": "リードタイム（日）",
          "allowSkipStatus": "ステータススキップ許可",
          "requireComment": "ステータス変更時コメント必須"
        },
        "schema": {
          "incidentAutoAssign": {
            "type": "Boolean",
            "required": false,
            "enumValues": null,
            "maxLength": null,
            "defaultValue": "false"
          },
          "incidentDefaultAssignee": {
            "type": "String",
            "required": false,
            "enumValues": null,
            "maxLength": null,
            "defaultValue": "-"
          },
          "incidentEscalation": {
            "type": "Number",
            "required": false,
            "enumValues": null,
            "maxLength": null,
            "defaultValue": "24"
          },
          "changeRequireApproval": {
            "type": "Boolean",
            "required": false,
            "enumValues": null,
            "maxLength": null,
            "defaultValue": "true"
          },
          "changeApprover": {
            "type": "Enum",
            "required": false,
            "enumValues": null,
            "maxLength": null,
            "defaultValue": "manager"
          },
          "changeLeadTime": {
            "type": "Number",
            "required": false,
            "enumValues": null,
            "maxLength": null,
            "defaultValue": "3"
          },
          "allowSkipStatus": {
            "type": "Boolean",
            "required": false,
            "enumValues": null,
            "maxLength": null,
            "defaultValue": "false"
          },
          "requireComment": {
            "type": "Boolean",
            "required": false,
            "enumValues": null,
            "maxLength": null,
            "defaultValue": "true"
          }
        }
      },
      "backup": {
        "title": "3.7.2.6 バックアップ設定",
        "fields": {
          "autoBackup": "自動バックアップ有効",
          "backupInterval": "バックアップ間隔",
          "backupRetention": "保持世代数"
        },
        "schema": {
          "autoBackup": {
            "type": "Boolean",
            "required": false,
            "enumValues": null,
            "maxLength": null,
            "defaultValue": "true"
          },
          "backupInterval": {
            "type": "Enum",
            "required": false,
            "enumValues": null,
            "maxLength": null,
            "defaultValue": "daily"
          },
          "backupRetention": {
            "type": "Number",
            "required": false,
            "enumValues": null,
            "maxLength": null,
            "defaultValue": "7"
          }
        }
      }
    },
    "schema": {
      "apiUrl": {
        "type": "String",
        "required": false,
        "enumValues": null,
        "maxLength": null,
        "defaultValue": "-"
      },
      "apiKey": {
        "type": "String",
        "required": false,
        "enumValues": null,
        "maxLength": null,
        "defaultValue": "-"
      },
      "authMethod": {
        "type": "Enum",
        "required": false,
        "enumValues": [
          "Bearer Token",
          "Basic認証",
          "APIキー"
        ],
        "maxLength": null,
        "defaultValue": "bearer"
      },
      "timeout": {
        "type": "Number",
        "required": false,
        "enumValues": null,
        "maxLength": null,
        "defaultValue": "30"
      },
      "syncInterval": {
        "type": "Number",
        "required": false,
        "enumValues": null,
        "maxLength": null,
        "defaultValue": "15"
      },
      "systemName": {
        "type": "String",
        "required": false,
        "enumValues": null,
        "maxLength": null,
        "defaultValue": "AppSuite管理運用システム"
      },
      "orgName": {
        "type": "String",
        "required": false,
        "enumValues": null,
        "maxLength": null,
        "defaultValue": "-"
      },
      "adminEmail": {
        "type": "String",
        "required": false,
        "enumValues": null,
        "maxLength": null,
        "defaultValue": "-"
      },
      "theme": {
        "type": "Enum",
        "required": false,
        "enumValues": [
          "ライト",
          "ダーク",
          "システム"
        ],
        "maxLength": null,
        "defaultValue": "light"
      },
      "language": {
        "type": "Enum",
        "required": false,
        "enumValues": [
          "日本語",
          "English"
        ],
        "maxLength": null,
        "defaultValue": "ja"
      },
      "dateFormat": {
        "type": "String",
        "required": false,
        "enumValues": null,
        "maxLength": null,
        "defaultValue": "yyyy-MM-dd"
      },
      "pageSize": {
        "type": "Number",
        "required": false,
        "enumValues": null,
        "maxLength": null,
        "defaultValue": "25"
      },
      "notifyIncidentNew": {
        "type": "Boolean",
        "required": false,
        "enumValues": null,
        "maxLength": null,
        "defaultValue": "true"
      },
      "notifyIncidentHigh": {
        "type": "Boolean",
        "required": false,
        "enumValues": null,
        "maxLength": null,
        "defaultValue": "true"
      },
      "notifyChangeApproval": {
        "type": "Boolean",
        "required": false,
        "enumValues": null,
        "maxLength": null,
        "defaultValue": "true"
      },
      "notifyChangeComplete": {
        "type": "Boolean",
        "required": false,
        "enumValues": null,
        "maxLength": null,
        "defaultValue": "false"
      },
      "smtpHost": {
        "type": "String",
        "required": false,
        "enumValues": null,
        "maxLength": null,
        "defaultValue": "-"
      },
      "smtpPort": {
        "type": "Number",
        "required": false,
        "enumValues": null,
        "maxLength": null,
        "defaultValue": "587"
      },
      "smtpUser": {
        "type": "String",
        "required": false,
        "enumValues": null,
        "maxLength": null,
        "defaultValue": "-"
      },
      "smtpPass": {
        "type": "String",
        "required": false,
        "enumValues": null,
        "maxLength": null,
        "defaultValue": "-"
      },
      "smtpSsl": {
        "type": "Boolean",
        "required": false,
        "enumValues": null,
        "maxLength": null,
        "defaultValue": "true"
      },
      "pwMinLength": {
        "type": "Number",
        "required": false,
        "enumValues": null,
        "maxLength": null,
        "defaultValue": "8"
      },
      "pwRequireUpper": {
        "type": "Boolean",
        "required": false,
        "enumValues": null,
        "maxLength": null,
        "defaultValue": "true"
      },
      "pwRequireNumber": {
        "type": "Boolean",
        "required": false,
        "enumValues": null,
        "maxLength": null,
        "defaultValue": "true"
      },
      "pwRequireSpecial": {
        "type": "Boolean",
        "required": false,
        "enumValues": null,
        "maxLength": null,
        "defaultValue": "false"
      },
      "pwExpireDays": {
        "type": "Number",
        "required": false,
        "enumValues": null,
        "maxLength": null,
        "defaultValue": "90"
      },
      "sessionTimeout": {
        "type": "Number",
        "required": false,
        "enumValues": null,
        "maxLength": null,
        "defaultValue": "30"
      },
      "maxSessions": {
        "type": "Number",
        "required": false,
        "enumValues": null,
        "maxLength": null,
        "defaultValue": "3"
      },
      "enableTwoFactor": {
        "type": "Boolean",
        "required": false,
        "enumValues": null,
        "maxLength": null,
        "defaultValue": "false"
      },
      "maxLoginAttempts": {
        "type": "Number",
        "required": false,
        "enumValues": null,
        "maxLength": null,
        "defaultValue": "5"
      },
      "lockoutDuration": {
        "type": "Number",
        "required": false,
        "enumValues": null,
        "maxLength": null,
        "defaultValue": "15"
      },
      "incidentAutoAssign": {
        "type": "Boolean",
        "required": false,
        "enumValues": null,
        "maxLength": null,
        "defaultValue": "false"
      },
      "incidentDefaultAssignee": {
        "type": "String",
        "required": false,
        "enumValues": null,
        "maxLength": null,
        "defaultValue": "-"
      },
      "incidentEscalation": {
        "type": "Number",
        "required": false,
        "enumValues": null,
        "maxLength": null,
        "defaultValue": "24"
      },
      "changeRequireApproval": {
        "type": "Boolean",
        "required": false,
        "enumValues": null,
        "maxLength": null,
        "defaultValue": "true"
      },
      "changeApprover": {
        "type": "Enum",
        "required": false,
        "enumValues": null,
        "maxLength": null,
        "defaultValue": "manager"
      },
      "changeLeadTime": {
        "type": "Number",
        "required": false,
        "enumValues": null,
        "maxLength": null,
        "defaultValue": "3"
      },
      "allowSkipStatus": {
        "type": "Boolean",
        "required": false,
        "enumValues": null,
        "maxLength": null,
        "defaultValue": "false"
      },
      "requireComment": {
        "type": "Boolean",
        "required": false,
        "enumValues": null,
        "maxLength": null,
        "defaultValue": "true"
      },
      "autoBackup": {
        "type": "Boolean",
        "required": false,
        "enumValues": null,
        "maxLength": null,
        "defaultValue": "true"
      },
      "backupInterval": {
        "type": "Enum",
        "required": false,
        "enumValues": null,
        "maxLength": null,
        "defaultValue": "daily"
      },
      "backupRetention": {
        "type": "Number",
        "required": false,
        "enumValues": null,
        "maxLength": null,
        "defaultValue": "7"
      }
    }
  }
};
})(typeof window !== "undefined" ? window : globalThis);
