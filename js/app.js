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
  const SAMPLE_TIMES = ['11/03 10:05', '11/03 14:30', '11/03 16:48', '11/04 09:15', '11/04 10:12', '11/04 14:40', '11/04 16:05', '11/05 09:30', '11/05 11:20', '11/05 15:45', '11/06 10:00', '11/06 14:10'];

  /* ---------- 狀態 ---------- */
  let M = null;
  const S = {
    tab: 'emp', q: '', view: null, editor: null, tried: false,
    custom: [], picked: [], settings: {},
    screen: 'edit', preview: 'pending', saved: false
  };
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

  function getSet(key) {
    const hit = find(key);
    const mode = hit && hit.item.seq ? 'seq' : (hit ? hit.cat.mode : 'all');
    return Object.assign({ mode, timeout: '72', overdue: 'remind', allowReturn: true, allowAdd: false, skipSelf: true }, S.settings[key] || {});
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
        + '<button class="pill-btn' + (added ? ' on' : '') + '" data-act="toggle" data-arg="' + esc(key) + '" aria-pressed="' + added + '">' + (added ? '已加入' : '加入') + '</button>'
        + '</div>';
    }).join('') + (matched.length > LIMIT ? '<p class="muted center">共 ' + matched.length + ' 筆，僅顯示前 ' + LIMIT + ' 筆，請輸入關鍵字縮小範圍</p>' : '')
      || '<p class="muted center">找不到符合「' + esc(S.q) + '」的項目</p>';

    const quick = ['org:1', 'head:self', 'role:fin', 'role:hr'].map((k) => find(k)).map((h, i) => h ? '<button class="chip-btn" data-act="toggle" data-arg="' + ['org:1', 'head:self', 'role:fin', 'role:hr'][i] + '" aria-label="加入 ' + esc(h.item.label) + '">' + svg(ICON.plus, 14, { sw: 2.4 }) + '<span>' + esc(h.item.label) + '</span></button>' : '').join('');

    const flow = empty
      ? '<div class="empty-box"><div class="empty-top">' + svg(ICON.plus, 28, { sw: 1.6 })
        + '<span>尚未加入簽核關卡<br>從左側選擇簽核來源</span><span class="note warn">至少需要一個關卡才能儲存流程</span></div>'
        + '<div class="empty-quick"><span class="quick-title">或快速加入常用關卡</span><div class="chips">' + quick + '</div></div></div>'
      : '<ol class="timeline">'
        + '<li class="tl-edge">' + '<span class="tl-dot">' + svg(ICON.dot, 12) + '</span><span class="muted">申請人送出表單</span></li>'
        + steps.map((st, i) => '<li class="tl-step"><div class="tl-rail"><span class="tl-num">' + (i + 1) + '</span><span class="tl-line"></span></div>'
          + '<div class="tl-card' + (S.view === st.key ? ' on' : '') + '">'
          + '<button class="tl-open" data-act="open" data-arg="' + esc(st.key) + '" aria-label="查看第 ' + (i + 1) + ' 關設定">' + tag(st.cat.name)
          + '<span class="tl-label">' + esc(st.item.label) + '</span><span class="tl-sum">' + esc(summary(st.key)) + '</span></button>'
          + '<div class="tl-tools">' + iconBtn('up', i, '上移', 'up', i === 0) + iconBtn('remove', st.key, '移除', 'close') + '</div>'
          + '</div></li>').join('')
        + '<li class="tl-edge"><span class="tl-dot done">' + svg(ICON.check, 16, { sw: 2.4 }) + '</span><span class="muted">簽核完成，結案歸檔</span></li></ol>';

    return '<header class="topbar"><div class="titles"><span class="crumb">表單管理 / ' + esc(M.formName) + '</span><h1>設定簽核關卡</h1></div>'
      + '<div class="topbar-actions">'
      + (S.saved ? '<span class="note ok" role="status">已儲存，共 ' + steps.length + ' 關</span>' : '')
      + (empty ? '<span class="note warn" role="status">請至少加入一個簽核關卡才能儲存</span>' : '')
      + '<button class="btn btn-ghost" data-act="clear"' + (empty ? ' disabled' : '') + '>清除全部</button>'
      + '<button class="btn btn-primary" data-act="save"' + (empty ? ' disabled' : '') + '>儲存流程</button></div></header>'
      + '<div class="layout"><nav class="nav" aria-label="簽核來源"><div class="navlist">' + nav + '</div></nav>'
      + '<div class="main">'
      + '<section class="panel"><div class="panel-head"><h2>' + esc(cur.name) + '</h2><p class="muted">' + esc(cur.desc) + '</p></div>'
      + '<label class="search">' + svg(ICON.search, 18, { sw: 2 }) + '<span class="sr">搜尋</span><input type="search" data-input="q" data-key="q" value="' + esc(S.q) + '" placeholder="' + esc(cur.placeholder) + '"></label>'
      + (S.tab === 'cond' ? '<button class="add-cond" data-act="newCond">' + svg(ICON.plus, 18, { sw: 2 }) + '<span>新增自訂條件</span></button>' : '')
      + '<div class="opt-list">' + rows + '</div></section>'
      + '<aside class="flow" aria-label="簽核流程"><div class="flow-head"><h2>簽核流程</h2>'
      + (empty ? '' : '<span class="muted">共 ' + steps.length + ' 關｜點選關卡查看設定</span>') + '</div>' + flow + '</aside>'
      + '</div></div>'
      + (S.view ? renderDrawer() : '')
      + (S.editor ? renderEditor() : '');
  }

  /* ---------- 關卡詳細面板 ---------- */
  function renderDrawer() {
    const hit = find(S.view);
    if (!hit) return '';
    const { cat, item } = hit;
    const s = getSet(S.view);
    const idx = S.picked.indexOf(S.view);
    const r = item.rule;
    const total = item.people.length;
    const modes = [{ v: 'any', t: '任一人簽核', hint: '一人同意即通過' }, item.seq ? { v: 'seq', t: '依序簽核', hint: '由下而上逐級' } : { v: 'all', t: '全部簽核', hint: '所有人都需同意' }];

    const rule = r ? '<div class="block"><div class="block-head"><h3>觸發條件</h3>'
      + (item.custom ? '<button class="btn btn-outline sm" data-act="editCond" data-arg="' + esc(item.id) + '">' + svg(ICON.pencil, 14, { sw: 2 }) + '<span>編輯條件</span></button>' : '') + '</div>'
      + '<div class="rule-box">' + r.clauses.map((c, i) => '<div class="rule-line"><span class="rule-join">' + (i === 0 ? '當' : (r.logic === 'and' ? '且' : '或')) + '</span>'
        + '<span class="rule-chip">' + esc(c.f) + '</span><strong>' + esc(c.op) + '</strong>' + (c.v ? '<span class="rule-chip">' + esc(c.v) + '</span>' : '') + '</div>').join('')
      + '<div class="rule-then">時，由 <strong>' + esc(r.then) + '</strong> 簽核</div></div>'
      + '<p class="muted sm">' + (r.otherwise === 'direct' ? '不符合條件時改由直屬主管簽核' : '不符合條件時自動略過此關卡') + '</p></div>' : '';

    const people = total
      ? '<ul class="people-list">' + item.people.map((m) => '<li><span class="avatar sm">' + initial(m.name) + '</span><span class="opt-text"><span>' + esc(m.name) + '</span><span class="opt-sub">' + esc(m.title) + '</span></span></li>').join('') + '</ul>'
      : '<p class="muted">目前沒有符合的人員，請確認組織資料。</p>';

    const check = (k, label) => '<label class="check-row"><input type="checkbox" data-change="perm" data-arg="' + k + '"' + (s[k] ? ' checked' : '') + '><span>' + label + '</span></label>';

    return '<div class="overlay"><button class="scrim" data-act="closeView" aria-label="關閉詳細資訊"></button>'
      + '<div class="drawer" role="dialog" aria-label="' + esc(item.label) + ' 設定">'
      + '<div class="drawer-head"><div class="titles"><div class="row">' + tag(cat.name) + (idx >= 0 ? '<span class="muted sm">第 ' + (idx + 1) + ' 關</span>' : '') + '</div>'
      + '<h2>' + esc(item.label) + '</h2><p class="muted">' + esc(item.sub) + '</p></div>' + iconBtn('closeView', '', '關閉', 'close') + '</div>'
      + '<div class="drawer-body">' + rule
      + '<div class="block"><div class="block-head"><h3>簽核人員</h3><span class="muted sm">' + esc(item.example ? '以申請人' + M.applicant.name + '（' + M.applicant.title + '）為例' : '共 ' + total + ' 位') + '</span></div>' + people + '</div>'
      + '<div class="block"><h3>簽核方式</h3><div class="seg cols-2">' + seg(modes, s.mode, 'mode', true) + '</div></div>'
      + '<div class="block"><h3>簽核期限</h3><div class="seg cols-4">' + seg([{ v: 'none', t: '不限' }, { v: '24', t: '24 小時' }, { v: '48', t: '48 小時' }, { v: '72', t: '72 小時' }], s.timeout, 'timeout') + '</div>'
      + (s.timeout !== 'none' ? '<span class="muted sm">逾期未簽時</span><div class="seg cols-3">' + seg([{ v: 'remind', t: '再次提醒' }, { v: 'pass', t: '自動同意' }, { v: 'up', t: '轉呈上一層' }], s.overdue, 'overdue') + '</div>' : '') + '</div>'
      + '<div class="block"><h3>其他權限</h3>' + check('allowReturn', '允許退回申請人') + check('allowAdd', '允許加簽其他人員') + check('skipSelf', '簽核人與申請人相同時自動略過') + '</div>'
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
  const STATUS_TEXT = { done: '已核准', current: '簽核中', waiting: '未簽核' };

  /* ---------- 儲存後總覽 ---------- */
  function renderDone() {
    const steps = pickedSteps();
    const n = steps.length;
    const sc = S.preview;
    const statusOf = scenarioStatus(sc, n);
    let hours = 0; let unlimited = false;
    steps.forEach((st) => { const s = getSet(st.key); if (s.timeout === 'none') unlimited = true; else hours += Number(s.timeout); });
    const condCount = steps.filter((st) => st.item.rule).length;
    const doneCount = steps.filter((_, i) => statusOf(i) === 'done').length;
    const cur = Math.min(1, n - 1);
    const hint = { pending: '表單送出後，等待第 1 關簽核', progress: n > 1 ? '已完成前 ' + cur + ' 關，第 ' + (cur + 1) + ' 關簽核中' : '第 1 關簽核中', done: '所有關卡皆已核准，簽核完成' }[sc];

    const setupRows = steps.map((st, i) => {
      const it = st.item;
      const chips = it.example
        ? '<span class="dyn-chip">' + svg(ICON.swap, 14, { sw: 2 }) + '依申請人動態帶入</span>'
        : it.people.slice(0, 3).map((m) => '<span class="person-chip"><span class="avatar xs">' + initial(m.name) + '</span><span class="pc-name">' + esc(m.name) + '</span><span class="opt-sub">' + esc(m.title) + '</span></span>').join('')
          + (it.people.length > 3 ? '<span class="muted sm">另 ' + (it.people.length - 3) + ' 人</span>' : '');
      return '<li class="setup-row"><div class="setup-step"><span class="num-badge">' + (i + 1) + '</span><div class="titles"><strong>' + esc(it.label) + '</strong><div class="row">' + tag(st.cat.name) + '<span class="muted sm">' + esc(it.sub) + '</span></div></div></div>'
        + '<div class="setup-col wide"><span class="muted sm">簽核人</span><div class="chips">' + chips + '</div></div>'
        + '<div class="setup-col"><span class="muted sm">簽核方式</span><span>' + esc(summary(st.key)) + '</span>' + (it.rule ? '<span class="cond-note">當 ' + esc(condNote(it.rule)) + ' 時簽核</span>' : '') + '</div></li>';
    }).join('');

    const line = (solid, done) => '<span class="st-line' + (solid ? '' : ' dashed') + (done ? ' done' : '') + '"></span>';
    const stepper = '<div class="stepper-wrap"><ol class="stepper">'
      + '<li class="st-edge"><div class="st-track"><span class="st-fill"></span><span class="st-node done">' + svg(ICON.dot, 12) + '</span>' + line(true, true) + '</div><span class="st-edge-label">申請人送出</span></li>'
      + steps.map((st, i) => {
        const status = statusOf(i);
        const node = status === 'done' ? svg(ICON.check, 18, { sw: 2.6 }) : status === 'current' ? svg(ICON.clock, 18, { sw: 2.2 }) : '<span>' + (i + 1) + '</span>';
        return '<li class="st-step"><div class="st-track">' + line(status !== 'waiting', status !== 'waiting')
          + '<span class="st-node ' + status + '">' + node + '</span>' + line(status === 'done', status === 'done') + '</div>'
          + '<div class="st-card ' + status + '"><div class="row"><span class="muted sm">第 ' + (i + 1) + ' 關</span>' + tag(st.cat.name) + '</div>'
          + '<strong class="st-label">' + esc(st.item.label) + '</strong>'
          + '<span class="muted sm">' + esc(st.item.example ? '依申請人動態帶入' : st.item.people.slice(0, 2).map((m) => m.name).join('、') + (st.item.people.length > 2 ? ' 等 ' + st.item.people.length + ' 人' : '')) + '</span>'
          + '<div class="st-foot ' + status + '"><span class="st-foot-dot"></span>' + (status === 'current' ? '簽核中，等待簽核人處理' : status === 'done' ? '已核准' : '尚未開始') + '</div></div></li>';
      }).join('')
      + '<li class="st-edge"><div class="st-track">' + line(sc === 'done', sc === 'done') + '<span class="st-node ' + (sc === 'done' ? 'done' : 'waiting') + '">' + svg(ICON.flag, 18, { sw: 2.4 }) + '</span><span class="st-fill"></span></div><span class="st-edge-label">簽核完成</span></li>'
      + '</ol></div>';

    return '<header class="topbar"><div class="titles"><span class="crumb">表單管理 / ' + esc(M.formName) + '</span><h1>簽核流程總覽</h1></div>'
      + '<button class="btn btn-outline" data-act="back">' + svg(ICON.pencil, 16, { sw: 2 }) + '<span>返回編輯</span></button></header>'
      + '<main class="container">'
      + '<div class="banner ok" role="status"><span class="banner-icon">' + svg(ICON.check, 20, { sw: 2.6 }) + '</span><div class="titles"><strong>簽核流程已儲存</strong><span>共 ' + n + ' 關，將套用於之後送出的' + esc(M.formName) + '</span></div></div>'
      + '<div class="stats"><div class="stat"><span class="muted sm">簽核關卡</span><strong>' + n + ' 關</strong></div><div class="stat"><span class="muted sm">條件式關卡</span><strong>' + condCount + ' 關</strong></div><div class="stat"><span class="muted sm">最長簽核時間</span><strong>' + (unlimited ? '不限' : hours + ' 小時') + '</strong></div></div>'
      + '<section class="card"><div class="card-head"><h2>簽核流程設定</h2><span class="muted">表單送出後，依序由以下人員簽核</span></div><ol class="setup-list">' + setupRows + '</ol></section>'
      + '<section class="card"><div class="card-head"><h2>簽核狀態</h2><span class="muted">切換情境，查看表單送出後各關卡的簽核進度</span></div>'
      + '<div class="tabs-big" role="group" aria-label="簽核情境">' + SCENARIOS.map((o) => '<button class="tab-big' + (o.v === sc ? ' on' : '') + '" data-act="preview" data-arg="' + o.v + '" aria-pressed="' + (o.v === sc) + '"><span class="tab-dot ' + o.v + '"></span><span class="titles"><strong>' + o.t + '</strong><span class="muted sm">' + o.d + '</span></span></button>').join('') + '</div>'
      + '<div class="banner ' + sc + '"><div class="row wrap"><strong>' + esc(hint) + '</strong><span class="muted">已完成 ' + doneCount + ' / ' + n + ' 關</span></div>'
      + '<button class="btn btn-link" data-act="openStatus">查看完整簽核畫面' + svg(ICON.chev, 16, { sw: 2 }) + '</button></div>'
      + stepper + '</section></main>';
  }

  /* ---------- 單張表單的簽核進度 ---------- */
  function renderStatus() {
    const steps = pickedSteps();
    const n = steps.length;
    const sc = S.preview;
    const statusOf = scenarioStatus(sc, n);
    let t = 0; let lastTime = '';
    const nextTime = () => { lastTime = SAMPLE_TIMES[Math.min(t++, SAMPLE_TIMES.length - 1)]; return lastTime; };
    const SIGNER = { done: '已核准', current: '待簽核', waiting: '未開始' };

    const items = steps.map((st, i) => {
      const status = statusOf(i);
      const s = getSet(st.key);
      const list = st.item.people.slice(0, 3);
      const multi = s.mode !== 'any' && list.length > 1;
      let signers;
      if (status === 'waiting') signers = list.map((m) => [m, 'waiting', '']);
      else if (status === 'done') signers = (s.mode === 'any' ? list.slice(0, 1) : list).map((m) => [m, 'done', nextTime()]);
      else signers = list.map((m, j) => multi && j === 0 ? [m, 'done', nextTime()] : [m, 'current', '']);
      const limit = s.timeout === 'none' ? '不限期限' : '剩餘 ' + (Number(s.timeout) - 1) + ' 小時';
      let info = '';
      if (status === 'current') info = (multi ? '1 / ' + list.length + ' 人已簽核，' : '等待簽核，') + limit;
      if (status === 'done' && s.mode === 'any' && st.item.people.length > 1) info = '任一人簽核，已由' + list[0].name + '完成';
      if (st.item.people.length > list.length) info += (info ? '｜' : '') + '共 ' + st.item.people.length + ' 人，僅列出前 ' + list.length + ' 位';
      if (!list.length) info = '目前沒有符合的簽核人員';
      return { st, status, signers, info, i };
    });
    const doneCount = items.filter((x) => x.status === 'done').length;
    const allDone = n > 0 && doneCount === n;
    const current = items.find((x) => x.status === 'current');
    const badge = SCENARIOS.find((o) => o.v === sc).badge;
    const app = M.applicant;
    const v = M.sample.values;
    const amount = v.amount != null ? Number(v.amount).toLocaleString('en-US') + ' 元' : '—';

    const timeline = items.map((x) => '<li class="tl2-step"><div class="tl2-rail"><span class="tl2-node ' + x.status + '">'
      + (x.status === 'done' ? svg(ICON.check, 16, { sw: 2.6 }) : x.status === 'current' ? svg(ICON.clock, 16, { sw: 2.2 }) : '<span>' + (x.i + 1) + '</span>')
      + '</span><span class="tl2-line' + (x.status === 'done' ? ' done' : '') + '"></span></div>'
      + '<div class="tl2-body"><div class="tl2-card ' + x.status + '"><div class="row wrap"><span class="muted sm">第 ' + (x.i + 1) + ' 關</span>' + tag(x.st.cat.name)
      + '<strong class="' + (x.status === 'waiting' ? 'muted' : '') + '">' + esc(x.st.item.label) + '</strong><span class="spill ' + x.status + '">' + STATUS_TEXT[x.status] + '</span></div>'
      + '<span class="muted sm">' + esc(summary(x.st.key)) + '</span>'
      + (x.st.item.rule ? '<span class="cond-note">符合條件：' + esc(condNote(x.st.item.rule)) + '</span>' : '')
      + '<ul class="signers">' + x.signers.map((g) => '<li><span class="avatar xs">' + initial(g[0].name) + '</span><strong>' + esc(g[0].name) + '</strong><span class="muted sm">' + esc(g[0].title) + '</span><span class="spill ' + g[1] + '">' + SIGNER[g[1]] + '</span><span class="muted sm">' + esc(g[2]) + '</span></li>').join('') + '</ul>'
      + (x.info ? '<span class="info">' + esc(x.info) + '</span>' : '') + '</div></div></li>').join('');

    return '<header class="topbar"><div class="titles"><span class="crumb">表單簽核 / ' + esc(M.formName) + '</span><div class="row wrap"><h1>' + esc(app.name) + '的' + esc(M.formName) + '</h1><span class="spill big ' + badge[1] + '">' + badge[0] + '</span></div></div>'
      + '<button class="btn btn-outline" data-act="toOverview">' + svg(ICON.back, 16, { sw: 2 }) + '<span>返回簽核流程總覽</span></button></header>'
      + '<main class="container">'
      + '<div class="seg-inline" role="group" aria-label="簽核情境">' + SCENARIOS.map((o) => '<button class="' + (o.v === sc ? 'on' : '') + '" data-act="preview" data-arg="' + o.v + '" aria-pressed="' + (o.v === sc) + '">' + o.t + '</button>').join('') + '</div>'
      + '<div class="status-layout">'
      + '<section class="card side"><h2>申請內容</h2><dl class="facts">'
      + '<div><dt>申請人</dt><dd>' + esc(app.name) + '（' + esc(app.title) + '）</dd></div>'
      + '<div><dt>費用類別</dt><dd>' + esc(v.category || '—') + '</dd></div>'
      + '<div><dt>申請金額</dt><dd>' + esc(amount) + '</dd></div>'
      + '<div><dt>送出時間</dt><dd>' + esc(M.sample.submittedAt || '—') + '</dd></div></dl>'
      + '<div class="progress"><div class="row spread"><span class="muted sm">簽核進度</span><strong>' + doneCount + ' / ' + n + ' 關</strong></div>'
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
    open: (key) => set({ view: key }),
    toggle: (key) => togglePick(key),
    closeView: () => set({ view: null }),
    pickAndClose: () => { const k = S.view; S.view = null; togglePick(k); },
    up: (i) => { i = Number(i); if (!i) return; const p = S.picked.slice(); [p[i - 1], p[i]] = [p[i], p[i - 1]]; set({ picked: p, saved: false }); },
    remove: (key) => togglePick(key),
    clear: () => set({ picked: [], view: null, saved: false }),
    save: async () => {
      if (!S.picked.length) return;
      const flow = pickedSteps().map((st) => ({ source: st.key, label: st.item.label, settings: getSet(st.key) }));
      const res = await window.DataSource.saveFlow({ form: M.formName, steps: flow, customConditions: S.custom });
      if (res && res.ok) set({ saved: true, screen: 'done', view: null, editor: null });
    },
    back: () => set({ screen: 'edit' }),
    mode: (v) => setSet(S.view, { mode: v }),
    timeout: (v) => setSet(S.view, { timeout: v }),
    overdue: (v) => setSet(S.view, { overdue: v }),
    newCond: () => set({ tried: false, editor: { id: null, name: '', logic: 'and', clauses: [newClause()], then: 'org:1', otherwise: 'skip' } }),
    editCond: (id) => { const u = S.custom.find((x) => x.id === id); if (u) set({ tried: false, editor: JSON.parse(JSON.stringify(u)) }); },
    edLogic: (v) => patchEd({ logic: v }),
    edElse: (v) => patchEd({ otherwise: v }),
    edAdd: () => patchEd({ clauses: S.editor.clauses.concat(newClause()) }),
    edRemove: (i) => patchEd({ clauses: S.editor.clauses.filter((_, j) => j !== Number(i)) }),
    edCancel: () => set({ editor: null }),
    edSave: () => saveEditor(),
    edDelete: () => {
      const id = S.editor.id; const key = 'cond:' + id;
      set({ custom: S.custom.filter((u) => u.id !== id), picked: S.picked.filter((k) => k !== key), view: S.view === key ? null : S.view, editor: null, saved: false });
    },
    preview: (v) => set({ preview: v }),
    openStatus: () => set({ screen: 'status' }),
    toOverview: () => set({ screen: 'done' })
  };
  const INPUT = {
    q: (v) => set({ q: v }),
    edName: (v) => patchEd({ name: v }),
    edValue: (v, i) => patchClause(Number(i), { value: v })
  };
  const CHANGE = {
    perm: (el) => setSet(S.view, { [el.dataset.arg]: el.checked }),
    edField: (el) => { const f = field(el.value); patchClause(Number(el.dataset.arg), { field: f.key, op: OPS[f.type][0], value: f.options ? f.options[0] : '' }); },
    edOp: (el) => patchClause(Number(el.dataset.arg), { op: el.value }),
    edValue: (el) => patchClause(Number(el.dataset.arg), { value: el.value }),
    edThen: (el) => patchEd({ then: el.value })
  };

  $app.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el || el.disabled) return;
    const fn = ACT[el.dataset.act];
    if (fn) fn(el.dataset.arg, el);
  });
  $app.addEventListener('input', (e) => {
    const el = e.target;
    const fn = INPUT[el.dataset && el.dataset.input];
    if (fn) fn(el.value, el.dataset.arg);
  });
  $app.addEventListener('change', (e) => {
    const el = e.target;
    const fn = CHANGE[el.dataset && el.dataset.change];
    if (fn) fn(el);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (S.editor) set({ editor: null });
    else if (S.view) set({ view: null });
  });

  /* ---------- 啟動 ---------- */
  window.DataSource.loadOrg()
    .then((raw) => { M = window.OrgModel.build(raw); render(); })
    .catch((err) => {
      $app.innerHTML = '<div class="load-error" role="alert"><h1>無法載入組織資料</h1><p>' + esc(err.message) + '</p>'
        + '<p class="muted">請確認 data/org.js 的內容格式正確（說明見 README.md）。</p></div>';
    });
})();
