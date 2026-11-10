/*
 * 簽核流程設定：畫面與互動。
 * 資料來自 DataSource（js/data-source.js），經 OrgModel（js/org-model.js）整理後使用。
 */
(function () {
  'use strict';

  const $app = document.getElementById('app');

  /* ---------- 工具 ---------- */
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const svg = (body, size, extra) => '<svg width="' + (size || 18) + '" height="' + (size || 18) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + ((extra && extra.sw) || 1.8) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + '</svg>';
  const ICON = {
    emp: '<rect x="4" y="3" width="16" height="18" rx="2"></rect><circle cx="12" cy="10" r="3"></circle><path d="M7.5 17.5c.8-2 2.5-3 4.5-3s3.7 1 4.5 3"></path>',
    group: '<path d="M3 7V5a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v3"></path><path d="M3 7v12a1 1 0 0 0 1 1h7"></path><circle cx="17" cy="14" r="2.5"></circle><path d="M13 21c.5-2 2-3 4-3s3.5 1 4 3"></path>',
    dept: '<circle cx="12" cy="8" r="2.5"></circle><circle cx="5" cy="10" r="2"></circle><circle cx="19" cy="10" r="2"></circle><path d="M8 17c.6-2.2 2.1-3.5 4-3.5s3.4 1.3 4 3.5"></path><path d="M2 17c.4-1.6 1.5-2.5 3-2.5"></path><path d="M22 17c-.4-1.6-1.5-2.5-3-2.5"></path>',
    head: '<circle cx="12" cy="8" r="4"></circle><path d="M5 20c1-3.5 3.7-5.5 7-5.5s6 2 7 5.5"></path>',
    org: '<rect x="3" y="3" width="7" height="6" rx="1"></rect><rect x="14" y="3" width="7" height="6" rx="1"></rect><rect x="14" y="15" width="7" height="6" rx="1"></rect><path d="M6.5 9v9H14"></path><path d="M10 6h4"></path>',
    role: '<circle cx="10" cy="7" r="3.5"></circle><path d="M3 19c.8-3 3.5-5 7-5"></path><path d="M14 17l2.5 2.5L21 15"></path>',
    rel: '<circle cx="12" cy="6" r="2.5"></circle><circle cx="6" cy="17" r="2.5"></circle><circle cx="18" cy="17" r="2.5"></circle>',
    cond: '<path d="M7 21V12"></path><path d="M7 12c0-4 3-6 7-6h3"></path><path d="M14 3l3 3-3 3"></path><path d="M7 12c0 3 2 5 6 5h1"></path><circle cx="17" cy="17" r="2.5"></circle>',
    search: '<circle cx="11" cy="11" r="7"></circle><path d="M20 20l-3.5-3.5"></path>',
    plus: '<path d="M12 5v14M5 12h14"></path>',
    close: '<path d="M6 6l12 12M18 6L6 18"></path>',
    chev: '<path d="M9 6l6 6-6 6"></path>',
    back: '<path d="M15 6l-6 6 6 6"></path>',
    up: '<path d="M6 15l6-6 6 6"></path>',
    down: '<path d="M6 9l6 6 6-6"></path>',
    grip: '<circle cx="9" cy="6" r="1" fill="currentColor"></circle><circle cx="15" cy="6" r="1" fill="currentColor"></circle><circle cx="9" cy="12" r="1" fill="currentColor"></circle><circle cx="15" cy="12" r="1" fill="currentColor"></circle><circle cx="9" cy="18" r="1" fill="currentColor"></circle><circle cx="15" cy="18" r="1" fill="currentColor"></circle>',
    alert: '<circle cx="12" cy="12" r="9"></circle><path d="M12 7.5v5.5"></path><path d="M12 16.5v.5"></path>',
    trash: '<path d="M4 7h16"></path><path d="M9 7V4h6v3"></path><path d="M6 7l1 13h10l1-13"></path>',
    pencil: '<path d="M4 20h4L19 9l-4-4L4 16v4z"></path>',
    check: '<path d="M5 12l5 5 9-10"></path>',
    clock: '<circle cx="12" cy="12" r="8"></circle><path d="M12 8v4l3 2"></path>',
    flag: '<path d="M4 21V4h11l-1 4h6v9H9"></path>',
    swap: '<path d="M17 1l4 4-4 4"></path><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><path d="M7 23l-4-4 4-4"></path><path d="M21 13v2a4 4 0 0 1-4 4H3"></path>',
    dot: '<circle cx="12" cy="12" r="6" fill="currentColor" stroke="none"></circle>'
  };
  const NAV = ['emp', 'group', 'dept', 'head', 'org', 'role', 'rel', 'cond'];
  const OPS = { num: ['>', '≥', '<', '≤', '=', '≠'], enum: ['等於', '不等於'], rank: ['以上（含）', '以下（含）', '等於', '不等於'], text: ['包含', '等於', '為空', '不為空'] };
  const MODE_TEXT = { any: '任一人簽核', all: '全部簽核', seq: '依序簽核' };
  // 可在頁面上維護名單的簽核來源
  const DIR = {
    group: { list: 'groups', noun: '群組', prefix: 'G', hint: '群組成員都可以簽核這一關，適合跨部門的審核小組' },
    role: { list: 'roles', noun: '角色', prefix: 'R', hint: '具備此職能的人員都可以簽核這一關，例如財務審核、法務審核' }
  };
  const SAMPLE_TIMES =['11/03 10:05', '11/03 14:30', '11/03 16:48', '11/04 09:15', '11/04 10:12', '11/04 14:40', '11/04 16:05', '11/05 09:30', '11/05 11:20', '11/05 15:45', '11/06 10:00', '11/06 14:10'];

  /* ---------- 狀態 ---------- */
  let M = null;
  const S = {
    tab: 'emp', q: '', view: null, editor: null, tried: false,
    custom: [], picked: [], settings: {},
    screen: 'edit', preview: 'pending', saved: false,
    confirm: null, saving: false, saveError: '',
    version: 0, snapshot: null, prevVersion: 0,
    history: [], viewVersion: null, verOpen: false,
    member: null
  };
  let dragFrom = null;
  function set(patch) { Object.assign(S, patch); render(); }

  /* ---------- 資料查詢 ---------- */
  const field = (key) => M.fields.find((f) => f.key === key);
  const needsValue = (c) => c.op !== '為空' && c.op !== '不為空';

  function clauseParts(c) {
    const f = field(c.field) || { label: c.field, type: 'text' };
    const v = String(c.value == null ? '' : c.value).trim();
    const shown = f.type === 'num' && v ? Number(v).toLocaleString('en-US') + (f.unit ? ' ' + f.unit : '') : v;
    return { f: f.label, op: c.op, v: needsValue(c) ? (shown || '［未填］') : '' };
  }
  const clauseText = (c) => { const p = clauseParts(c); return [p.f, p.op, p.v].filter(Boolean).join(' '); };

  function findIn(categories, key) {
    const i = key.indexOf(':');
    const cat = categories[key.slice(0, i)];
    if (!cat) return null;
    const item = cat.items.find((it) => it.id === key.slice(i + 1));
    return item ? { cat, item } : null;
  }

  function condItem(u, isCustom) {
    const hit = findIn(M.categories, u.then);
    const t = hit ? hit.item : { label: '（找不到簽核人）', people: [] };
    return {
      id: u.id, custom: isCustom, label: u.name, sub: (isCustom ? '自訂｜' : '') + '→ ' + t.label,
      rule: { logic: u.logic, clauses: u.clauses.map(clauseParts), then: t.label, otherwise: u.otherwise },
      people: t.people, example: t.example
    };
  }

  function cats() {
    const out = Object.assign({}, M.categories);
    out.cond = Object.assign({}, M.categories.cond, {
      items: M.presets.map((u) => condItem(u, false)).concat(S.custom.map((u) => condItem(u, true)))
    });
    return out;
  }
  const find = (key) => findIn(cats(), key);

  // 條件式關卡實際由「符合時的簽核人」簽核，例外處理也套用在它身上
  function targetKey(key) {
    if (key.indexOf('cond:') !== 0) return key;
    const id = key.slice(5);
    const u = M.presets.concat(S.custom).find((x) => x.id === id);
    return u ? u.then : key;
  }
  const isSup = (key) => { const t = findIn(M.categories, targetKey(key)); return !!(t && t.cat.sup); };
  const ABSENT = {
    sup: [{ v: 'up', t: '往上一層找' }, { v: 'deputy', t: '改由職務代理人簽' }, { v: 'skip', t: '略過此關' }],
    other: [{ v: 'boss', t: '由該員工的主管簽' }, { v: 'deputy', t: '改由職務代理人簽' }, { v: 'skip', t: '略過此關' }]
  };
  const NOTFOUND = [{ v: 'top', t: '由最高主管簽' }, { v: 'skip', t: '略過此關' }, { v: 'block', t: '不准送出' }];
  function getSet(key) {
    const hit = find(key);
    const mode = hit && hit.item.seq ? 'seq' : (hit ? hit.cat.mode : 'all');
    return Object.assign({
      mode, timeout: '72', overdue: 'remind', allowReturn: true, allowAdd: false, skipSelf: true,
      who: { mgr: true, deputy: false }, absent: isSup(key) ? 'up' : 'boss', notfound: 'top', dedupe: true
    }, S.settings[key] || {});
  }
  const resolveStep = (key) => M.resolve(targetKey(key), getSet(key));

  // 整條流程的實際簽核人：再套用「申請人即簽核人」與「重複簽核人」兩條規則
  function flowResolve(steps) {
    const signed = new Map();
    return steps.map((st, i) => {
      const s = getSet(st.key);
      const r = resolveStep(st.key);
      let list = r.signers.slice();
      const notes = r.notes.slice();
      let skipped = r.skip;
      let reason = r.reason;
      if (!skipped && !r.block) {
        if (s.skipSelf && list.some((p) => p.id === M.applicant.id)) {
          list = list.filter((p) => p.id !== M.applicant.id);
          notes.push('簽核人與申請人相同，略過申請人');
        }
        if (s.dedupe) {
          const dup = list.filter((p) => signed.has(p.id));
          if (dup.length) {
            list = list.filter((p) => !signed.has(p.id));
            notes.push(dup.map((p) => p.name + '已在第 ' + signed.get(p.id) + ' 關簽核').join('、') + '，不重複簽核');
          }
        }
        if (!list.length) { skipped = true; reason = (notes[notes.length - 1] || '沒有簽核人') + '，自動略過此關'; }
        list.forEach((p) => { if (!signed.has(p.id)) signed.set(p.id, i + 1); });
      }
      return { list, notes, skipped, block: r.block, reason };
    });
  }

  // 例外處理有改過預設值時的摘要（卡片、總覽用）
  function excSummary(key) {
    const s = getSet(key);
    const out = [];
    if (isSup(key) && (s.who.deputy || !s.who.mgr)) out.push(s.who.mgr ? '副主管 → 主管' : '僅副主管');
    const def = isSup(key) ? 'up' : 'boss';
    if (s.absent !== def) out.push('不在職：' + (ABSENT[isSup(key) ? 'sup' : 'other'].find((o) => o.v === s.absent) || {}).t);
    if (s.notfound !== 'top') out.push('找不到：' + (NOTFOUND.find((o) => o.v === s.notfound) || {}).t);
    if (!s.dedupe) out.push('重複不略過');
    if (!s.skipSelf) out.push('申請人不略過');
    return out.join('｜');
  }
  function setSet(key, patch) { set({ saved: false, settings: Object.assign({}, S.settings, { [key]: Object.assign(getSet(key), patch) }) }); }
  function togglePick(key) {
    const has = S.picked.includes(key);
    set({ saved: false, picked: has ? S.picked.filter((k) => k !== key) : S.picked.concat(key) });
  }
  function summary(key) {
    const s = getSet(key);
    return MODE_TEXT[s.mode] + '｜' + (s.timeout === 'none' ? '不限期限' : s.timeout + ' 小時內');
  }
  // 流程版本：已在簽核中的單據沿用送出當時的版本，儲存修改後的流程會成為新版本
  const flowSig = () => JSON.stringify({ steps: S.picked.map((k) => [k, getSet(k)]), custom: S.custom.filter((u) => S.picked.includes('cond:' + u.id)) });
  const isDirty = () => S.version > 0 && flowSig() !== S.snapshot;
  const pickedSteps = () => S.picked.map((key) => Object.assign({ key }, find(key))).filter((x) => x.item);
  const condNote = (r) => r.clauses.map((c) => [c.f, c.op, c.v].filter(Boolean).join(' ')).join(r.logic === 'and' ? ' 且 ' : ' 或 ');
  const initial = (name) => esc(String(name).replace(/^欄位「/, '').charAt(0));

  /* ---------- 共用元件 ---------- */
  function seg(list, cur, act, tall) {
    return list.map((o) => '<button class="seg-btn' + (o.v === cur ? ' on' : '') + (tall ? ' tall' : '') + '" data-act="' + act + '" data-arg="' + esc(o.v) + '" aria-pressed="' + (o.v === cur) + '">'
      + '<span class="seg-t">' + esc(o.t) + '</span>' + (o.hint ? '<span class="seg-h">' + esc(o.hint) + '</span>' : '') + '</button>').join('');
  }
  const tag = (t) => '<span class="tag">' + esc(t) + '</span>';
  const iconBtn = (act, arg, label, icon, disabled) => '<button class="icon-btn" data-act="' + act + '" data-arg="' + esc(arg) + '" aria-label="' + esc(label) + '"' + (disabled ? ' disabled' : '') + '>' + svg(ICON[icon], 16, { sw: 2 }) + '</button>';

  /* ---------- 設定畫面 ---------- */
  function renderEdit() {
    const C = cats();
    const cur = C[S.tab];
    const steps = pickedSteps();
    const empty = steps.length === 0;
    const term = S.q.trim().toLowerCase();
    const matched = cur.items.filter((it) => !term || (it.label + it.sub).toLowerCase().includes(term));
    const LIMIT = 100;
    const options = matched.slice(0, LIMIT);

    const nav = NAV.map((k) => '<button class="nav-btn' + (k === S.tab ? ' on' : '') + '" data-act="tab" data-arg="' + k + '" aria-pressed="' + (k === S.tab) + '">'
      + svg(ICON[k], 20) + '<span>' + esc(C[k].name) + '</span></button>').join('');

    const rows = options.map((it) => {
      const key = S.tab + ':' + it.id;
      const added = S.picked.includes(key);
      const on = added || S.view === key;
      return '<div class="opt-row' + (on ? ' on' : '') + '">'
        + '<button class="opt-main" data-act="open" data-arg="' + esc(key) + '" aria-label="查看 ' + esc(it.label) + '">'
        + '<span class="avatar">' + initial(it.label) + '</span>'
        + '<span class="opt-text"><span class="opt-label">' + esc(it.label) + '</span><span class="opt-sub">' + esc(it.sub) + '</span></span>'
        + svg(ICON.chev, 16, { sw: 2 }) + '</button>'
        + (DIR[S.tab] ? iconBtn('editDir', key, '編輯' + DIR[S.tab].noun + '「' + it.label + '」', 'pencil') : '')
        + '<button class="pill-btn' + (added ? ' on' : '') + '" data-act="toggle" data-arg="' + esc(key) + '" aria-pressed="' + added + '">' + (added ? '已加入' : '加入') + '</button>'
        + '</div>';
    }).join('') + (matched.length > LIMIT ? '<p class="muted center">共 ' + matched.length + ' 筆，僅顯示前 ' + LIMIT + ' 筆，請輸入關鍵字縮小範圍</p>' : '')
      || '<p class="muted center">' + (S.q.trim() ? '找不到符合「' + esc(S.q) + '」的項目' : '目前沒有任何項目') + '</p>';

    const quick = ['org:1', 'head:self', 'role:fin', 'role:hr'].map((k) => find(k)).map((h, i) => h ? '<button class="chip-btn" data-act="toggle" data-arg="' + ['org:1', 'head:self', 'role:fin', 'role:hr'][i] + '" aria-label="加入 ' + esc(h.item.label) + '">' + svg(ICON.plus, 14, { sw: 2.4 }) + '<span>' + esc(h.item.label) + '</span></button>' : '').join('');

    const flow = empty
      ? '<div class="empty-box"><div class="empty-top">' + svg(ICON.plus, 28, { sw: 1.6 })
        + '<span>尚未加入簽核關卡<br>從左側選擇簽核來源</span><span class="note warn">至少需要一個關卡才能儲存流程</span></div>'
        + '<div class="empty-quick"><span class="quick-title">或快速加入常用關卡</span><div class="chips">' + quick + '</div></div></div>'
      : '<ol class="timeline">'
        + '<li class="tl-edge">' + '<span class="tl-dot">' + svg(ICON.dot, 12) + '</span><span class="muted">申請人送出表單</span></li>'
        + steps.map((st, i) => '<li class="tl-step" draggable="true" data-drag-index="' + i + '"><div class="tl-rail"><span class="tl-num">' + (i + 1) + '</span><span class="tl-line"></span></div>'
          + '<div class="tl-card' + (S.view === st.key ? ' on' : '') + '">'
          + '<span class="grip" title="拖曳調整順序" aria-hidden="true">' + svg(ICON.grip, 16) + '</span>'
          + '<button class="tl-open" data-act="open" data-arg="' + esc(st.key) + '" aria-label="查看第 ' + (i + 1) + ' 關設定">' + tag(st.cat.name)
          + '<span class="tl-label">' + esc(st.item.label) + '</span><span class="tl-sum">' + esc(summary(st.key)) + '</span>'
          + (excSummary(st.key) ? '<span class="tl-exc">' + esc(excSummary(st.key)) + '</span>' : '') + '</button>'
          + '<div class="tl-tools">' + iconBtn('up', i, '上移第 ' + (i + 1) + ' 關', 'up', i === 0) + iconBtn('down', i, '下移第 ' + (i + 1) + ' 關', 'down', i === steps.length - 1)
          + iconBtn('remove', st.key, '移除第 ' + (i + 1) + ' 關', 'close') + '</div>'
          + '</div></li>').join('')
        + '<li class="tl-edge"><span class="tl-dot done">' + svg(ICON.check, 16, { sw: 2.4 }) + '</span><span class="muted">簽核完成，結案歸檔</span></li></ol>';

    return '<header class="topbar"><div class="titles"><span class="crumb">表單管理 / ' + esc(M.formName) + '</span>'
      + '<div class="row wrap"><h1>設定簽核關卡</h1>' + (S.version ? '<span class="tag">目前生效：第 ' + S.version + ' 版</span>' : '') + '</div></div>'
      + '<div class="topbar-actions">'
      + (S.saved && !S.saveError ? '<span class="note ok" role="status">已儲存，共 ' + steps.length + ' 關</span>' : '')
      + (empty ? '<span class="note warn" role="status">請至少加入一個簽核關卡才能儲存</span>' : '')
      + (S.saveError && !empty ? '<span class="note error" role="alert">' + svg(ICON.alert, 16, { sw: 2 }) + '儲存失敗：' + esc(S.saveError) + '</span>' : '')
      + '<button class="btn btn-ghost" data-act="clear"' + (empty || S.saving ? ' disabled' : '') + '>清除全部</button>'
      + '<button class="btn btn-primary" data-act="save"' + (empty || S.saving ? ' disabled' : '') + (S.saving ? ' aria-busy="true"' : '') + '>'
      + (S.saving ? '<span class="spinner sm" aria-hidden="true"></span>儲存中…' : (S.saveError ? '重新儲存' : '儲存流程')) + '</button></div></header>'
      + '<div class="layout"><nav class="nav" aria-label="簽核來源"><div class="navlist">' + nav + '</div></nav>'
      + '<div class="main">'
      + '<section class="panel"><div class="panel-head"><h2>' + esc(cur.name) + '</h2><p class="muted">' + esc(cur.desc) + '</p></div>'
      + '<label class="search">' + svg(ICON.search, 18, { sw: 2 }) + '<span class="sr">搜尋</span><input type="search" data-input="q" data-key="q" value="' + esc(S.q) + '" placeholder="' + esc(cur.placeholder) + '"></label>'
      + (S.tab === 'cond' ? '<button class="add-cond" data-act="newCond">' + svg(ICON.plus, 18, { sw: 2 }) + '<span>新增自訂條件</span></button>' : '')
      + (DIR[S.tab] ? '<button class="add-cond" data-act="newDir" data-arg="' + S.tab + '">' + svg(ICON.plus, 18, { sw: 2 }) + '<span>新增' + DIR[S.tab].noun + '</span></button>' : '')
      + '<div class="opt-list">' + rows + '</div></section>'
      + '<aside class="flow" aria-label="簽核流程"><div class="flow-head"><h2>簽核流程</h2>'
      + (empty ? '' : '<span class="muted">共 ' + steps.length + ' 關｜點選關卡查看設定</span>') + '</div>'
      + (isDirty() ? '<div class="version-note" role="status">' + svg(ICON.swap, 16, { sw: 2 }) + '<span>流程已修改，儲存後會成為<strong>第 ' + (S.version + 1) + ' 版</strong>。'
        + (M.sample.inProgressCount ? '簽核中的 ' + M.sample.inProgressCount + ' 張' + esc(M.formName) + '仍依第 ' + S.version + ' 版完成。' : '目前沒有簽核中的單據，儲存後新送出的' + esc(M.formName) + '會直接套用新版本。') + '</span></div>' : '')
      + flow + '</aside>'
      + '</div></div>'
      + (S.view ? renderDrawer() : '')
      + (S.editor ? renderEditor() : '')
      + (S.member ? renderMemberEditor() : '')
      + (S.confirm ? renderConfirm() : '');
  }

  /* ---------- 確認對話框 ---------- */
  function renderConfirm() {
    const c = S.confirm;
    const info = c.tone === 'info';
    return '<div class="modal-wrap"><button class="scrim" data-act="confirmCancel" aria-label="取消"></button>'
      + '<div class="modal" role="alertdialog" aria-modal="true" aria-labelledby="cf-title" aria-describedby="cf-desc">'
      + '<div class="modal-icon' + (info ? ' info' : '') + '">' + svg(info ? ICON.swap : ICON.alert, 22, { sw: 2 }) + '</div>'
      + '<h2 id="cf-title">' + esc(c.title) + '</h2><p id="cf-desc">' + esc(c.message) + '</p>'
      + '<div class="modal-foot"><button class="btn btn-outline" data-act="confirmCancel" data-key="cf-cancel">取消</button>'
      + '<button class="btn ' + (info ? 'btn-primary' : 'btn-danger-solid') + '" data-act="confirmOk">' + esc(c.ok) + '</button></div></div></div>';
  }
  function ask(c) { set({ confirm: c }); }
  function askRemove(key, closeView) {
    const hit = find(key);
    const n = S.picked.indexOf(key) + 1;
    ask({ title: '移除第 ' + n + ' 關？', message: '「' + (hit ? hit.item.label : '') + '」和它的簽核設定會從流程中移除。', ok: '移除', act: 'remove', arg: key, closeView });
  }

  /* ---------- 載入中、載入失敗 ---------- */
  function renderLoading() {
    const bar = (w) => '<span class="skeleton" style="width:' + w + '"></span>';
    return '<header class="topbar"><div class="titles">' + bar('120px') + bar('180px') + '</div></header>'
      + '<div class="layout"><nav class="nav" aria-hidden="true"><div class="navlist">' + Array(8).fill('<span class="skeleton dark"></span>').join('') + '</div></nav>'
      + '<div class="main"><section class="panel state-center" role="status" aria-live="polite">'
      + '<span class="spinner" aria-hidden="true"></span><strong>正在載入組織資料…</strong><span class="muted sm">員工、部門與簽核角色載入後即可開始設定</span></section>'
      + '<aside class="flow" aria-hidden="true">' + bar('80px') + '<span class="skeleton block"></span></aside></div></div>';
  }
  function renderLoadError(message) {
    return '<div class="state-page"><div class="state-card" role="alert">'
      + '<span class="state-icon">' + svg(ICON.alert, 28, { sw: 2 }) + '</span>'
      + '<h1>無法載入組織資料</h1><p>' + esc(message) + '</p>'
      + '<p class="muted sm">請確認網路連線後重新載入；若持續發生，請聯絡系統管理員。</p>'
      + '<button class="btn btn-primary" data-act="reload">重新載入</button></div></div>';
  }

  /* ---------- 關卡詳細面板 ---------- */
  function renderDrawer() {
    const hit = find(S.view);
    if (!hit) return '';
    const { cat, item } = hit;
    const s = getSet(S.view);
    const idx = S.picked.indexOf(S.view);
    const r = item.rule;
    // 依申請人決定的來源：設定時不知道申請人，只顯示規則，不列出人名
    const tHit = findIn(M.categories, targetKey(S.view));
    const dyn = !!(tHit && tHit.item.example);
    const res = resolveStep(S.view);
    const total = res.signers.length;
    const sup = isSup(S.view);
    const cov = M.coverage(targetKey(S.view), s);
    const modes = [{ v: 'any', t: '任一人簽核', hint: '一人同意即通過' }, item.seq ? { v: 'seq', t: '依序簽核', hint: '由下而上逐級' } : { v: 'all', t: '全部簽核', hint: '所有人都需同意' }];

    const rule = r ? '<div class="block"><div class="block-head"><h3>觸發條件</h3>'
      + (item.custom ? '<button class="btn btn-outline sm" data-act="editCond" data-arg="' + esc(item.id) + '">' + svg(ICON.pencil, 14, { sw: 2 }) + '<span>編輯條件</span></button>' : '') + '</div>'
      + '<div class="rule-box">' + r.clauses.map((c, i) => '<div class="rule-line"><span class="rule-join">' + (i === 0 ? '當' : (r.logic === 'and' ? '且' : '或')) + '</span>'
        + '<span class="rule-chip">' + esc(c.f) + '</span><strong>' + esc(c.op) + '</strong>' + (c.v ? '<span class="rule-chip">' + esc(c.v) + '</span>' : '') + '</div>').join('')
      + '<div class="rule-then">時，由 <strong>' + esc(r.then) + '</strong> 簽核</div></div>'
      + '<p class="muted sm">' + (r.otherwise === 'direct' ? '不符合條件時改由直屬主管簽核' : '不符合條件時自動略過此關卡') + '</p></div>' : '';

    const people = dyn ? '' : ((total
      ? '<ul class="people-list">' + res.signers.map((m) => '<li><span class="avatar sm">' + initial(m.name) + '</span><span class="opt-text"><span>' + esc(m.name)
        + (m.role === '副主管' ? ' ' + tag('副主管') : '') + '</span><span class="opt-sub">' + esc(m.title) + '</span>'
        + (m.note ? '<span class="exc-line">' + esc(m.note) + '</span>' : '') + '</span></li>').join('') + '</ul>'
      : '')
      + (res.skip || res.block ? '<div class="exc-box warn">' + svg(ICON.alert, 16, { sw: 2 }) + '<span>' + esc(res.reason) + '</span></div>' : '')
      + (res.notes.length && !res.skip && !res.block ? '<ul class="exc-notes">' + res.notes.map((n) => '<li>' + esc(n) + '</li>').join('') + '</ul>' : '')
      + (!total && !res.skip && !res.block ? '<p class="muted">目前沒有符合的人員，請確認組織資料。</p>' : ''));

    const check = (k, label) => '<label class="check-row"><input type="checkbox" data-change="perm" data-arg="' + k + '"' + (s[k] ? ' checked' : '') + '><span>' + label + '</span></label>';

    return '<div class="overlay"><button class="scrim" data-act="closeView" aria-label="關閉詳細資訊"></button>'
      + '<div class="drawer" role="dialog" aria-label="' + esc(item.label) + ' 設定">'
      + '<div class="drawer-head"><div class="titles"><div class="row">' + tag(cat.name) + (idx >= 0 ? '<span class="muted sm">第 ' + (idx + 1) + ' 關</span>' : '') + '</div>'
      + '<h2>' + esc(item.label) + '</h2><p class="muted">' + esc(item.sub) + '</p></div>' + iconBtn('closeView', '', '關閉', 'close') + '</div>'
      + '<div class="drawer-body">' + rule
      + (sup ? '<div class="block"><h3>簽核對象</h3><div class="row wrap">'
        + '<label class="check-row"><input type="checkbox" data-change="who" data-arg="mgr"' + (s.who.mgr ? ' checked' : '') + '><span>主管</span></label>'
        + '<label class="check-row"><input type="checkbox" data-change="who" data-arg="deputy"' + (s.who.deputy ? ' checked' : '') + '><span>副主管</span></label></div>'
        + '<span class="muted sm">至少勾選一項。兩者都勾時，同一層依副主管 → 主管順序簽核；只勾副主管但該層沒有副主管時，改由同層主管簽。</span>'
        + (S.whoErr ? '<span class="error" role="alert">主管、副主管至少要勾選一項</span>' : '') + '</div>' : '')
      // 依申請人決定的來源不顯示「簽核人員」：設定時不知道申請人，規則寫在規格文件
      + (dyn ? '' : '<div class="block"><div class="block-head"><div class="row"><h3>簽核人員</h3><span class="muted sm">' + esc('共 ' + total + ' 位' + (res.excluded ? '（已排除不在職 ' + res.excluded + ' 位）' : '')) + '</span></div>'
      + (DIR[S.view.split(':')[0]] ? '<button class="btn btn-outline sm" data-act="editDir" data-arg="' + esc(S.view) + '">' + svg(ICON.pencil, 14, { sw: 2 }) + '<span>編輯' + DIR[S.view.split(':')[0]].noun + '</span></button>' : '')
      + '</div>' + people + '</div>')
      + '<div class="block"><h3>簽核方式</h3><div class="seg cols-2">' + seg(modes, s.mode, 'mode', true) + '</div></div>'
      + '<div class="block"><h3>簽核期限</h3><div class="seg cols-4">' + seg([{ v: 'none', t: '不限' }, { v: '24', t: '24 小時' }, { v: '48', t: '48 小時' }, { v: '72', t: '72 小時' }], s.timeout, 'timeout') + '</div>'
      + (s.timeout !== 'none' ? '<span class="muted sm">逾期未簽時</span><div class="seg cols-3">' + seg([{ v: 'remind', t: '再次提醒' }, { v: 'pass', t: '自動同意' }, { v: 'up', t: '轉呈上一層' }], s.overdue, 'overdue') + '</div>' : '') + '</div>'
      + '<div class="block"><h3>例外處理</h3>'
      + '<span class="muted sm">簽核人不在職時（離職、留職停薪、職位空缺；輪到這一關時判斷）</span>'
      + '<div class="seg cols-3">' + seg(ABSENT[sup ? 'sup' : 'other'], s.absent, 'absent') + '</div>'
      + (sup ? '' : '<span class="muted sm">多位簽核人時，部分不在職由其他在職人員簽，全部不在職才套用此設定。</span>')
      + '<span class="muted sm">找不到簽核人時（例如組織沒有該層級）</span>'
      + '<div class="seg cols-3">' + seg(NOTFOUND, s.notfound, 'notfound') + '</div>'
      + (cov ? '<div class="exc-box">' + svg(ICON.alert, 16, { sw: 2 }) + '<span>' + cov.count + ' 位員工（' + esc(cov.depts.join('、')) + '）會找不到簽核人，將依此設定處理。</span></div>' : '')
      + check('dedupe', '簽核人重複時自動略過（前面關卡已簽過的人不再簽）')
      + check('skipSelf', '簽核人與申請人相同時自動略過') + '</div>'
      + '<div class="block"><h3>其他權限</h3>' + check('allowReturn', '允許退回申請人') + check('allowAdd', '允許加簽其他人員') + '</div>'
      + '</div><div class="drawer-foot">'
      + (idx >= 0
        ? '<button class="btn btn-danger" data-act="pickAndClose">移除此關卡</button><button class="btn btn-primary" data-act="closeView">完成</button>'
        : '<button class="btn btn-outline" data-act="closeView">關閉</button><button class="btn btn-primary" data-act="pickAndClose">加入為第 ' + (S.picked.length + 1) + ' 關</button>')
      + '</div></div></div>';
  }

  /* ---------- 自訂條件編輯器 ---------- */
  function approverOptions(selected) {
    const C = M.categories;
    return ['org', 'head', 'role', 'rel'].map((k) => '<optgroup label="' + esc(C[k].name) + '">'
      + C[k].items.map((it) => { const v = k + ':' + it.id; return '<option value="' + esc(v) + '"' + (v === selected ? ' selected' : '') + '>' + esc(it.label) + '</option>'; }).join('')
      + '</optgroup>').join('');
  }
  const optionList = (list, cur) => list.map((o) => '<option value="' + esc(o) + '"' + (o === cur ? ' selected' : '') + '>' + esc(o) + '</option>').join('');
  const edValid = (ed) => ed.clauses.every((c) => !needsValue(c) || String(c.value).trim() !== '');

  function renderEditor() {
    const ed = S.editor;
    const join = ed.logic === 'and' ? '且' : '或';
    const thenHit = findIn(M.categories, ed.then);
    const preview = '當 ' + ed.clauses.map(clauseText).join(' ' + join + ' ') + ' 時，由「' + (thenHit ? thenHit.item.label : '') + '」簽核；不符合時' + (ed.otherwise === 'direct' ? '改由直屬主管簽核。' : '略過此關卡。');

    const clauses = ed.clauses.map((c, i) => {
      const f = field(c.field);
      const bad = S.tried && needsValue(c) && !String(c.value).trim();
      let value;
      if (!needsValue(c)) value = '<span class="muted sm grow">不需填值</span>';
      else if (f.type === 'enum' || f.type === 'rank') value = '<select class="select grow" aria-label="值" data-change="edValue" data-arg="' + i + '">' + optionList(f.options, c.value) + '</select>';
      else if (f.type === 'num') value = '<span class="grow row"><input class="input grow" type="number" aria-label="數值" data-input="edValue" data-arg="' + i + '" data-key="ed-v-' + i + '" value="' + esc(c.value) + '" placeholder="輸入數值">' + (f.unit ? '<span class="muted sm">' + esc(f.unit) + '</span>' : '') + '</span>';
      else value = '<input class="input grow" type="text" aria-label="文字" data-input="edValue" data-arg="' + i + '" data-key="ed-v-' + i + '" value="' + esc(c.value) + '" placeholder="輸入文字">';
      return '<div class="clause' + (bad ? ' bad' : '') + '"><span class="clause-join">' + (i === 0 ? '當' : join) + '</span>'
        + '<select class="select f-field" aria-label="欄位" data-change="edField" data-arg="' + i + '">' + M.fields.map((x) => '<option value="' + esc(x.key) + '"' + (x.key === c.field ? ' selected' : '') + '>' + esc(x.label) + '</option>').join('') + '</select>'
        + '<select class="select f-op" aria-label="比較方式" data-change="edOp" data-arg="' + i + '">' + optionList(OPS[f.type], c.op) + '</select>'
        + value + iconBtn('edRemove', i, '刪除此條件', 'trash', ed.clauses.length === 1) + '</div>';
    }).join('');

    return '<div class="overlay top"><button class="scrim" data-act="edCancel" aria-label="取消編輯"></button>'
      + '<div class="drawer wide" role="dialog" aria-label="' + (ed.id ? '編輯自訂條件' : '新增自訂條件') + '">'
      + '<div class="drawer-head"><div class="titles">' + tag('條件式') + '<h2>' + (ed.id ? '編輯自訂條件' : '新增自訂條件') + '</h2><p class="muted">設定觸發條件，以及符合時由誰簽核</p></div>' + iconBtn('edCancel', '', '關閉', 'close') + '</div>'
      + '<div class="drawer-body">'
      + '<label class="block"><h3>條件名稱</h3><input class="input" type="text" data-input="edName" data-key="ed-name" value="' + esc(ed.name) + '" placeholder="例如：高額差旅費用（留空則自動產生）"></label>'
      + '<div class="block"><h3>觸發條件</h3><span class="muted sm">多個條件時</span><div class="seg cols-2">'
      + seg([{ v: 'and', t: '全部符合', hint: '條件之間為「且」' }, { v: 'or', t: '任一符合', hint: '條件之間為「或」' }], ed.logic, 'edLogic', true) + '</div>'
      + '<div class="clauses">' + clauses + '</div>'
      + (ed.clauses.length < 5 ? '<button class="btn btn-link" data-act="edAdd">' + svg(ICON.plus, 16, { sw: 2 }) + '<span>新增條件</span></button>' : '') + '</div>'
      + '<label class="block"><h3>符合時由誰簽核</h3><select class="select" data-change="edThen">' + approverOptions(ed.then) + '</select></label>'
      + '<div class="block"><h3>不符合時</h3><div class="seg cols-2">' + seg([{ v: 'skip', t: '略過此關卡' }, { v: 'direct', t: '改由直屬主管簽核' }], ed.otherwise, 'edElse') + '</div></div>'
      + '<div class="preview-box"><span class="preview-title">規則預覽</span><p>' + esc(preview) + '</p></div>'
      + '</div><div class="drawer-foot spread"><div class="row">'
      + (ed.id ? '<button class="btn btn-danger" data-act="edDelete">刪除此條件</button>' : '')
      + (S.tried && !edValid(ed) ? '<span class="error" role="alert">請填寫每個條件的值</span>' : '') + '</div>'
      + '<div class="row"><button class="btn btn-outline" data-act="edCancel">取消</button><button class="btn btn-primary" data-act="edSave">' + (ed.id ? '儲存變更' : '儲存並加入流程') + '</button></div>'
      + '</div></div></div>';
  }

  /* ---------- 員工群組、簽核角色編輯器 ---------- */
  // 刪除或修改某個群組／角色時，流程中會受影響的關卡（直接使用它，或預設條件指向它）
  function stepsUsing(key) {
    return S.picked.filter((k) => k === key || (k.indexOf('cond:') === 0 && M.presets.some((p) => 'cond:' + p.id === k && p.then === key)));
  }
  function dirProblems(mb) {
    const name = mb.name.trim();
    const dup = (M.raw[DIR[mb.kind].list] || []).some((x) => x.id !== mb.id && x.name === name);
    return { name: !name ? '請輸入' + DIR[mb.kind].noun + '名稱' : dup ? '已有同名的' + DIR[mb.kind].noun + '，請換一個名稱' : '', members: mb.memberIds.length ? '' : '至少選擇 1 位成員' };
  }

  function renderMemberEditor() {
    const mb = S.member;
    const d = DIR[mb.kind];
    const catName = M.categories[mb.kind].name;
    const bad = dirProblems(mb);
    const emps = M.categories.emp.items;
    const byId = new Map(emps.map((e) => [e.id, e]));
    const term = mb.q.trim().toLowerCase();
    const matched = emps.filter((e) => !term || (e.label + e.sub).toLowerCase().includes(term));
    const LIMIT = 50;
    const used = mb.id ? stepsUsing(mb.kind + ':' + mb.id).map((k) => S.picked.indexOf(k) + 1) : [];

    const chosen = mb.memberIds.length
      ? '<div class="chips">' + mb.memberIds.map((id) => byId.get(id)).filter(Boolean).map((e) => '<span class="person-chip"><span class="avatar xs">' + initial(e.label) + '</span><span class="pc-name">' + esc(e.label) + '</span>'
        + '<button class="chip-x" data-act="mbToggle" data-arg="' + esc(e.id) + '" aria-label="移除 ' + esc(e.label) + '">' + svg(ICON.close, 14, { sw: 2.2 }) + '</button></span>').join('') + '</div>'
      : '<p class="muted sm">尚未選擇成員，請從下方名單勾選</p>';

    const list = matched.slice(0, LIMIT).map((e) => {
      const on = mb.memberIds.includes(e.id);
      return '<li class="' + (on ? 'on' : '') + '"><label class="check-row grow"><input type="checkbox" data-change="mbPick" data-arg="' + esc(e.id) + '" data-key="mb-c-' + esc(e.id) + '"' + (on ? ' checked' : '') + '>'
        + '<span class="avatar sm">' + initial(e.label) + '</span><span class="opt-text"><span>' + esc(e.label) + '</span><span class="opt-sub">' + esc(e.sub) + '</span></span></label></li>';
    }).join('') || '<li><span class="muted sm">找不到符合「' + esc(mb.q) + '」的員工</span></li>';

    return '<div class="overlay top"><button class="scrim" data-act="mbCancel" aria-label="取消編輯"></button>'
      + '<div class="drawer wide" role="dialog" aria-label="' + (mb.id ? '編輯' : '新增') + d.noun + '">'
      + '<div class="drawer-head"><div class="titles">' + tag(catName) + '<h2>' + (mb.id ? '編輯' : '新增') + d.noun + '</h2><p class="muted">' + esc(d.hint) + '</p></div>' + iconBtn('mbCancel', '', '關閉', 'close') + '</div>'
      + '<div class="drawer-body">'
      + (used.length ? '<div class="version-note" role="status">' + svg(ICON.swap, 16, { sw: 2 }) + '<span>流程的第 ' + used.join('、') + ' 關使用這個' + d.noun + '，儲存後該關卡的簽核人會一起更新。</span></div>' : '')
      + '<label class="block"><h3>' + d.noun + '名稱</h3><input class="input' + (mb.tried && bad.name ? ' bad' : '') + '" type="text" data-input="mbName" data-key="mb-name" value="' + esc(mb.name) + '" placeholder="輸入' + d.noun + '名稱">'
      + (mb.tried && bad.name ? '<span class="error" role="alert">' + bad.name + '</span>' : '') + '</label>'
      + (mb.kind === 'role' ? '<label class="block"><h3>所屬部門</h3><select class="select" data-change="mbDept"><option value="">不限部門</option>'
        + M.raw.departments.map((x) => '<option value="' + esc(x.id) + '"' + (x.id === mb.deptId ? ' selected' : '') + '>' + esc(x.name) + '</option>').join('') + '</select></label>' : '')
      + '<div class="block"><div class="block-head"><h3>已選成員</h3><span class="muted sm">共 ' + mb.memberIds.length + ' 位</span></div>' + chosen
      + (mb.tried && bad.members ? '<span class="error" role="alert">' + bad.members + '</span>' : '') + '</div>'
      + '<div class="block"><h3>加入成員</h3>'
      + '<label class="search">' + svg(ICON.search, 18, { sw: 2 }) + '<span class="sr">搜尋員工</span><input type="search" data-input="mbQ" data-key="mb-q" value="' + esc(mb.q) + '" placeholder="搜尋姓名、員編或部門"></label>'
      + '<ul class="people-list pick-list">' + list + '</ul>'
      + (matched.length > LIMIT ? '<p class="muted sm">共 ' + matched.length + ' 位，僅列出前 ' + LIMIT + ' 位，請輸入關鍵字縮小範圍</p>' : '') + '</div>'
      + '</div><div class="drawer-foot spread"><div class="row">'
      + (mb.id ? '<button class="btn btn-danger" data-act="mbDelete"' + (mb.saving ? ' disabled' : '') + '>刪除此' + d.noun + '</button>' : '')
      + (mb.error ? '<span class="error" role="alert">儲存失敗：' + esc(mb.error) + '</span>' : '') + '</div>'
      + '<div class="row"><button class="btn btn-outline" data-act="mbCancel">取消</button>'
      + '<button class="btn btn-primary" data-act="mbSave"' + (mb.saving ? ' disabled aria-busy="true"' : '') + '>' + (mb.saving ? '<span class="spinner sm" aria-hidden="true"></span>儲存中…' : (mb.id ? '儲存變更' : '建立' + d.noun)) + '</button></div>'
      + '</div></div></div>';
  }

  function patchMb(p) { set({ member: Object.assign({}, S.member, p) }); }

  // 名單改變後重新整理組織模型；找不到的關卡（例如預設條件指向已刪除的角色）一併移出流程
  function applyDirectory(kind, list) {
    M.raw[DIR[kind].list] = list;
    M = window.OrgModel.build(M.raw);
    const C = cats();
    const ok = (k) => !!findIn(C, k);
    return { picked: S.picked.filter(ok), view: S.view && ok(S.view) ? S.view : null };
  }

  async function saveMember() {
    const mb = S.member;
    const bad = dirProblems(mb);
    if (bad.name || bad.members) { patchMb({ tried: true }); return; }
    const rec = { id: mb.id || DIR[mb.kind].prefix + Date.now(), name: mb.name.trim(), memberIds: mb.memberIds.slice() };
    if (mb.kind === 'role' && mb.deptId) rec.deptId = mb.deptId;
    const cur = M.raw[DIR[mb.kind].list] || [];
    const list = mb.id ? cur.map((x) => (x.id === mb.id ? rec : x)) : cur.concat(rec);
    patchMb({ saving: true, error: '' });
    let res;
    try { res = await window.DataSource.saveDirectory(DIR[mb.kind].list, list); } catch (e) { res = { ok: false, message: e.message }; }
    if (!res || !res.ok) { patchMb({ saving: false, error: (res && res.message) || '請稍後再試。' }); return; }
    set(Object.assign(applyDirectory(mb.kind, list), { member: null, tab: mb.kind, q: '' }));
  }

  async function deleteMember(kind, id) {
    const list = (M.raw[DIR[kind].list] || []).filter((x) => x.id !== id);
    let res;
    try { res = await window.DataSource.saveDirectory(DIR[kind].list, list); } catch (e) { res = { ok: false, message: e.message }; }
    if (!res || !res.ok) { patchMb({ error: (res && res.message) || '請稍後再試。' }); return; }
    const key = kind + ':' + id;
    const settings = Object.assign({}, S.settings);
    delete settings[key];
    const next = applyDirectory(kind, list);
    set(Object.assign(next, { member: null, settings, saved: next.picked.length === S.picked.length ? S.saved : false }));
  }

  /* ---------- 簽核狀態計算（總覽與完整畫面共用） ---------- */
  function scenarioStatus(sc, n) {
    const cur = Math.min(1, n - 1);
    return (i) => sc === 'pending' ? (i === 0 ? 'current' : 'waiting')
      : sc === 'progress' ? (i < cur ? 'done' : (i === cur ? 'current' : 'waiting'))
        : 'done';
  }
  const SCENARIOS = [
    { v: 'pending', t: '未簽核', d: '剛送出，等待第 1 關', badge: ['待簽核', 'warn'] },
    { v: 'progress', t: '簽核中', d: '部分關卡已核准', badge: ['簽核中', 'info'] },
    { v: 'done', t: '簽核完成', d: '所有關卡已核准', badge: ['已核准', 'ok'] }
  ];
  const STATUS_TEXT = { done: '已核准', current: '簽核中', waiting: '未簽核', skipped: '已略過' };
  // 自動略過的關卡不參與進度計算；其餘關卡依情境決定狀態
  function flowStatus(steps, sc) {
    const fr = flowResolve(steps);
    const ord = [];
    let k = 0;
    fr.forEach((f, i) => { ord[i] = f.skipped ? -1 : k++; });
    const base = scenarioStatus(sc, k);
    return { fr, active: k, statusOf: (i) => (ord[i] < 0 ? 'skipped' : base(ord[i])) };
  }

  /* ---------- 儲存後總覽 ---------- */
  function renderDone() {
    const steps = pickedSteps();
    const n = steps.length;
    const sc = S.preview;
    const fs = flowStatus(steps, sc);
    const statusOf = fs.statusOf;
    const na = fs.active;
    let hours = 0; let unlimited = false;
    steps.forEach((st) => { const s = getSet(st.key); if (s.timeout === 'none') unlimited = true; else hours += Number(s.timeout); });
    const condCount = steps.filter((st) => st.item.rule).length;
    const doneCount = steps.filter((_, i) => statusOf(i) === 'done').length;
    const cur = Math.min(1, na - 1);
    const hint = { pending: '表單送出後，等待第 1 關簽核', progress: na > 1 ? '已完成前 ' + cur + ' 關，下一關簽核中' : '第 1 關簽核中', done: '所有關卡皆已核准，簽核完成' }[sc];

    // 簽核流程設定：預設顯示目前版本，可切換查看舊版本（唯讀）
    const current = S.history.find((h) => h.version === S.version);
    const viewing = S.history.find((h) => h.version === S.viewVersion) || current;
    const isOld = viewing && viewing.version !== S.version;
    const newer = isOld ? S.history.find((h) => h.version === viewing.version + 1) : null;
    const setupRows = (viewing ? viewing.rows : snapshotRows(steps)).map((r) => {
      const chips = r.dynamic
        ? '<span class="dyn-chip">' + svg(ICON.swap, 14, { sw: 2 }) + '依申請人動態帶入</span>'
        : r.people.map((m) => '<span class="person-chip"><span class="avatar xs">' + initial(m.name) + '</span><span class="pc-name">' + esc(m.name) + '</span><span class="opt-sub">' + esc(m.title) + '</span></span>').join('')
          + (r.more ? '<span class="muted sm">另 ' + r.more + ' 人</span>' : '');
      return '<li class="setup-row"><div class="setup-step"><span class="num-badge">' + r.num + '</span><div class="titles"><strong>' + esc(r.label) + '</strong><div class="row">' + tag(r.type) + '<span class="muted sm">' + esc(r.sub) + '</span></div></div></div>'
        + '<div class="setup-col wide"><span class="muted sm">簽核人</span><div class="chips">' + chips + '</div></div>'
        + '<div class="setup-col"><span class="muted sm">簽核方式</span><span>' + esc(r.summary) + '</span>' + (r.cond ? '<span class="cond-note">當 ' + esc(r.cond) + ' 時簽核</span>' : '')
        + (r.exc ? '<span class="exc-line">例外處理：' + esc(r.exc) + '</span>' : '') + '</div></li>';
    }).join('');
    const versionItems = S.history.slice().reverse().map((h) => {
      const on = viewing && h.version === viewing.version;
      const cur = h.version === S.version;
      return '<li><button class="ver-item' + (on ? ' on' : '') + '" role="option" aria-selected="' + !!on + '" data-act="viewVersion" data-arg="' + h.version + '">'
        + '<span class="ver-check" aria-hidden="true">' + (on ? svg(ICON.check, 16, { sw: 2.4 }) : '') + '</span>'
        + '<span class="ver-main"><strong>第 ' + h.version + ' 版</strong><span class="ver-time">' + esc(h.savedAt) + ' 更新</span></span>'
        + '<span class="ver-badge ' + (cur ? 'cur' : 'old') + '">' + (cur ? '目前生效' : '已失效') + '</span></button></li>';
    }).join('');
    const versionMenu = '<div class="ver-menu">'
      + '<button class="ver-trigger" data-act="toggleVer" aria-haspopup="listbox" aria-expanded="' + !!S.verOpen + '">'
      + '<span class="ver-main"><span class="ver-time">查看版本</span><strong>第 ' + (viewing ? viewing.version : '') + ' 版' + (isOld ? '（已失效）' : '（目前生效）') + '</strong></span>'
      + svg(ICON.down, 16, { sw: 2 }) + '</button>'
      + (S.verOpen ? '<button class="ver-scrim" data-act="toggleVer" aria-label="關閉版本選單" tabindex="-1"></button><ul class="ver-pop" role="listbox" aria-label="選擇版本">' + versionItems + '</ul>' : '')
      + '</div>';
    const setupHead = '<div class="card-head row-head"><div class="titles"><div class="row wrap"><h2>簽核流程設定</h2>'
      + (viewing ? '<span class="tag' + (isOld ? ' old' : '') + '">第 ' + viewing.version + ' 版' + (isOld ? '（舊版本）' : '・目前生效') + '</span>' : '') + '</div>'
      + '<span class="muted">表單送出後，依序由以下人員簽核</span></div>'
      + (S.history.length > 1 ? versionMenu : '') + '</div>'
      + (isOld ? '<div class="version-note old" role="status">' + svg(ICON.alert, 16, { sw: 2 }) + '<span>你正在查看<strong>第 ' + viewing.version + ' 版</strong>（' + esc(viewing.savedAt) + ' 更新'
        + (newer ? '，' + esc(newer.savedAt) + ' 起失效，改用第 ' + newer.version + ' 版' : '') + '）。新送出的' + esc(M.formName) + '不會再使用此版本；送出時套用此版本、仍在簽核中的表單會依此版本完成。'
        + '</span><button class="btn btn-link sm" data-act="viewVersion" data-arg="' + S.version + '">回到目前版本</button></div>' : '');

    const line = (solid, done) => '<span class="st-line' + (solid ? '' : ' dashed') + (done ? ' done' : '') + '"></span>';
    const stepper = '<div class="stepper-wrap"><ol class="stepper">'
      + '<li class="st-edge"><div class="st-track"><span class="st-fill"></span><span class="st-node done">' + svg(ICON.dot, 12) + '</span>' + line(true, true) + '</div><span class="st-edge-label">申請人送出</span></li>'
      + steps.map((st, i) => {
        const status = statusOf(i);
        const f = fs.fr[i];
        const passed = status === 'done' || status === 'current' || (status === 'skipped' && i > 0 && statusOf(i - 1) === 'done');
        const node = status === 'done' ? svg(ICON.check, 18, { sw: 2.6 }) : status === 'current' ? svg(ICON.clock, 18, { sw: 2.2 }) : status === 'skipped' ? svg(ICON.swap, 16, { sw: 2.2 }) : '<span>' + (i + 1) + '</span>';
        const names = f.list.slice(0, 2).map((m) => m.name).join('、') + (f.list.length > 2 ? ' 等 ' + f.list.length + ' 人' : '');
        return '<li class="st-step"><div class="st-track">' + line(status !== 'waiting', passed)
          + '<span class="st-node ' + status + '">' + node + '</span>' + line(status === 'done' || (status === 'skipped' && passed), status === 'done' || (status === 'skipped' && passed)) + '</div>'
          + '<div class="st-card ' + status + '"><div class="row"><span class="muted sm">第 ' + (i + 1) + ' 關</span>' + tag(st.cat.name) + '</div>'
          + '<strong class="st-label">' + esc(st.item.label) + '</strong>'
          + '<span class="muted sm">' + esc(status === 'skipped' ? '自動略過' : names) + '</span>'
          + '<div class="st-foot ' + status + '"><span class="st-foot-dot"></span>' + (status === 'current' ? '簽核中，等待簽核人處理' : status === 'done' ? '已核准' : status === 'skipped' ? '已略過' : '尚未開始') + '</div></div></li>';
      }).join('')
      + '<li class="st-edge"><div class="st-track">' + line(sc === 'done', sc === 'done') + '<span class="st-node ' + (sc === 'done' ? 'done' : 'waiting') + '">' + svg(ICON.flag, 18, { sw: 2.4 }) + '</span><span class="st-fill"></span></div><span class="st-edge-label">簽核完成</span></li>'
      + '</ol></div>';

    return '<header class="topbar"><div class="titles"><span class="crumb">表單管理 / ' + esc(M.formName) + '</span><h1>簽核流程總覽</h1></div>'
      + '<button class="btn btn-outline" data-act="back">' + svg(ICON.pencil, 16, { sw: 2 }) + '<span>返回編輯</span></button></header>'
      + '<main class="container">'
      + '<div class="banner ok" role="status"><span class="banner-icon">' + svg(ICON.check, 20, { sw: 2.6 }) + '</span><div class="titles">'
      + '<strong>簽核流程已儲存為第 ' + S.version + ' 版</strong>'
      + '<span>共 ' + n + ' 關，將套用於之後送出的' + esc(M.formName) + '。'
      + (S.prevVersion && M.sample.inProgressCount ? '已在簽核中的 ' + M.sample.inProgressCount + ' 張仍依第 ' + S.prevVersion + ' 版流程完成。' : '') + '</span></div></div>'
      + '<div class="stats"><div class="stat"><span class="muted sm">簽核關卡</span><strong>' + n + ' 關</strong></div><div class="stat"><span class="muted sm">條件式關卡</span><strong>' + condCount + ' 關</strong></div><div class="stat"><span class="muted sm">最長簽核時間</span><strong>' + (unlimited ? '不限' : hours + ' 小時') + '</strong></div></div>'
      + '<section class="card" aria-label="簽核流程設定">' + setupHead + '<ol class="setup-list">' + setupRows + '</ol></section>'
      + '<section class="card"><div class="card-head"><h2>簽核狀態</h2><span class="muted">以範例申請單示意：' + esc(M.applicant.name) + '（' + esc(M.applicant.title) + '）的' + esc(M.formName) + '。實際簽核人、自動略過與例外說明依申請人而定，切換情境可查看各關卡進度。</span></div>'
      + '<div class="tabs-big" role="group" aria-label="簽核情境">' + SCENARIOS.map((o) => '<button class="tab-big' + (o.v === sc ? ' on' : '') + '" data-act="preview" data-arg="' + o.v + '" aria-pressed="' + (o.v === sc) + '"><span class="tab-dot ' + o.v + '"></span><span class="titles"><strong>' + o.t + '</strong><span class="muted sm">' + o.d + '</span></span></button>').join('') + '</div>'
      + '<div class="banner ' + sc + '"><div class="row wrap"><strong>' + esc(hint) + '</strong><span class="muted">已完成 ' + doneCount + ' / ' + na + ' 關' + (n > na ? '（另 ' + (n - na) + ' 關自動略過）' : '') + '</span></div>'
      + '<button class="btn btn-link" data-act="openStatus">查看完整簽核畫面' + svg(ICON.chev, 16, { sw: 2 }) + '</button></div>'
      + stepper + '</section></main>';
  }

  /* ---------- 單張表單的簽核進度 ---------- */
  function renderStatus() {
    const steps = pickedSteps();
    const sc = S.preview;
    const fs = flowStatus(steps, sc);
    const statusOf = fs.statusOf;
    const n = fs.active;
    let t = 0; let lastTime = '';
    const nextTime = () => { lastTime = SAMPLE_TIMES[Math.min(t++, SAMPLE_TIMES.length - 1)]; return lastTime; };
    const SIGNER = { done: '已核准', current: '待簽核', waiting: '未開始' };

    const items = steps.map((st, i) => {
      const status = statusOf(i);
      const s = getSet(st.key);
      const f = fs.fr[i];
      const all = f.list;
      const list = all.slice(0, 3);
      const multi = s.mode !== 'any' && list.length > 1;
      let signers = [];
      if (status === 'waiting') signers = list.map((m) => [m, 'waiting', '']);
      else if (status === 'done') signers = (s.mode === 'any' ? list.slice(0, 1) : list).map((m) => [m, 'done', nextTime()]);
      else if (status === 'current') signers = list.map((m, j) => multi && j === 0 ? [m, 'done', nextTime()] : [m, 'current', '']);
      const limit = s.timeout === 'none' ? '不限期限' : '剩餘 ' + (Number(s.timeout) - 1) + ' 小時';
      let info = '';
      if (status === 'current') info = (multi ? '1 / ' + list.length + ' 人已簽核，' : '等待簽核，') + limit;
      if (status === 'done' && s.mode === 'any' && all.length > 1) info = '任一人簽核，已由' + list[0].name + '完成';
      if (all.length > list.length) info += (info ? '｜' : '') + '共 ' + all.length + ' 人，僅列出前 ' + list.length + ' 位';
      if (status === 'skipped') info = f.reason;
      else if (f.block) info = f.reason;
      else if (!list.length) info = '目前沒有符合的簽核人員';
      // 例外處理的說明（不在職、往上找、略過重複等）
      const notes = status === 'skipped' ? [] : f.notes.concat(list.filter((m) => m.note).map((m) => m.name + '：' + m.note));
      return { st, status, signers, info, notes, i };
    });
    const doneCount = items.filter((x) => x.status === 'done').length;
    const allDone = n > 0 && doneCount === n;
    const current = items.find((x) => x.status === 'current');
    const badge = SCENARIOS.find((o) => o.v === sc).badge;
    const app = M.applicant;
    const v = M.sample.values;
    const amount = v.amount != null ? Number(v.amount).toLocaleString('en-US') + ' 元' : '—';

    const timeline = items.map((x) => '<li class="tl2-step"><div class="tl2-rail"><span class="tl2-node ' + x.status + '">'
      + (x.status === 'done' ? svg(ICON.check, 16, { sw: 2.6 }) : x.status === 'current' ? svg(ICON.clock, 16, { sw: 2.2 }) : x.status === 'skipped' ? svg(ICON.swap, 14, { sw: 2.2 }) : '<span>' + (x.i + 1) + '</span>')
      + '</span><span class="tl2-line' + (x.status === 'done' ? ' done' : '') + '"></span></div>'
      + '<div class="tl2-body"><div class="tl2-card ' + x.status + '"><div class="row wrap"><span class="muted sm">第 ' + (x.i + 1) + ' 關</span>' + tag(x.st.cat.name)
      + '<strong class="' + (x.status === 'waiting' ? 'muted' : '') + '">' + esc(x.st.item.label) + '</strong><span class="spill ' + x.status + '">' + STATUS_TEXT[x.status] + '</span></div>'
      + '<span class="muted sm">' + esc(summary(x.st.key)) + '</span>'
      + (x.st.item.rule ? '<span class="cond-note">符合條件：' + esc(condNote(x.st.item.rule)) + '</span>' : '')
      + '<ul class="signers">' + x.signers.map((g) => '<li><span class="avatar xs">' + initial(g[0].name) + '</span><strong>' + esc(g[0].name) + '</strong><span class="muted sm">' + esc(g[0].title) + '</span><span class="spill ' + g[1] + '">' + SIGNER[g[1]] + '</span><span class="muted sm">' + esc(g[2]) + '</span></li>').join('') + '</ul>'
      + (x.info ? '<span class="info">' + esc(x.info) + '</span>' : '')
      + (x.notes.length ? '<ul class="exc-notes">' + x.notes.map((t) => '<li>' + esc(t) + '</li>').join('') + '</ul>' : '') + '</div></div></li>').join('');

    return '<header class="topbar"><div class="titles"><span class="crumb">表單簽核 / ' + esc(M.formName) + '</span><div class="row wrap"><h1>' + esc(app.name) + '的' + esc(M.formName) + '</h1><span class="spill big ' + badge[1] + '">' + badge[0] + '</span></div></div>'
      + '<button class="btn btn-outline" data-act="toOverview">' + svg(ICON.back, 16, { sw: 2 }) + '<span>返回簽核流程總覽</span></button></header>'
      + '<main class="container">'
      + '<div class="seg-inline" role="group" aria-label="簽核情境">' + SCENARIOS.map((o) => '<button class="' + (o.v === sc ? 'on' : '') + '" data-act="preview" data-arg="' + o.v + '" aria-pressed="' + (o.v === sc) + '">' + o.t + '</button>').join('') + '</div>'
      + '<div class="status-layout">'
      + '<section class="card side"><h2>申請內容</h2><dl class="facts">'
      + '<div><dt>申請人</dt><dd>' + esc(app.name) + '（' + esc(app.title) + '）</dd></div>'
      + '<div><dt>費用類別</dt><dd>' + esc(v.category || '—') + '</dd></div>'
      + '<div><dt>申請金額</dt><dd>' + esc(amount) + '</dd></div>'
      + '<div><dt>送出時間</dt><dd>' + esc(M.sample.submittedAt || '—') + '</dd></div>'
      + '<div class="span-2"><dt>套用流程</dt><dd>第 ' + S.version + ' 版<span class="muted sm">（依送出當時的流程簽核，之後修改流程不影響此單）</span></dd></div></dl>'
      + '<div class="progress-box"><div class="row spread"><span class="muted sm">簽核進度</span><strong>' + doneCount + ' / ' + n + ' 關</strong></div>'
      + '<div class="bar" role="progressbar" aria-label="簽核進度" aria-valuemin="0" aria-valuemax="' + n + '" aria-valuenow="' + doneCount + '"><span class="' + (allDone ? 'done' : '') + '" style="width:' + (n ? Math.round(doneCount / n * 100) : 0) + '%"></span></div>'
      + '<span class="muted sm">' + (allDone ? '全部關卡已完成' : current ? '目前在第 ' + (current.i + 1) + ' 關：' + esc(current.st.item.label) : '') + '</span></div></section>'
      + '<section class="card grow"><h2>簽核進度</h2><ol class="tl2">'
      + '<li class="tl2-step"><div class="tl2-rail"><span class="tl2-node done">' + svg(ICON.dot, 12) + '</span><span class="tl2-line done"></span></div><div class="tl2-body edge"><strong>申請人送出</strong><span class="muted sm">' + esc(app.name) + '｜' + esc(M.sample.submittedAt) + '</span></div></li>'
      + timeline
      + '<li class="tl2-step"><div class="tl2-rail"><span class="tl2-node ' + (allDone ? 'done' : 'waiting') + '">' + svg(ICON.flag, 16, { sw: 2.4 }) + '</span></div><div class="tl2-body edge"><strong class="' + (allDone ? '' : 'muted') + '">簽核完成</strong><span class="muted sm">' + (allDone ? esc(lastTime) : '全部關卡完成後結案') + '</span></div></li>'
      + '</ol></section></div></main>';
  }

  /* ---------- 渲染 ---------- */
  function render() {
    const active = document.activeElement;
    const key = active && active.dataset ? active.dataset.key : null;
    let sel = null;
    try { sel = key ? [active.selectionStart, active.selectionEnd] : null; } catch (e) { sel = null; }

    $app.innerHTML = S.screen === 'done' ? renderDone() : S.screen === 'status' ? renderStatus() : renderEdit();

    if (key) {
      const el = $app.querySelector('[data-key="' + key + '"]');
      if (el) { el.focus(); try { if (sel) el.setSelectionRange(sel[0], sel[1]); } catch (e) { /* number 欄位不支援 */ } }
    }
    // 確認對話框開啟時，焦點預設放在「取消」，避免誤按 Enter 直接刪除
    if (S.confirm && !(document.activeElement && document.activeElement.closest('.modal'))) {
      const cancel = $app.querySelector('[data-key="cf-cancel"]');
      if (cancel) cancel.focus();
    }
  }

  /* ---------- 自訂條件操作 ---------- */
  function newClause() {
    const f = M.fields.find((x) => x.type === 'num') || M.fields[0];
    return { field: f.key, op: OPS[f.type][0], value: f.options ? f.options[0] : '' };
  }
  function patchEd(p) { set({ editor: Object.assign({}, S.editor, p) }); }
  function patchClause(i, p) {
    const clauses = S.editor.clauses.slice();
    clauses[i] = Object.assign({}, clauses[i], p);
    patchEd({ clauses });
  }
  // 更新時間到秒；與上一版同一秒時往後推 1 秒，確保每一版的時間不同
  function stampAfter(last) {
    let ts = Date.now();
    if (last && ts - last.ts < 1000) ts = last.ts + 1000;
    const d = new Date(ts);
    const p = (x) => String(x).padStart(2, '0');
    return { ts, text: d.getFullYear() + '/' + p(d.getMonth() + 1) + '/' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds()) };
  }

  // 儲存當下的流程內容（之後組織或設定變動也不影響舊版本的紀錄）
  // 簽核流程設定是「設定」，不依任何申請人計算：固定人員列出在職者，依申請人決定的來源只顯示「依申請人動態帶入」
  function snapshotRows(steps) {
    return steps.map((st, i) => {
      const it = st.item;
      const list = resolveStep(st.key).signers;
      return {
        num: i + 1, label: it.label, type: st.cat.name, sub: it.sub, dynamic: !!it.example,
        people: list.slice(0, 3).map((m) => ({ name: m.name, title: m.title })),
        more: Math.max(0, list.length - 3),
        summary: summary(st.key),
        cond: it.rule ? condNote(it.rule) : '',
        exc: excSummary(st.key)
      };
    });
  }

  async function doSave() {
    const dirty = isDirty();
    const nextVersion = S.version === 0 ? 1 : (dirty ? S.version + 1 : S.version);
    set({ saving: true, saveError: '' });
    const flow = pickedSteps().map((st) => ({ source: st.key, label: st.item.label, settings: getSet(st.key) }));
    let res;
    try { res = await window.DataSource.saveFlow({ form: M.formName, version: nextVersion, steps: flow, customConditions: S.custom }); } catch (e) { res = { ok: false, message: e.message }; }
    if (res && res.ok) {
      const prev = S.history.filter((h) => h.version !== nextVersion).slice(-1)[0];
      const stamp = stampAfter(prev);
      const entry = { version: nextVersion, ts: stamp.ts, savedAt: stamp.text, rows: snapshotRows(pickedSteps()) };
      const history = nextVersion === S.version ? S.history.map((h) => (h.version === nextVersion ? entry : h)) : S.history.concat(entry);
      set({ saving: false, saved: true, screen: 'done', view: null, editor: null, prevVersion: dirty ? S.version : 0, version: nextVersion, snapshot: flowSig(), history, viewVersion: null });
    } else set({ saving: false, saveError: (res && res.message) || '請稍後再試。' });
  }

  function moveStep(from, to) {
    if (from === to || to < 0 || to >= S.picked.length) return;
    const p = S.picked.slice();
    const [k] = p.splice(from, 1);
    p.splice(to, 0, k);
    set({ picked: p, saved: false });
  }

  function saveEditor() {
    const ed = S.editor;
    if (!edValid(ed)) { set({ tried: true }); return; }
    const rec = Object.assign({}, ed, { name: ed.name.trim() || ed.clauses.map(clauseText).join(ed.logic === 'and' ? ' 且 ' : ' 或 ') });
    if (ed.id) {
      set({ custom: S.custom.map((u) => (u.id === ed.id ? rec : u)), editor: null, saved: false });
    } else {
      rec.id = 'u' + Date.now();
      set({ custom: S.custom.concat(rec), picked: S.picked.concat('cond:' + rec.id), editor: null, saved: false, tab: 'cond', q: '' });
    }
  }

  /* ---------- 事件 ---------- */
  const ACT = {
    tab: (k) => set({ tab: k, q: '' }),
    open: (key) => set({ view: key, whoErr: false }),
    toggle: (key) => (S.picked.includes(key) ? askRemove(key) : togglePick(key)),
    closeView: () => set({ view: null }),
    pickAndClose: () => {
      const k = S.view;
      if (S.picked.includes(k)) askRemove(k, true);
      else { S.view = null; togglePick(k); }
    },
    up: (i) => moveStep(Number(i), Number(i) - 1),
    down: (i) => moveStep(Number(i), Number(i) + 1),
    remove: (key) => askRemove(key),
    clear: () => ask({ title: '清除全部關卡？', message: '目前的 ' + S.picked.length + ' 個關卡和它們的簽核設定都會移除，無法復原。', ok: '清除全部', act: 'clear' }),
    confirmCancel: () => set({ confirm: null }),
    confirmOk: () => {
      const c = S.confirm;
      S.confirm = null;
      if (c.act === 'remove') set({ picked: S.picked.filter((k) => k !== c.arg), view: c.closeView ? null : S.view, saved: false });
      else if (c.act === 'clear') set({ picked: [], view: null, saved: false });
      else if (c.act === 'delCond') {
        const key = 'cond:' + c.arg;
        set({ custom: S.custom.filter((u) => u.id !== c.arg), picked: S.picked.filter((k) => k !== key), view: S.view === key ? null : S.view, editor: null, saved: false });
      } else if (c.act === 'save') { render(); doSave(); }
      else if (c.act === 'delDir') { render(); deleteMember(c.kind, c.arg); }
      else render();
    },
    reload: () => window.location.reload(),
    save: () => {
      if (!S.picked.length || S.saving) return;
      // 只有在已有單據正在簽核時才需要提醒新舊版本的差別；0 張時直接儲存為新版本
      const n = M.sample.inProgressCount;
      if (isDirty() && n > 0) {
        ask({
          tone: 'info', title: '儲存為第 ' + (S.version + 1) + ' 版流程？',
          message: '目前有 ' + n + ' 張' + M.formName + '正在簽核，會繼續依第 ' + S.version + ' 版流程完成；'
            + '儲存後新送出的' + M.formName + '才會套用第 ' + (S.version + 1) + ' 版流程。',
          ok: '儲存為第 ' + (S.version + 1) + ' 版', act: 'save'
        });
      } else doSave();
    },
    back: () => set({ screen: 'edit' }),
    mode: (v) => setSet(S.view, { mode: v }),
    timeout: (v) => setSet(S.view, { timeout: v }),
    overdue: (v) => setSet(S.view, { overdue: v }),
    absent: (v) => setSet(S.view, { absent: v }),
    notfound: (v) => setSet(S.view, { notfound: v }),
    newCond: () => set({ tried: false, editor: { id: null, name: '', logic: 'and', clauses: [newClause()], then: 'org:1', otherwise: 'skip' } }),
    editCond: (id) => { const u = S.custom.find((x) => x.id === id); if (u) set({ tried: false, editor: JSON.parse(JSON.stringify(u)) }); },
    edLogic: (v) => patchEd({ logic: v }),
    edElse: (v) => patchEd({ otherwise: v }),
    edAdd: () => patchEd({ clauses: S.editor.clauses.concat(newClause()) }),
    edRemove: (i) => patchEd({ clauses: S.editor.clauses.filter((_, j) => j !== Number(i)) }),
    edCancel: () => set({ editor: null }),
    edSave: () => saveEditor(),
    edDelete: () => ask({ title: '刪除這個自訂條件？', message: '「' + (S.editor.name || '未命名條件') + '」會被刪除；若已加入流程，該關卡也會一併移除。', ok: '刪除', act: 'delCond', arg: S.editor.id }),
    newDir: (kind) => set({ member: { kind, id: null, name: '', deptId: '', memberIds: [], q: '', tried: false, saving: false, error: '' } }),
    editDir: (key) => {
      const i = key.indexOf(':');
      const kind = key.slice(0, i);
      const rec = (M.raw[DIR[kind].list] || []).find((x) => x.id === key.slice(i + 1));
      if (rec) set({ member: { kind, id: rec.id, name: rec.name, deptId: rec.deptId || '', memberIds: rec.memberIds.slice(), q: '', tried: false, saving: false, error: '' } });
    },
    mbToggle: (id) => patchMb({ memberIds: S.member.memberIds.filter((x) => x !== id) }),
    mbCancel: () => { if (!S.member.saving) set({ member: null }); },
    mbSave: () => saveMember(),
    mbDelete: () => {
      const mb = S.member;
      const noun = DIR[mb.kind].noun;
      const used = stepsUsing(mb.kind + ':' + mb.id).map((k) => S.picked.indexOf(k) + 1);
      ask({
        title: '刪除這個' + noun + '？', ok: '刪除', act: 'delDir', kind: mb.kind, arg: mb.id,
        message: '「' + mb.name + '」會被刪除，之後不能再選為簽核人。' + (used.length ? '流程的第 ' + used.join('、') + ' 關使用這個' + noun + '，也會一併移除。' : '')
      });
    },
    preview: (v) => set({ preview: v }),
    viewVersion: (v) => set({ viewVersion: Number(v), verOpen: false }),
    toggleVer: () => set({ verOpen: !S.verOpen }),
    openStatus: () => set({ screen: 'status' }),
    toOverview: () => set({ screen: 'done' })
  };
  const INPUT = {
    q: (v) => set({ q: v }),
    edName: (v) => patchEd({ name: v }),
    edValue: (v, i) => patchClause(Number(i), { value: v }),
    // 名稱只在按下儲存時檢查，打字時不重繪；已顯示錯誤訊息時才重繪，讓訊息隨輸入消失
    mbName: (v) => { S.member.name = v; if (S.member.tried) render(); },
    mbQ: (v) => patchMb({ q: v })
  };
  const CHANGE = {
    perm: (el) => setSet(S.view, { [el.dataset.arg]: el.checked }),
    // 主管、副主管至少勾一項；取消最後一項時維持原狀並提示
    who: (el) => {
      const who = Object.assign({}, getSet(S.view).who, { [el.dataset.arg]: el.checked });
      if (!who.mgr && !who.deputy) { set({ whoErr: true }); return; }
      S.whoErr = false;
      setSet(S.view, { who });
    },
    edField: (el) => { const f = field(el.value); patchClause(Number(el.dataset.arg), { field: f.key, op: OPS[f.type][0], value: f.options ? f.options[0] : '' }); },
    edOp: (el) => patchClause(Number(el.dataset.arg), { op: el.value }),
    edValue: (el) => patchClause(Number(el.dataset.arg), { value: el.value }),
    edThen: (el) => patchEd({ then: el.value }),
    mbDept: (el) => patchMb({ deptId: el.value }),
    mbPick: (el) => {
      const id = el.dataset.arg;
      const ids = S.member.memberIds.filter((x) => x !== id);
      patchMb({ memberIds: el.checked ? ids.concat(id) : ids });
    }
  };

  $app.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el || el.disabled) return;
    const fn = ACT[el.dataset.act];
    if (fn) fn(el.dataset.arg, el);
  });
  // 注音、拼音等輸入法組字期間不重繪畫面，否則會打斷組字、留下「ㄨㄛˇ」之類的注音符號；組字完成後再更新
  const onInput = (e) => {
    const el = e.target;
    const fn = INPUT[el.dataset && el.dataset.input];
    if (fn) fn(el.value, el.dataset.arg);
  };
  $app.addEventListener('input', (e) => { if (!e.isComposing) onInput(e); });
  $app.addEventListener('compositionend', onInput);
  $app.addEventListener('change', (e) => {
    const el = e.target;
    const fn = CHANGE[el.dataset && el.dataset.change];
    if (fn) fn(el);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !M) return;
    if (S.verOpen) set({ verOpen: false });
    else if (S.confirm) set({ confirm: null });
    else if (S.member) { if (!S.member.saving) set({ member: null }); }
    else if (S.editor) set({ editor: null });
    else if (S.view) set({ view: null });
  });

  /* 拖曳排序（鍵盤使用者可用上移、下移按鈕） */
  const clearDrop = () => $app.querySelectorAll('.drop-before, .drop-after, .dragging').forEach((n) => n.classList.remove('drop-before', 'drop-after', 'dragging'));
  const dropPos = (li, e) => { const r = li.getBoundingClientRect(); return e.clientY > r.top + r.height / 2 ? 'after' : 'before'; };
  $app.addEventListener('dragstart', (e) => {
    const li = e.target.closest && e.target.closest('[data-drag-index]');
    if (!li) return;
    dragFrom = Number(li.dataset.dragIndex);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(dragFrom));
    li.classList.add('dragging');
  });
  $app.addEventListener('dragover', (e) => {
    const li = e.target.closest && e.target.closest('[data-drag-index]');
    if (!li || dragFrom === null) return;
    e.preventDefault();
    const pos = dropPos(li, e);
    $app.querySelectorAll('.drop-before, .drop-after').forEach((n) => n.classList.remove('drop-before', 'drop-after'));
    li.classList.add(pos === 'after' ? 'drop-after' : 'drop-before');
  });
  $app.addEventListener('drop', (e) => {
    const li = e.target.closest && e.target.closest('[data-drag-index]');
    if (!li || dragFrom === null) return;
    e.preventDefault();
    let to = Number(li.dataset.dragIndex) + (dropPos(li, e) === 'after' ? 1 : 0);
    if (to > dragFrom) to -= 1;
    const from = dragFrom;
    dragFrom = null;
    clearDrop();
    moveStep(from, to);
  });
  $app.addEventListener('dragend', () => { dragFrom = null; clearDrop(); });

  /* ---------- 啟動 ---------- */
  $app.innerHTML = renderLoading();
  window.DataSource.loadOrg()
    .then((raw) => { M = window.OrgModel.build(raw); render(); })
    .catch((err) => { $app.innerHTML = renderLoadError(err.message); });
})();
