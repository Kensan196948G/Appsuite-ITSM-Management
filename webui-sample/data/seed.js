(function(g){ g.APPSUITE_DATA_SEED = {
  "connection": {
    "connected": false,
    "status": "未接続",
    "lastSync": "-",
    "version": "-"
  },
  "users": [
    {
      "id": "U0001",
      "username": "admin",
      "email": "admin@example.local",
      "department": "IT部",
      "role": "管理者",
      "status": "有効",
      "lastLogin": "2026-02-24 08:42",
      "createdAt": "2026-01-20",
      "updatedAt": "2026-02-24"
    },
    {
      "id": "U0002",
      "username": "sato",
      "email": "sato@sales.local",
      "department": "営業部",
      "role": "ユーザー",
      "status": "有効",
      "lastLogin": "2026-02-23 17:10",
      "createdAt": "2026-01-22",
      "updatedAt": "2026-02-12"
    },
    {
      "id": "U0003",
      "username": "tanaka",
      "email": "tanaka@general.local",
      "department": "総務部",
      "role": "ユーザー",
      "status": "無効",
      "lastLogin": "2026-02-10 09:31",
      "createdAt": "2026-01-25",
      "updatedAt": "2026-02-10"
    },
    {
      "id": "U0004",
      "username": "kobayashi",
      "email": "kobayashi@ops.local",
      "department": "情報システム",
      "role": "管理者",
      "status": "有効",
      "lastLogin": "2026-02-24 08:55",
      "createdAt": "2026-01-27",
      "updatedAt": "2026-02-21"
    }
  ],
  "apps": [
    {
      "id": "A0001",
      "name": "勤怠管理",
      "category": "業務管理",
      "creator": "admin",
      "recordCount": 1520,
      "status": "稼働中",
      "description": "出退勤・休暇管理",
      "createdAt": "2026-01-20",
      "updatedAt": "2026-02-24"
    },
    {
      "id": "A0002",
      "name": "経費申請",
      "category": "申請・承認",
      "creator": "sato",
      "recordCount": 648,
      "status": "稼働中",
      "description": "経費精算ワークフロー",
      "createdAt": "2026-01-22",
      "updatedAt": "2026-02-22"
    },
    {
      "id": "A0003",
      "name": "顧客管理",
      "category": "データ管理",
      "creator": "admin",
      "recordCount": 4200,
      "status": "メンテナンス",
      "description": "取引先・担当者マスタ",
      "createdAt": "2026-01-24",
      "updatedAt": "2026-02-19"
    },
    {
      "id": "A0004",
      "name": "契約管理",
      "category": "業務管理",
      "creator": "kobayashi",
      "recordCount": 781,
      "status": "稼働中",
      "description": "契約台帳と期限通知",
      "createdAt": "2026-02-03",
      "updatedAt": "2026-02-23"
    }
  ],
  "incidents": [
    {
      "id": "INC-001",
      "title": "ログイン不可",
      "description": "Chromeで403",
      "appId": "A0001",
      "priority": "高",
      "status": "対応中",
      "reporter": "sato",
      "assignee": "admin",
      "reportedAt": "2026-02-24 08:12",
      "resolvedAt": ""
    },
    {
      "id": "INC-002",
      "title": "表示崩れ",
      "description": "モバイル幅で崩れる",
      "appId": "A0002",
      "priority": "中",
      "status": "オープン",
      "reporter": "yamada",
      "assignee": "kobayashi",
      "reportedAt": "2026-02-23 13:22",
      "resolvedAt": ""
    },
    {
      "id": "INC-003",
      "title": "CSV文字化け",
      "description": "エクスポート文字化け",
      "appId": "A0003",
      "priority": "低",
      "status": "解決済み",
      "reporter": "tanaka",
      "assignee": "admin",
      "reportedAt": "2026-02-20 16:05",
      "resolvedAt": "2026-02-21 10:40"
    }
  ],
  "changes": [
    {
      "id": "CHG-001",
      "title": "監査ログCSV列追加",
      "description": "IP/対象ID列追加",
      "appId": "A0001",
      "type": "改善",
      "status": "承認待ち",
      "requester": "kobayashi",
      "approver": "manager",
      "plannedDate": "2026-02-27",
      "completedDate": ""
    },
    {
      "id": "CHG-002",
      "title": "ログイン画面文言修正",
      "description": "FAQに合わせて更新",
      "appId": "A0002",
      "type": "機能変更",
      "status": "実装中",
      "requester": "admin",
      "approver": "manager",
      "plannedDate": "2026-02-25",
      "completedDate": ""
    },
    {
      "id": "CHG-003",
      "title": "バグ修正#123",
      "description": "検索リセット不具合",
      "appId": "A0003",
      "type": "バグ修正",
      "status": "完了",
      "requester": "sato",
      "approver": "manager",
      "plannedDate": "2026-02-14",
      "completedDate": "2026-02-15"
    }
  ],
  "logs": [
    {
      "id": "LOG-001",
      "timestamp": "2026-02-24 08:55:12",
      "userId": "U0004",
      "username": "kobayashi",
      "action": "ログイン",
      "target": "システム",
      "targetId": "-",
      "details": "ログイン成功",
      "ipAddress": "192.168.0.15"
    },
    {
      "id": "LOG-002",
      "timestamp": "2026-02-24 08:42:21",
      "userId": "U0001",
      "username": "admin",
      "action": "更新",
      "target": "設定",
      "targetId": "CFG-SEC",
      "details": "セッション30分",
      "ipAddress": "192.168.0.10"
    },
    {
      "id": "LOG-003",
      "timestamp": "2026-02-24 08:20:05",
      "userId": "U0001",
      "username": "admin",
      "action": "作成",
      "target": "インシデント",
      "targetId": "INC-001",
      "details": "高優先度登録",
      "ipAddress": "192.168.0.10"
    },
    {
      "id": "LOG-004",
      "timestamp": "2026-02-23 17:15:31",
      "userId": "U0002",
      "username": "sato",
      "action": "エクスポート",
      "target": "監査ログ",
      "targetId": "-",
      "details": "CSV出力",
      "ipAddress": "192.168.0.21"
    }
  ],
  "backups": [
    {
      "id": "BK-2026-02-24-030000",
      "time": "2026-02-24 03:00",
      "type": "daily",
      "size": "1.8MB",
      "status": "成功"
    },
    {
      "id": "BK-2026-02-23-030000",
      "time": "2026-02-23 03:00",
      "type": "daily",
      "size": "1.8MB",
      "status": "成功"
    }
  ],
  "ops": {
    "daily": [
      {
        "text": "API接続状態確認",
        "done": true
      },
      {
        "text": "未解決インシデント確認",
        "done": false
      },
      {
        "text": "本日の操作ログレビュー",
        "done": false
      }
    ],
    "weekly": [
      {
        "text": "監査ログレビュー",
        "done": false
      },
      {
        "text": "インシデント傾向分析",
        "done": false
      },
      {
        "text": "バックアップ検証",
        "done": false
      }
    ],
    "monthly": [
      {
        "text": "権限棚卸し",
        "done": true
      },
      {
        "text": "完全バックアップ取得",
        "done": false
      }
    ]
  },
  "settings": {
    "apiUrl": "https://neo.example.local/api",
    "authMethod": "bearer",
    "apiKey": "sample-token-2026",
    "timeout": 30,
    "syncInterval": 15,
    "systemName": "AppSuite管理運用システム",
    "orgName": "サンプル株式会社",
    "adminEmail": "admin@example.local",
    "language": "ja",
    "dateFormat": "yyyy-MM-dd",
    "pageSize": 25,
    "notifyIncidentNew": true,
    "notifyIncidentHigh": true,
    "notifyChangeApproval": true,
    "notifyChangeComplete": false,
    "smtpHost": "smtp.example.local",
    "smtpPort": 587,
    "smtpUser": "notify-bot",
    "smtpPass": "password",
    "smtpSsl": true,
    "pwMinLength": 8,
    "pwExpireDays": 90,
    "sessionTimeout": 30,
    "maxSessions": 3,
    "maxLoginAttempts": 5,
    "lockoutDuration": 15,
    "pwRequireUpper": true,
    "pwRequireNumber": true,
    "pwRequireSpecial": false,
    "enableTwoFactor": false,
    "incidentAutoAssign": false,
    "incidentDefaultAssignee": "admin",
    "incidentEscalation": 24,
    "changeRequireApproval": true,
    "changeApprover": "manager",
    "changeLeadTime": 3,
    "allowSkipStatus": false,
    "requireComment": true,
    "autoBackup": true,
    "backupInterval": "daily",
    "backupRetention": 7,
    "backupSignatureMode": "sha256",
    "backupHmacSecret": "",
    "rolePermissions": {
      "管理者": {
        "usersRead": true,
        "usersWrite": true,
        "appsRead": true,
        "appsWrite": true,
        "incidentsRead": true,
        "incidentsWrite": true,
        "changesRead": true,
        "changesWrite": true,
        "changesApprove": true,
        "logsRead": true,
        "logsExport": true,
        "logsMetaView": true,
        "settingsRead": true,
        "settingsWrite": true,
        "backupRun": true,
        "backupExport": true,
        "backupImport": true
      },
      "ユーザー": {
        "usersRead": true,
        "usersWrite": false,
        "appsRead": true,
        "appsWrite": false,
        "incidentsRead": true,
        "incidentsWrite": true,
        "changesRead": true,
        "changesWrite": true,
        "changesApprove": false,
        "logsRead": true,
        "logsExport": false,
        "logsMetaView": false,
        "settingsRead": false,
        "settingsWrite": false,
        "backupRun": false,
        "backupExport": false,
        "backupImport": false
      }
    },
    "rowLevelRules": {
      "userSelfEditOnlyForUser": true,
      "incidentOwnOrAssignedOnlyForUser": true,
      "changeRequesterOnlyForUser": true
    },
    "customRoles": [],
    "docsEditor": {
      "owner": "IT運用管理",
      "reviewCycleDays": 30,
      "note": "docs 更新候補を管理者がレビューして反映します。",
      "actionCandidates": [
        {
          "id": "DOC-ACT-001",
          "title": "画面設計書の列定義差分を確認",
          "owner": "admin",
          "status": "候補",
          "note": "ユーザー/アプリ/監査ログ列を優先確認"
        },
        {
          "id": "DOC-ACT-002",
          "title": "運用マニュアルのバックアップ手順更新",
          "owner": "kobayashi",
          "status": "レビュー待ち",
          "note": "署名方式(HMAC)の説明追記"
        }
      ]
    }
  },
  "session": {
    "userId": "U0001",
    "role": "管理者"
  },
  "ui": {
    "activeSection": "dashboard",
    "activeSettingsTab": "api",
    "selectedLogId": null,
    "filters": {
      "userSearch": "",
      "userStatus": "all",
      "userRole": "all",
      "appSearch": "",
      "appCategory": "all",
      "appStatus": "all",
      "incidentSearch": "",
      "incidentStatus": "all",
      "incidentPriority": "all",
      "changeSearch": "",
      "changeType": "all",
      "changeStatus": "all",
      "logFrom": "",
      "logTo": "",
      "logAction": "all",
      "logTarget": "all",
      "logMeta": "all"
    }
  }
}; })(typeof window !== 'undefined' ? window : globalThis);
