/* AppSuite Ops Sample UI (no backend) */
(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const pageTitle = $("#pageTitle");
  const pageSubtitle = $("#pageSubtitle");
  const view = $("#view");
  const toast = $("#toast");

  const sidebar = $(".sidebar");
  const sidebarToggle = $("#sidebarToggle");
  const toggleThemeBtn = $("#toggleThemeBtn");
  const simulateBtn = $("#simulateBtn");
  const menuSearch = $("#menuSearch");

  // ---------- Sample data ----------
  const state = {
    kpi: {
      appsTotal: 24,
      appsCritical: 6,
      changesMonth: 128,     // update
      deletesPending: 3,     // pending delete requests
      integrationAlerts: 1,  // sync errors/warns
    },
    apps: [
      { name: "PC資産台帳", owner: "システムG", critical: "高", status: "稼働", last: "2026-01-12", users: 84 },
      { name: "契約台帳", owner: "総務部", critical: "高", status: "稼働", last: "2026-01-10", users: 23 },
      { name: "案件進捗台帳", owner: "工事部", critical: "中", status: "稼働", last: "2026-01-11", users: 102 },
      { name: "備品貸出", owner: "総務部", critical: "中", status: "稼働", last: "2026-01-05", users: 55 },
      { name: "出張精算補助", owner: "経理部", critical: "高", status: "休止", last: "2025-12-20", users: 18 },
      { name: "教育受講管理", owner: "管理本部", critical: "低", status: "稼働", last: "2026-01-06", users: 210 },
    ],
    users: [
      { name: "加藤", dept: "システムG", role: "ITIL管理者", risk: "低", lastLogin: "2026-01-14" },
      { name: "山田", dept: "総務部", role: "サービスオーナー", risk: "中", lastLogin: "2026-01-13" },
      { name: "佐藤", dept: "工事部", role: "一般利用者", risk: "低", lastLogin: "2026-01-12" },
      { name: "鈴木", dept: "経理部", role: "一般利用者", risk: "低", lastLogin: "2026-01-10" },
      { name: "伊藤", dept: "システムG", role: "オペレーター", risk: "低", lastLogin: "2026-01-14" },
      { name: "田中", dept: "工事部", role: "一般利用者", risk: "高", lastLogin: "2025-11-02" }, // stale
    ],
    deletions: [
      { id: "DEL-0012", app: "PC資産台帳", requester: "山田", reason: "誤登録（重複）", count: 2, status: "承認待ち" },
      { id: "DEL-0013", app: "契約台帳", requester: "佐藤", reason: "テストデータ削除", count: 15, status: "要確認" },
      { id: "DEL-0014", app: "案件進捗台帳", requester: "鈴木", reason: "重複取り込み", count: 7, status: "承認待ち" },
    ],
    integrations: [
      { name: "会計システム → 契約台帳", mode: "夜間同期", last: "2026-01-14 02:10", status: "OK" },
      { name: "人事マスタ（NEO）→ 部署マスタ", mode: "毎時", last: "2026-01-14 14:00", status: "OK" },
      { name: "AppSuite → BI(集計)", mode: "日次", last: "2026-01-13 03:20", status: "WARN" },
    ],
    incidents: [
      { id: "INC-0201", type: "誤更新", app: "契約台帳", impact: "中", when: "2026-01-09", owner: "システムG", status: "再発防止中" },
      { id: "INC-0202", type: "同期遅延", app: "BI(集計)", impact: "低", when: "2026-01-13", owner: "システムG", status: "監視強化" },
    ],
    audits: [
      { name: "権限見直し（四半期）", due: "2026-01-31", status: "進行中" },
      { name: "未使用アプリ棚卸", due: "2026-02-10", status: "未着手" },
      { name: "重要台帳バックアップ点検", due: "2026-01-20", status: "進行中" },
    ],
    changes: [
      { id: "CHG-0056", app: "PC資産台帳", type: "項目追加", requester: "加藤", status: "承認済", due: "2026-01-20" },
      { id: "CHG-0057", app: "契約台帳", type: "API連携", requester: "山田", status: "計画中", due: "2026-02-01" },
    ],
    problems: [
        { id: "PRB-0010", from: "INC-0201", title: "契約台帳の誤更新が多発", status: "原因調査中" },
        { id: "PRB-0011", from: "INC-0202", title: "BI連携の同期遅延", status: "恒久対策待ち" },
    ],
    slos: [
        { name: "問合せ応答時間", target: "95% < 1営業日", current: "98.2%", status: "good" },
        { name: "重要アプリ可用性", target: "99.5%", current: "99.9%", status: "good" },
        { name: "バッチ処理成功率", target: "99.9%", current: "99.7%", status: "warn" },
    ]
  };

  // ---------- Utilities ----------
  const esc = (s) => String(s)
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

  function badgeClass(level){
    if (level === "高" || level === "WARN" || level.includes("注意")) return "warn";
    if (level === "OK" || level === "低" || level.includes("達成")) return "good";
    if (level === "中") return "warn";
    if (level === "BAD" || level.includes("未達")) return "bad";
    return "";
  }

  function showToast(title, msg, icon = "fa-bolt"){
    toast.innerHTML = `
      <div class="toast__row">
        <div class="toast__icon"><i class="fa-solid ${icon}"></i></div>
        <div>
          <div class="toast__title">${esc(title)}</div>
          <div class="toast__msg">${esc(msg)}</div>
        </div>
      </div>
    `;
    toast.classList.add("show");
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => toast.classList.remove("show"), 2400);
  }

  function setHeader(title, subtitle){
    pageTitle.textContent = title;
    pageSubtitle.textContent = subtitle;
  }

  function setActiveMenu(route){
    $$(".menu__item").forEach(a => a.classList.toggle("is-active", a.dataset.route === route));
  }

  // ---------- Views ----------
  const views = {
    dashboard(){
      setHeader("ダッシュボード", "今日の運用状況を一目で確認");
      const k = state.kpi;
      const sloOk = state.slos.filter(s => s.status === "good").length;
      const sloTotal = state.slos.length;

      view.innerHTML = `
        <div class="grid">
          <div class="card" style="grid-column: span 3;">
            <div class="kpi">
              <div class="kpi__icon blue"><i class="fa-solid fa-cubes"></i></div>
              <div class="kpi__text">
                <div class="kpi__num">${k.appsTotal}</div>
                <div class="kpi__label">利用中アプリ数</div>
              </div>
            </div>
          </div>

          <div class="card" style="grid-column: span 3;">
            <div class="kpi">
              <div class="kpi__icon pink"><i class="fa-solid fa-fire-flame-curved"></i></div>
              <div class="kpi__text">
                <div class="kpi__num">${k.appsCritical}</div>
                <div class="kpi__label">重要アプリ（高）</div>
              </div>
            </div>
          </div>

          <div class="card" style="grid-column: span 3;">
            <div class="kpi">
              <div class="kpi__icon green"><i class="fa-solid fa-handshake"></i></div>
              <div class="kpi__text">
                <div class="kpi__num">${sloOk}/${sloTotal}</div>
                <div class="kpi__label">SLO達成状況</div>
              </div>
            </div>
          </div>

          <div class="card" style="grid-column: span 3;">
            <div class="kpi">
              <div class="kpi__icon orange"><i class="fa-solid fa-triangle-exclamation"></i></div>
              <div class="kpi__text">
                <div class="kpi__num">${state.incidents.length}</div>
                <div class="kpi__label">インシデント（未了）</div>
              </div>
            </div>
          </div>

          <div class="card" style="grid-column: span 7;">
            <div class="card__head">
              <div>
                <div class="card__title"><i class="fa-solid fa-cubes"></i>注目アプリ</div>
                <div class="card__meta">重要度・状態・利用者数のサンプル</div>
              </div>
              <div class="card__actions">
                <span class="badge warn"><i class="fa-solid fa-shield-halved"></i> 重要</span>
                <span class="badge good"><i class="fa-solid fa-circle-check"></i> 稼働</span>
              </div>
            </div>

            <table class="table">
              <thead>
                <tr>
                  <th>アプリ</th><th>管理</th><th>重要度</th><th>状態</th><th>最終更新</th><th>利用者</th>
                </tr>
              </thead>
              <tbody>
                ${state.apps.slice(0,4).map(a => `
                  <tr>
                    <td><i class="fa-solid fa-cube" style="color:#2563eb"></i> ${esc(a.name)}</td>
                    <td>${esc(a.owner)}</td>
                    <td><span class="badge ${badgeClass(a.critical)}">${esc(a.critical)}</span></td>
                    <td>${esc(a.status)}</td>
                    <td>${esc(a.last)}</td>
                    <td>${esc(a.users)}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>

          <div class="card" style="grid-column: span 5;">
            <div class="card__head">
              <div>
                <div class="card__title"><i class="fa-solid fa-clipboard-check"></i>今日のチェック</div>
                <div class="card__meta">“やること”が迷子にならないように</div>
              </div>
            </div>

            <div class="note">
              <i class="fa-solid fa-lightbulb"></i>
              <div>
                <div style="font-weight:900;">おすすめ運用ルーチン</div>
                <div style="color:var(--muted); font-size:12px; margin-top:4px;">
                  ① 変更要求 → ② 削除申請 → ③ インシデント → ④ 問題
                </div>
              </div>
            </div>

            <div style="margin-top:12px; display:grid; gap:10px;">
              <div class="card" style="box-shadow:none; background:rgba(255,255,255,.6);">
                <div class="toolbar">
                  <div><i class="fa-solid fa-code-branch" style="color:#8b5cf6;"></i> 変更管理（未処理）</div>
                  <span class="badge warn">${state.changes.length} 件</span>
                </div>
              </div>
              <div class="card" style="box-shadow:none; background:rgba(255,255,255,.6);">
                <div class="toolbar">
                  <div><i class="fa-solid fa-trash-can" style="color:#f59e0b;"></i> 削除申請（未処理）</div>
                  <span class="badge warn">${k.deletesPending} 件</span>
                </div>
              </div>
              <div class="card" style="box-shadow:none; background:rgba(255,255,255,.6);">
                <div class="toolbar">
                  <div><i class="fa-solid fa-triangle-exclamation" style="color:#ef4444;"></i> インシデント（未了）</div>
                  <span class="badge bad">${state.incidents.length} 件</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    users(){
      setHeader("ユーザー管理", "利用者・休眠ユーザー・リスクの棚卸");
      view.innerHTML = `
        <div class="card">
          <div class="card__head">
            <div>
              <div class="card__title"><i class="fa-solid fa-users"></i>AppSuite利用ユーザー</div>
              <div class="card__meta">最終ログインが古いユーザーは“要棚卸”に</div>
            </div>
            <div class="card__actions">
              <button class="btn" type="button" id="btnUserExport">
                <i class="fa-solid fa-file-arrow-down"></i><span>CSV出力（モック）</span>
              </button>
            </div>
          </div>

          <div class="toolbar" style="margin-bottom:12px;">
            <div class="input">
              <i class="fa-solid fa-filter"></i>
              <input id="userFilter" placeholder="氏名/部署で絞り込み…" />
            </div>
            <span class="badge"><i class="fa-solid fa-circle-info"></i> サンプル: ${state.users.length}名</span>
          </div>

          <table class="table" id="userTable">
            <thead>
              <tr><th>氏名</th><th>部署</th><th>役割</th><th>リスク</th><th>最終ログイン</th></tr>
            </thead>
            <tbody>
              ${state.users.map(u => `
                <tr>
                  <td><i class="fa-solid fa-user" style="color:#2563eb"></i> ${esc(u.name)}</td>
                  <td>${esc(u.dept)}</td>
                  <td>${esc(u.role)}</td>
                  <td><span class="badge ${u.risk==="高"?"bad":u.risk==="中"?"warn":"good"}">${esc(u.risk)}</span></td>
                  <td>${esc(u.lastLogin)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `;

      $("#btnUserExport").addEventListener("click", () => {
        showToast("エクスポート", "CSV出力（モック）を実行しました", "fa-file-csv");
      });

      $("#userFilter").addEventListener("input", (e) => {
        const q = e.target.value.trim();
        const rows = $$("#userTable tbody tr");
        rows.forEach(tr => {
          const t = tr.textContent;
          tr.style.display = t.includes(q) ? "" : "none";
        });
      });
    },

    orgs(){
      setHeader("組織管理", "部署ツリーと利用状況（サンプル）");
      view.innerHTML = `
        <div class="grid">
          <div class="card" style="grid-column: span 6;">
            <div class="card__head">
              <div>
                <div class="card__title"><i class="fa-solid fa-sitemap"></i>組織ツリー（イメージ）</div>
                <div class="card__meta">実装時は NEO共通API で同期</div>
              </div>
            </div>

            <div style="display:grid; gap:10px;">
              ${[
                ["管理本部", "fa-building"],
                ["└ 総務部", "fa-people-roof"],
                ["└ 経理部", "fa-coins"],
                ["工事部", "fa-helmet-safety"],
                ["システムG", "fa-server"],
              ].map(([name, icon]) => `
                <div class="card" style="box-shadow:none; background:rgba(255,255,255,.6);">
                  <i class="fa-solid ${icon}" style="color:#2563eb;"></i>
                  <span style="margin-left:10px; font-weight:800;">${esc(name)}</span>
                </div>
              `).join("")}
            </div>
          </div>

          <div class="card" style="grid-column: span 6;">
            <div class="card__head">
              <div>
                <div class="card__title"><i class="fa-solid fa-chart-simple"></i>部署別 利用アプリ（例）</div>
                <div class="card__meta">「どの部署が何を使っているか」を可視化</div>
              </div>
            </div>

            <table class="table">
              <thead><tr><th>部署</th><th>利用アプリ</th><th>メモ</th></tr></thead>
              <tbody>
                <tr><td>総務部</td><td>契約台帳 / 備品貸出</td><td><span class="badge warn">重要台帳あり</span></td></tr>
                <tr><td>経理部</td><td>出張精算補助</td><td><span class="badge">休止</span></td></tr>
                <tr><td>工事部</td><td>案件進捗台帳</td><td><span class="badge good">利用多</span></td></tr>
                <tr><td>システムG</td><td>PC資産台帳</td><td><span class="badge warn">削除統制</span></td></tr>
              </tbody>
            </table>
          </div>
        </div>
      `;
    },

    apps(){
      setHeader("AppSuiteアプリ管理", "アプリ棚卸・重要度・稼働状態を一元管理");
      view.innerHTML = `
        <div class="card">
          <div class="card__head">
            <div>
              <div class="card__title"><i class="fa-solid fa-cubes"></i>アプリ一覧</div>
              <div class="card__meta">野良アプリ防止 / ライフサイクル管理の入口</div>
            </div>
            <div class="card__actions">
              <button class="btn" type="button" id="btnNewApp">
                <i class="fa-solid fa-circle-plus"></i><span>新規登録（モック）</span>
              </button>
            </div>
          </div>

          <div class="toolbar" style="margin-bottom:12px;">
            <div class="input">
              <i class="fa-solid fa-magnifying-glass"></i>
              <input id="appFilter" placeholder="アプリ名/管理部門で検索…" />
            </div>

            <div class="input">
              <i class="fa-solid fa-fire"></i>
              <select id="critFilter" aria-label="重要度フィルタ">
                <option value="">重要度: すべて</option>
                <option value="高">高</option>
                <option value="中">中</option>
                <option value="低">低</option>
              </select>
            </div>
          </div>

          <table class="table" id="appTable">
            <thead>
              <tr><th>アプリ</th><th>管理</th><th>重要度</th><th>状態</th><th>最終更新</th><th>利用者</th></tr>
            </thead>
            <tbody>
              ${state.apps.map(a => `
                <tr>
                  <td><i class="fa-solid fa-cube" style="color:#2563eb"></i> ${esc(a.name)}</td>
                  <td>${esc(a.owner)}</td>
                  <td><span class="badge ${badgeClass(a.critical)}">${esc(a.critical)}</span></td>
                  <td>${esc(a.status)}</td>
                  <td>${esc(a.last)}</td>
                  <td>${esc(a.users)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `;

      const applyFilter = () => {
        const q = $("#appFilter").value.trim();
        const crit = $("#critFilter").value;
        $$("#appTable tbody tr").forEach(tr => {
          const text = tr.textContent;
          const matchQ = q ? text.includes(q) : true;
          const matchC = crit ? text.includes(crit) : true;
          tr.style.display = (matchQ && matchC) ? "" : "none";
        });
      };
      $("#appFilter").addEventListener("input", applyFilter);
      $("#critFilter").addEventListener("change", applyFilter);

      $("#btnNewApp").addEventListener("click", () => {
        showToast("アプリ登録", "新規登録（モック）を起動しました", "fa-circle-plus");
      });
    },

    access(){
      setHeader("権限・アクセス管理", "権限過多・異動対応の見える化（サンプル）");
      view.innerHTML = `
        <div class="grid">
          <div class="card" style="grid-column: span 7;">
            <div class="card__head">
              <div>
                <div class="card__title"><i class="fa-solid fa-key"></i>権限の観点（運用）</div>
                <div class="card__meta">“UIとAPIで同じ権限が効く”前提で統制</div>
              </div>
            </div>

            <div class="note">
              <i class="fa-solid fa-shield-halved"></i>
              <div>
                <div style="font-weight:900;">おすすめ設計（最小権限）</div>
                <div style="color:var(--muted); font-size:12px; margin-top:4px;">
                  参照 / 入力 / 編集 / 削除 / インポート / エクスポート を分けて付与
                </div>
              </div>
            </div>

            <table class="table" style="margin-top:12px;">
              <thead><tr><th>ルール</th><th>理由</th></tr></thead>
              <tbody>
                <tr><td>削除は原則禁止</td><td>復元不可前提。申請＋承認＋証跡が必要</td></tr>
                <tr><td>連携ユーザーは専用アカウント</td><td>人操作と混ざると追跡が困難</td></tr>
                <tr><td>異動・退職で権限棚卸</td><td>権限が残ると“静かに事故る”</td></tr>
              </tbody>
            </table>
          </div>

          <div class="card" style="grid-column: span 5;">
            <div class="card__head">
              <div>
                <div class="card__title"><i class="fa-solid fa-user-shield"></i>要対応ユーザー（例）</div>
                <div class="card__meta">最終ログインが古い/リスク高</div>
              </div>
            </div>

            <table class="table">
              <thead><tr><th>氏名</th><th>部署</th><th>リスク</th><th>最終ログイン</th></tr></thead>
              <tbody>
                ${state.users.filter(u => u.risk !== "低").map(u => `
                  <tr>
                    <td>${esc(u.name)}</td>
                    <td>${esc(u.dept)}</td>
                    <td><span class="badge ${u.risk==="高"?"bad":"warn"}">${esc(u.risk)}</span></td>
                    <td>${esc(u.lastLogin)}</td>
                  </tr>
                `).join("") || `<tr><td colspan="4">要対応ユーザーはありません</td></tr>`}
              </tbody>
            </table>

            <div style="margin-top:12px;">
              <button class="btn btn--primary" type="button" id="btnReview">
                <i class="fa-solid fa-clipboard-check"></i><span>棚卸タスク作成（モック）</span>
              </button>
            </div>
          </div>
        </div>
      `;

      $("#btnReview").addEventListener("click", () => {
        showToast("棚卸", "権限見直しタスク（モック）を作成しました", "fa-clipboard-check");
      });
    },

    "data-ops"(){
      setHeader("データ運用管理", "登録・更新・削除（申請）を統制する");
      view.innerHTML = `
        <div class="grid">
          <div class="card" style="grid-column: span 7;">
            <div class="card__head">
              <div>
                <div class="card__title"><i class="fa-solid fa-trash-can"></i>削除申請（最重要）</div>
                <div class="card__meta">“削除は事故りやすい”ので統制の中心に</div>
              </div>
              <div class="card__actions">
                <span class="badge warn"><i class="fa-solid fa-triangle-exclamation"></i> 未処理: ${state.deletions.length}</span>
              </div>
            </div>

            <table class="table">
              <thead><tr><th>ID</th><th>アプリ</th><th>申請者</th><th>理由</th><th>件数</th><th>状態</th></tr></thead>
              <tbody>
                ${state.deletions.map(d => `
                  <tr>
                    <td>${esc(d.id)}</td>
                    <td>${esc(d.app)}</td>
                    <td>${esc(d.requester)}</td>
                    <td>${esc(d.reason)}</td>
                    <td>${esc(d.count)}</td>
                    <td><span class="badge ${d.status.includes("承認") ? "warn" : "bad"}">${esc(d.status)}</span></td>
                  </tr>
                `).join("")}
              </tbody>
            </table>

            <div style="margin-top:12px; display:flex; gap:10px; flex-wrap:wrap;">
              <button class="btn" type="button" id="btnApprove"><i class="fa-solid fa-circle-check"></i><span>承認（モック）</span></button>
              <button class="btn" type="button" id="btnReject"><i class="fa-solid fa-circle-xmark"></i><span>差し戻し（モック）</span></button>
              <button class="btn btn--primary" type="button" id="btnEvidence"><i class="fa-solid fa-file-shield"></i><span>証跡保存（モック）</span></button>
            </div>
          </div>

          <div class="card" style="grid-column: span 5;">
            <div class="card__head">
              <div>
                <div class="card__title"><i class="fa-solid fa-database"></i>運用メモ</div>
                <div class="card__meta">運用の“型”を固定すると事故が減る</div>
              </div>
            </div>

            <div class="note">
              <i class="fa-solid fa-list-check"></i>
              <div>
                <div style="font-weight:900;">削除統制の手順（例）</div>
                <div style="color:var(--muted); font-size:12px; margin-top:4px;">
                  ① 申請確認 → ② 影響確認 → ③ バックアップ → ④ 実施 → ⑤ 証跡保存
                </div>
              </div>
            </div>

            <table class="table" style="margin-top:12px;">
              <thead><tr><th>項目</th><th>推奨</th></tr></thead>
              <tbody>
                <tr><td>削除権限</td><td>IT部門のみ</td></tr>
                <tr><td>削除理由</td><td>必須（監査対応）</td></tr>
                <tr><td>復元手段</td><td>外部バックアップ</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      `;

      $("#btnApprove").addEventListener("click", () => showToast("承認", "削除申請を承認（モック）しました", "fa-circle-check"));
      $("#btnReject").addEventListener("click", () => showToast("差し戻し", "削除申請を差し戻し（モック）しました", "fa-circle-xmark"));
      $("#btnEvidence").addEventListener("click", () => showToast("証跡", "証跡保存（モック）を実行しました", "fa-file-shield"));
    },

    integrations(){
      setHeader("外部連携・同期管理", "同期の見える化（ブラックボックス化防止）");
      view.innerHTML = `
        <div class="card">
          <div class="card__head">
            <div>
              <div class="card__title"><i class="fa-solid fa-arrows-rotate"></i>連携一覧</div>
              <div class="card__meta">最終同期・状態・注意点を一元管理</div>
            </div>
            <div class="card__actions">
              <button class="btn btn--primary" type="button" id="btnRunSync">
                <i class="fa-solid fa-rocket"></i><span>同期実行（モック）</span>
              </button>
            </div>
          </div>

          <table class="table">
            <thead><tr><th>連携</th><th>方式</th><th>最終同期</th><th>状態</th></tr></thead>
            <tbody>
              ${state.integrations.map(x => `
                <tr>
                  <td><i class="fa-solid fa-link" style="color:#2563eb"></i> ${esc(x.name)}</td>
                  <td>${esc(x.mode)}</td>
                  <td>${esc(x.last)}</td>
                  <td><span class="badge ${x.status==="OK"?"good":"warn"}">${esc(x.status)}</span></td>
                </tr>
              `).join("")}
            </tbody>
          </table>

          <div style="margin-top:12px;" class="note">
            <i class="fa-solid fa-circle-info"></i>
            <div>
              <div style="font-weight:900;">運用のコツ</div>
              <div style="color:var(--muted); font-size:12px; margin-top:4px;">
                “OKでもログは残す”。WARNは原因分類（仕様/制限/通信/認証）で切り分けると早いです。
              </div>
            </div>
          </div>
        </div>
      `;

      $("#btnRunSync").addEventListener("click", () => {
        showToast("同期", "同期実行（モック）を開始しました", "fa-rocket");
      });
    },

    evidence(){
      setHeader("バックアップ・証跡管理", "“戻せない”前提を運用で補完");
      view.innerHTML = `
        <div class="grid">
          <div class="card" style="grid-column: span 7;">
            <div class="card__head">
              <div>
                <div class="card__title"><i class="fa-solid fa-file-shield"></i>重要台帳の保全（例）</div>
                <div class="card__meta">定期エクスポート＋証跡保管</div>
              </div>
            </div>

            <table class="table">
              <thead><tr><th>対象</th><th>方式</th><th>頻度</th><th>最終実施</th><th>状態</th></tr></thead>
              <tbody>
                <tr><td>PC資産台帳</td><td>CSV+PDF</td><td>月次</td><td>2026-01-10</td><td><span class="badge good">OK</span></td></tr>
                <tr><td>契約台帳</td><td>CSV</td><td>月次</td><td>2025-12-28</td><td><span class="badge warn">期限注意</span></td></tr>
                <tr><td>案件進捗台帳</td><td>CSV</td><td>週次</td><td>2026-01-12</td><td><span class="badge good">OK</span></td></tr>
              </tbody>
            </table>

            <div style="margin-top:12px; display:flex; gap:10px; flex-wrap:wrap;">
              <button class="btn" id="btnBackup"><i class="fa-solid fa-box-archive"></i><span>バックアップ実行（モック）</span></button>
              <button class="btn btn--primary" id="btnAuditExport"><i class="fa-solid fa-file-export"></i><span>監査用出力（モック）</span></button>
            </div>
          </div>

          <div class="card" style="grid-column: span 5;">
            <div class="card__head">
              <div>
                <div class="card__title"><i class="fa-solid fa-shield-heart"></i>運用ポリシー</div>
                <div class="card__meta">“データの生命線”を明文化</div>
              </div>
            </div>

            <div class="note">
              <i class="fa-solid fa-triangle-exclamation"></i>
              <div>
                <div style="font-weight:900;">削除・上書きの前に</div>
                <div style="color:var(--muted); font-size:12px; margin-top:4px;">
                  ① 影響確認 → ② バックアップ → ③ 証跡保存  
                  （この順番、守るだけで事故は激減します）
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      $("#btnBackup").addEventListener("click", () => showToast("バックアップ", "バックアップ（モック）を実行しました", "fa-box-archive"));
      $("#btnAuditExport").addEventListener("click", () => showToast("監査出力", "監査用出力（モック）を作成しました", "fa-file-export"));
    },

    incidents(){
      setHeader("インシデント管理", "誤操作・連携障害を“学び”に変える");
      view.innerHTML = `
        <div class="card">
          <div class="card__head">
            <div>
              <div class="card__title"><i class="fa-solid fa-triangle-exclamation"></i>インシデント一覧</div>
              <div class="card__meta">AppSuiteも“ITサービス”として扱う</div>
            </div>
            <div class="card__actions">
              <button class="btn btn--primary" id="btnNewInc"><i class="fa-solid fa-circle-plus"></i><span>新規登録（モック）</span></button>
            </div>
          </div>

          <table class="table">
            <thead><tr><th>ID</th><th>種類</th><th>対象</th><th>影響</th><th>発生日</th><th>担当</th><th>状態</th></tr></thead>
            <tbody>
              ${state.incidents.map(i => `
                <tr>
                  <td>${esc(i.id)}</td>
                  <td>${esc(i.type)}</td>
                  <td>${esc(i.app)}</td>
                  <td><span class="badge ${i.impact==="中"?"warn":"good"}">${esc(i.impact)}</span></td>
                  <td>${esc(i.when)}</td>
                  <td>${esc(i.owner)}</td>
                  <td>${esc(i.status)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>

          <div style="margin-top:12px;" class="note">
            <i class="fa-solid fa-brain"></i>
            <div>
              <div style="font-weight:900;">再発防止の型（例）</div>
              <div style="color:var(--muted); font-size:12px; margin-top:4px;">
                原因分類（権限/仕様/手順/教育/連携）→ 対策（ルール/自動化/制限/監視）へ落とす
              </div>
            </div>
          </div>
        </div>
      `;
      $("#btnNewInc").addEventListener("click", () => showToast("登録", "インシデント登録（モック）を起動しました", "fa-circle-plus"));
    },

    "problem-management"(){
      setHeader("問題管理", "インシデントの根本原因を特定・管理する");
      view.innerHTML = `
        <div class="card">
          <div class="card__head">
            <div>
              <div class="card__title"><i class="fa-solid fa-magnifying-glass-chart"></i>問題一覧</div>
              <div class="card__meta">インシデントの裏にある“本当の課題”を追跡</div>
            </div>
          </div>

          <table class="table">
            <thead><tr><th>ID</th><th>関連インシデント</th><th>内容</th><th>状態</th></tr></thead>
            <tbody>
              ${state.problems.map(p => `
                <tr>
                  <td>${esc(p.id)}</td>
                  <td>${esc(p.from)}</td>
                  <td>${esc(p.title)}</td>
                  <td><span class="badge warn">${esc(p.status)}</span></td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `;
    },

    "change-management"(){
      setHeader("変更管理", "サービスへの影響を管理・承認するプロセス");
      view.innerHTML = `
        <div class="card">
          <div class="card__head">
            <div>
              <div class="card__title"><i class="fa-solid fa-code-branch"></i>変更要求一覧</div>
              <div class="card__meta">アプリ改修・仕様変更などを統制</div>
            </div>
          </div>

          <table class="table">
            <thead><tr><th>ID</th><th>対象アプリ</th><th>変更種別</th><th>申請者</th><th>状態</th><th>完了希望日</th></tr></thead>
            <tbody>
              ${state.changes.map(c => `
                <tr>
                  <td>${esc(c.id)}</td>
                  <td>${esc(c.app)}</td>
                  <td>${esc(c.type)}</td>
                  <td>${esc(c.requester)}</td>
                  <td><span class="badge ${c.status.includes("承認") ? "good" : "warn"}">${esc(c.status)}</span></td>
                  <td>${esc(c.due)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `;
    },

    "service-level"(){
      setHeader("サービスレベル管理", "SLO/SLAの定義と達成状況の確認");
      view.innerHTML = `
        <div class="card">
          <div class="card__head">
            <div>
              <div class="card__title"><i class="fa-solid fa-handshake"></i>サービスレベル目標（SLO）</div>
              <div class="card__meta">サービスの品質を定量的に評価・改善する</div>
            </div>
          </div>

          <table class="table">
            <thead><tr><th>評価項目</th><th>目標値</th><th>実績値</th><th>状態</th></tr></thead>
            <tbody>
              ${state.slos.map(s => `
                <tr>
                  <td>${esc(s.name)}</td>
                  <td>${esc(s.target)}</td>
                  <td>${esc(s.current)}</td>
                  <td><span class="badge ${badgeClass(s.status === 'good' ? '達成' : '注意')}">${s.status === 'good' ? '達成' : '注意'}</span></td>
                </tr>
              `).join("")}
            </tbody>
          </table>

          <div style="margin-top:12px;" class="note">
            <i class="fa-solid fa-circle-info"></i>
            <div>
              <div style="font-weight:900;">SLOとは？</div>
              <div style="color:var(--muted); font-size:12px; margin-top:4px;">
                Service Level Objective（サービスレベル目標）の略。SLA（合意）より柔軟な内部目標として設定し、継続的なサービス改善に繋げます。
              </div>
            </div>
          </div>
        </div>
      `;
    },

    docs(){
      setHeader("運用ルール・ドキュメント", "“聞かれなくても分かる”状態へ");
      view.innerHTML = `
        <div class="card">
          <div class="card__head">
            <div>
              <div class="card__title"><i class="fa-solid fa-book"></i>ドキュメント一覧（例）</div>
              <div class="card__meta">社内配布用の雛形を置く場所</div>
            </div>
          </div>

          <table class="table">
            <thead><tr><th>種別</th><th>タイトル</th><th>更新日</th><th>備考</th></tr></thead>
            <tbody>
              <tr><td>運用</td><td>AppSuite運用ルール（IT部門）</td><td>2026-01-14</td><td><span class="badge good">最新版</span></td></tr>
              <tr><td>利用</td><td>業務部門向け入力ガイド</td><td>2026-01-12</td><td>UI説明中心</td></tr>
              <tr><td>連携</td><td>API連携設計方針</td><td>2026-01-10</td><td>最小権限・制限事項</td></tr>
              <tr><td>監査</td><td>証跡保管・監査出力手順</td><td>2026-01-09</td><td>月次</td></tr>
            </tbody>
          </table>

          <div style="margin-top:12px;" class="note">
            <i class="fa-solid fa-feather-pointed"></i>
            <div>
              <div style="font-weight:900;">コツ</div>
              <div style="color:var(--muted); font-size:12px; margin-top:4px;">
                “運用ルールは短く、チェックリストは強く”。人は文章を読まないので、仕組みで守らせるのが勝ちです。
              </div>
            </div>
          </div>
        </div>
      `;
    },

    settings(){
      setHeader("システム設定", "API接続・連携スケジュール・ログ出力（モック）");
      view.innerHTML = `
        <div class="grid">
          <div class="card" style="grid-column: span 6;">
            <div class="card__head">
              <div>
                <div class="card__title"><i class="fa-solid fa-gear"></i>API接続</div>
                <div class="card__meta">本番では環境変数・秘密情報管理に</div>
              </div>
            </div>

            <div style="display:grid; gap:10px;">
              <div class="input">
                <i class="fa-solid fa-globe"></i>
                <input value="https://example.desknets.ne.jp/" aria-label="NEO URL" />
              </div>
              <div class="input">
                <i class="fa-solid fa-key"></i>
                <input value="********" aria-label="APIキー（マスク）" />
              </div>
              <button class="btn btn--primary" id="btnTestConn">
                <i class="fa-solid fa-plug-circle-check"></i><span>接続テスト（モック）</span>
              </button>
            </div>
          </div>

          <div class="card" style="grid-column: span 6;">
            <div class="card__head">
              <div>
                <div class="card__title"><i class="fa-solid fa-clock"></i>スケジュール</div>
                <div class="card__meta">同期・バックアップ・点検の自動化ポイント</div>
              </div>
            </div>

            <table class="table">
              <thead><tr><th>ジョブ</th><th>頻度</th><th>次回</th><th>状態</th></tr></thead>
              <tbody>
                <tr><td>人事→部署マスタ同期</td><td>毎時</td><td>2026-01-14 16:00</td><td><span class="badge good">有効</span></td></tr>
                <tr><td>重要台帳バックアップ</td><td>月次</td><td>2026-02-01 02:30</td><td><span class="badge good">有効</span></td></tr>
                <tr><td>未使用アプリ検知</td><td>週次</td><td>2026-01-18 03:00</td><td><span class="badge warn">要調整</span></td></tr>
              </tbody>
            </table>
          </div>
        </div>
      `;

      $("#btnTestConn").addEventListener("click", () => {
        showToast("接続テスト", "接続OK（モック）", "fa-plug-circle-check");
      });
    }
  };

  // ---------- Router ----------
  function routeFromHash(){
    const h = (location.hash || "#/dashboard").replace("#/", "");
    return h || "dashboard";
  }

  function render(){
    const route = routeFromHash();
    setActiveMenu(route);
    (views[route] || views.dashboard)();
  }

  window.addEventListener("hashchange", render);

  // ---------- Sidebar toggles ----------
  sidebarToggle.addEventListener("click", () => {
    if (window.matchMedia("(max-width: 920px)").matches){
      sidebar.classList.toggle("is-open");
    } else {
      sidebar.classList.toggle("is-collapsed");
    }
  });

  // Close sidebar on small screen when clicking content
  $(".content").addEventListener("click", () => {
    if (window.matchMedia("(max-width: 920px)").matches){
      sidebar.classList.remove("is-open");
    }
  });

  // ---------- Theme toggle ----------
  toggleThemeBtn.addEventListener("click", () => {
    document.body.classList.toggle("theme-dark");
    const isDark = document.body.classList.contains("theme-dark");
    toggleThemeBtn.innerHTML = isDark
      ? `<i class="fa-solid fa-moon"></i><span>ダーク</span>`
      : `<i class="fa-solid fa-sun"></i><span>ライト</span>`;
    showToast("テーマ", isDark ? "ダークに切替" : "ライトに切替", isDark ? "fa-moon" : "fa-sun");
  });

  // ---------- Menu search (filter menu items) ----------
  menuSearch.addEventListener("input", (e) => {
    const q = e.target.value.trim().toLowerCase();
    $$(".menu__item").forEach(a => {
      const t = a.textContent.toLowerCase();
      a.style.display = q ? (t.includes(q) ? "" : "none") : "";
    });
  });

  // ---------- Simulate update ----------
  simulateBtn.addEventListener("click", () => {
    // small, deterministic tweaks
    state.kpi.changesMonth += 3;
    state.kpi.integrationAlerts = (state.kpi.integrationAlerts + 1) % 3;
    showToast("サンプル更新", "ダッシュボードの数値を更新しました", "fa-wand-magic-sparkles");
    render();
  });

  // ---------- Initial render ----------
  render();

  // Friendly first toast
  showToast("ようこそ", "左メニューでページ切替できます（サンプル）", "fa-sparkles");
})();
