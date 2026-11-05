/*
 * 功能規格頁：左側內嵌 index.html?spec=1，右側為規格表。
 * 每個項次的 sel（CSS 選擇器）＋ text（選填，元素文字需包含）決定介面上標號的位置。
 * 說明文字支援 **粗體** 與 `程式碼`；陣列中的陣列為下一層清單。
 */
(function () {
  'use strict';

  const SPEC = [
    {
      name: '一、設定簽核關卡', path: '開啟頁面即為此畫面',
      items: [
        { f: '頁首', sel: '.topbar:has([data-act="save"]) .titles', d: ['顯示表單名稱與「設定簽核關卡」。', '已儲存過：顯示「目前生效：第 N 版」。'] },
        { f: '清除全部', sel: '[data-act="clear"]', d: ['移除流程中所有關卡及其設定，**需確認**。', '無關卡或儲存中：停用。'] },
        {
          f: '儲存流程', sel: '[data-act="save"]',
          d: ['無關卡：停用，並提示「請至少加入一個簽核關卡才能儲存」。', '第一次儲存為第 1 版；修改後儲存為下一版。', '有簽核中單據：先跳確認；0 張：直接儲存。', '成功：進入「簽核流程總覽」。', '失敗：顯示原因，按鈕改為「重新儲存」。'],
          r: '介接 `DataSource.saveFlow()`，目前未接後端。'
        },
        { f: '簽核來源', sel: '.nav', d: ['共 8 種，點選切換中間清單，並清空搜尋。', '各來源規則見第二節。'] },
        { f: '搜尋', sel: '.panel .search', d: ['依名稱、說明文字即時篩選。', '最多列 100 筆，超過時提示縮小範圍。', '無結果：顯示「找不到符合…」。'], r: '員工人數多時，建議改由伺服器搜尋。' },
        { f: '選項列', sel: '.opt-row .opt-main', d: ['點選開啟關卡詳細面板；未加入也可預覽。', '已加入或檢視中的列反白。'] },
        { f: '加入／已加入', sel: '.opt-row .pill-btn', d: ['「加入」：加到流程最後一關。', '「已加入」：點選移除，**需確認**。', '同一項目只能加入一次。'] },
        { f: '快速加入常用關卡', sel: '.empty-quick', d: ['流程沒有關卡時才顯示。', '直屬主管、申請人所屬部門主管、財務審核、人資審核，點選直接加入。'], r: '組織資料沒有該項目時不顯示。' },
        { f: '簽核流程', sel: '.timeline', d: ['依序顯示每關：序號、來源類型、名稱、簽核方式｜期限。', '起點「申請人送出表單」，終點「簽核完成，結案歸檔」。', '點選關卡開啟詳細面板。'] },
        { f: '調整順序、移除關卡', sel: '.tl-tools', d: ['上移／下移：第 1 關不可上移，最後一關不可下移。', '可直接拖曳關卡卡片排序。', '×：移除該關，**需確認**。'] },
        { f: '版本提示', sel: '.flow .version-note', d: ['已儲存的流程被修改時顯示。', '說明儲存後成為第 N+1 版，簽核中單據仍依原版本完成。'] }
      ]
    },
    {
      name: '二、簽核來源（8 種）', path: '點選左側簽核來源',
      items: [
        { f: '指定員工', sel: '.nav-btn[data-arg="emp"]', d: ['選項：全體員工，顯示部門｜職稱｜員編。', '簽核人：選定的員工。', '預設簽核方式：全部簽核。'], r: '資料：`employees`' },
        { f: '員工群組', sel: '.nav-btn[data-arg="group"]', d: ['選項：員工群組，顯示成員數。', '簽核人：群組全體成員。', '預設簽核方式：任一人簽核。', '可新增、編輯、刪除群組（第五節）。'], r: '資料：`groups`' },
        { f: '部門成員', sel: '.nav-btn[data-arg="dept"]', d: ['選項：各部門，顯示成員數。', '簽核人：該部門全體成員。', '預設簽核方式：任一人簽核。'], r: '資料：`departments`、`employees.deptId`' },
        {
          f: '部門主管', sel: '.nav-btn[data-arg="head"]',
          d: ['選項：', ['申請人所屬部門主管、申請人上一層部門主管：依申請人動態帶入。', '指定部門主管：顯示目前主管。'], '人事異動時，簽核人自動更新。', '預設簽核方式：全部簽核。'],
          r: '依 `departments.managerId` 計算。'
        },
        {
          f: '組織層級', sel: '.nav-btn[data-arg="org"]',
          d: ['選項：', ['直屬主管、第 2 層主管、第 3 層主管：依申請人往上推算。', '逐級簽核至處長、逐級簽核至最高主管：自直屬主管起依序簽核。'], '預設簽核方式：全部簽核；逐級項目為依序簽核。'],
          r: '依部門上下層關係與 `managerId` 計算。'
        },
        { f: '簽核角色', sel: '.nav-btn[data-arg="role"]', d: ['選項：簽核角色（如財務審核），顯示所屬部門、成員數。', '簽核人：角色全體成員。', '預設簽核方式：任一人簽核。', '可新增、編輯、刪除角色（第五節）。'], r: '資料：`roles`' },
        { f: '表單關係人', sel: '.nav-btn[data-arg="rel"]', d: ['選項：申請人本人、申請人代理人、表單中的人員欄位。', '簽核人：依該張表單內容帶入。', '預設簽核方式：全部簽核。'], r: '代理人取自 `employees.deputyId`。' },
        {
          f: '條件式', sel: '.nav-btn[data-arg="cond"]',
          d: ['選項：預設條件、自訂條件。', '符合條件才簽核此關；不符合時略過，或改由直屬主管簽核。', '可新增自訂條件（第四節）。', '預設簽核方式：全部簽核。'],
          r: '預設條件用到表單沒有的欄位，或找不到簽核人時，自動略過不顯示。'
        }
      ]
    },
    {
      name: '三、關卡詳細面板', path: '點選選項列，或流程中的關卡',
      items: [
        { f: '面板標頭', sel: '.overlay:not(.top) .drawer-head', d: ['顯示來源類型、第 N 關（已加入時）、名稱與說明。', '按 ×、Esc 或面板外側關閉。'] },
        { f: '觸發條件', sel: '.overlay:not(.top) h3', text: '觸發條件', d: ['僅條件式關卡顯示。', '列出條件、符合時的簽核人、不符合時的處理。', '自訂條件可按「編輯條件」修改。'] },
        { f: '簽核人員', sel: '.overlay:not(.top) h3', text: '簽核人員', d: ['列出姓名、部門職稱與人數。', '依申請人決定的來源：以範例申請人示意。', '員工群組、簽核角色：可按「編輯群組／角色」。'] },
        { f: '簽核方式', sel: '.overlay:not(.top) h3', text: '簽核方式', d: ['任一人簽核：一人同意即通過。', '全部簽核：所有人都需同意。', '逐級來源以「依序簽核」取代「全部簽核」。'] },
        { f: '簽核期限', sel: '.overlay:not(.top) h3', text: '簽核期限', d: ['不限、24、48、72 小時，預設 72 小時。', '有期限時選擇逾期處理：再次提醒（預設）、自動同意、轉呈上一層。'] },
        { f: '其他權限', sel: '.overlay:not(.top) h3', text: '其他權限', d: ['允許退回申請人：預設開。', '允許加簽其他人員：預設關。', '簽核人與申請人相同時自動略過：預設開。'] },
        { f: '面板按鈕', sel: '.overlay:not(.top) .drawer-foot', d: ['未加入：「關閉」、「加入為第 N 關」。', '已加入：「移除此關卡」（**需確認**）、「完成」。', '設定變更立即套用，不需另存。'] }
      ]
    },
    {
      name: '四、自訂條件', path: '條件式 →「新增自訂條件」，或自訂條件的「編輯條件」',
      items: [
        { f: '新增自訂條件', sel: '[data-act="newCond"]', d: ['開啟條件編輯器。'] },
        { f: '條件名稱', sel: '[data-input="edName"]', d: ['選填；留空時依條件內容自動命名。'] },
        {
          f: '觸發條件', sel: '.overlay.top h3', text: '觸發條件',
          d: ['多個條件時選擇：全部符合（且）、任一符合（或）。', '每個條件由「欄位＋比較方式＋值」組成，1～5 個。', '比較方式依欄位類型：', ['數字：> ≥ < ≤ = ≠', '選項：等於、不等於', '職級：以上（含）、以下（含）、等於、不等於', '文字：包含、等於、為空、不為空'], '值必填，「為空」「不為空」除外。'],
          r: '可用欄位取自 `form.fields`。'
        },
        { f: '符合時由誰簽核', sel: '[data-change="edThen"]', d: ['從組織層級、部門主管、簽核角色、表單關係人中選擇。'] },
        { f: '不符合時', sel: '.overlay.top h3', text: '不符合時', d: ['略過此關卡（預設）、改由直屬主管簽核。'] },
        { f: '規則預覽', sel: '.preview-box', d: ['以一句話即時顯示完整規則。'] },
        { f: '編輯器按鈕', sel: '.drawer-foot:has([data-act="edSave"])', d: ['新增：「儲存並加入流程」，加到最後一關。', '編輯：「儲存變更」。', '「刪除此條件」：**需確認**，已加入的關卡一併移除。', '值未填：提示「請填寫每個條件的值」，不儲存。'] }
      ]
    },
    {
      name: '五、員工群組、簽核角色', path: '簽核來源切到「員工群組」或「簽核角色」',
      items: [
        { f: '新增群組／角色', sel: '[data-act="newDir"]', d: ['開啟編輯器，建立新的群組或角色。'] },
        { f: '編輯群組／角色', sel: '[data-act="editDir"]', d: ['每列的筆型圖示，或詳細面板的「編輯群組／角色」。'] },
        { f: '名稱', sel: '[data-input="mbName"]', d: ['必填，不可與現有名稱重複。', '按儲存時檢查，錯誤顯示於欄位下方。'] },
        { f: '所屬部門', sel: '[data-change="mbDept"]', d: ['僅簽核角色有此欄位。', '預設「不限部門」。'] },
        { f: '已選成員', sel: '.overlay.top h3', text: '已選成員', d: ['顯示人數與成員標籤，按 × 移除。', '至少 1 位。'] },
        { f: '加入成員', sel: '[data-input="mbQ"]', d: ['依姓名、員編、部門搜尋，勾選加入或取消。', '最多列 50 位，超過時提示縮小範圍。'] },
        { f: '使用中提示', sel: '.overlay.top .version-note', d: ['流程有用到時顯示第幾關。', '儲存後，該關卡的簽核人同步更新。'] },
        {
          f: '編輯器按鈕', sel: '.drawer-foot:has([data-act="mbSave"])',
          d: ['「建立群組／角色」或「儲存變更」。', '「刪除此群組／角色」：**需確認**；使用它的關卡（含指向它的預設條件）一併移除。', '儲存失敗：顯示原因，保留編輯內容。'],
          r: '介接 `DataSource.saveDirectory()`，目前未接後端，重新整理後還原。'
        }
      ]
    },
    {
      name: '六、確認對話框', path: '執行移除、刪除，或儲存新版本時',
      items: [
        { f: '確認對話框', sel: '.modal', d: ['出現時機：', ['移除關卡、清除全部。', '刪除自訂條件、刪除群組／角色。', '有簽核中單據時儲存新版本。'], '預設焦點在「取消」；Esc 或點外側取消。'] }
      ]
    },
    {
      name: '七、簽核流程總覽', path: '「儲存流程」成功後',
      items: [
        { f: '返回編輯', sel: '[data-act="back"]', d: ['回到設定畫面，保留目前設定。'] },
        { f: '儲存結果', sel: '.banner.ok', d: ['顯示版本與關卡數。', '有簽核中單據時，說明仍依前一版完成。'] },
        { f: '統計', sel: '.stats', d: ['簽核關卡數、條件式關卡數。', '最長簽核時間：各關期限加總；任一關不限時，顯示「不限」。'] },
        { f: '簽核流程設定', sel: '.setup-list', d: ['每關：名稱、來源、簽核人、簽核方式、條件。', '簽核人最多列 3 位，其餘顯示「另 N 人」。', '依申請人決定的來源：顯示「依申請人動態帶入」。'] },
        { f: '版本選單', sel: '.ver-menu', d: ['有 2 個以上版本才顯示。', '列出各版更新時間（到秒），標示「目前生效」或「已失效」。', '選擇舊版：唯讀檢視並顯示失效時間，可「回到目前版本」。'], r: '版本紀錄目前只存在頁面中。' },
        { f: '簽核情境', sel: '.tabs-big', d: ['未簽核、簽核中、簽核完成，切換下方進度。'], r: '示意用情境。' },
        { f: '簽核進度', sel: '.stepper', d: ['每關以圖示＋文字標示：已核准、簽核中、尚未開始。', '關卡數依實際設定。'] },
        { f: '查看完整簽核畫面', sel: '[data-act="openStatus"]', d: ['開啟單張表單的簽核畫面，沿用目前情境。'] }
      ]
    },
    {
      name: '八、完整簽核畫面', path: '總覽 →「查看完整簽核畫面」',
      items: [
        { f: '返回簽核流程總覽', sel: '[data-act="toOverview"]', d: ['回到總覽。'] },
        { f: '情境切換', sel: '.seg-inline', d: ['同總覽的三種情境。', '標題旁的狀態標籤同步變更。'] },
        { f: '申請內容', sel: '.card.side', d: ['申請人、費用類別、申請金額、送出時間。', '套用流程：送出當時的版本，之後修改流程不影響此單。', '進度條：已完成關數 / 總關數，及目前關卡。'], r: '申請人與時間為範例資料。' },
        { f: '簽核進度', sel: '.tl2', d: ['每關：狀態、簽核方式｜期限、條件、簽核人與簽核時間。', '簽核中：顯示已簽人數與剩餘時間。', '任一人簽核：完成後只列實際簽核者。', '每關最多列 3 位簽核人。'] }
      ]
    },
    {
      name: '九、系統狀態', path: '右下角「畫面示意」切換',
      items: [
        { f: '載入中', sel: '.state-center', d: ['骨架畫面＋「正在載入組織資料…」。'] },
        { f: '載入失敗', sel: '.state-card', d: ['顯示錯誤原因與「重新載入」。'] },
        { f: '儲存失敗', sel: '.note.error', d: ['頁首顯示失敗原因，按鈕改為「重新儲存」。', '已設定的關卡保留。'] },
        { f: '畫面示意', sel: '.demo-menu summary', d: ['切換正常、載入中、載入失敗、儲存失敗。', '開啟面板或對話框時隱藏。'], r: '僅供示意，正式上線前移除。' }
      ]
    }
  ];

  /* ---------- 規格表 ---------- */
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const rich = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`(.+?)`/g, '<code>$1</code>');
  const list = (arr) => '<ul>' + arr.map((x, i) => Array.isArray(x) ? '' : '<li>' + rich(x) + (Array.isArray(arr[i + 1]) ? list(arr[i + 1]) : '') + '</li>').join('') + '</ul>';

  const ITEMS = [];
  let n = 0;
  const rows = SPEC.map((sec) => '<tr class="sec"><td colspan="4"><span class="sec-name">' + esc(sec.name) + '</span><span class="sec-path">進入：' + esc(sec.path) + '</span></td></tr>'
    + sec.items.map((it) => {
      n += 1;
      ITEMS.push({ n, sel: it.sel, text: it.text || '', path: sec.path });
      return '<tr class="item" id="spec-' + n + '" data-n="' + n + '"><td class="num"><span>' + n + '</span></td><td class="fn">' + esc(it.f) + '</td><td>' + list(it.d) + '</td><td class="note">' + (it.r ? rich(it.r) : '—') + '</td></tr>';
    }).join('')).join('');
  document.getElementById('specBody').innerHTML = rows;

  /* ---------- 與介面溝通 ---------- */
  const frame = document.getElementById('ui');
  const box = document.getElementById('frameBox');
  const pins = document.getElementById('showPins');
  const toast = document.getElementById('toast');
  const send = (m) => { m.source = 'sign-flow-spec-parent'; if (frame.contentWindow) frame.contentWindow.postMessage(m, '*'); };
  const sendMarkers = () => send({ type: 'markers', items: ITEMS.map((x) => ({ n: x.n, sel: x.sel, text: x.text })), show: pins.checked });
  // 介面先載入完成時，「ready」可能早於這裡的監聽，所以 iframe 載入後也主動送一次。
  // 若瀏覽器用了快取的舊版 index.html（沒有載入標號程式），在同網域時直接補載入。
  let gotReady = false;
  frame.addEventListener('load', () => {
    gotReady = false;
    sendMarkers();
    setTimeout(() => {
      if (gotReady) return;
      try {
        const d = frame.contentDocument;
        if (!d || !d.body) return;
        const s = d.createElement('script');
        s.src = 'js/spec-markers.js?v=2';
        d.body.appendChild(s);
      } catch (e) { /* 本機開啟時無法存取，index.html 本身已載入標號程式 */ }
    }, 1000);
  });
  sendMarkers();
  let toastTimer = 0;
  function say(text) {
    toast.textContent = text;
    toast.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('on'), 2600);
  }
  function highlight(num, scroll) {
    document.querySelectorAll('tr.item.hl').forEach((r) => r.classList.remove('hl'));
    const row = document.getElementById('spec-' + num);
    if (!row) return;
    row.classList.add('hl');
    if (scroll) row.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  window.addEventListener('message', (e) => {
    const m = e.data;
    if (!m || m.source !== 'sign-flow-spec' || e.source !== frame.contentWindow) return;
    if (m.type === 'ready') { gotReady = true; sendMarkers(); }
    if (m.type === 'visible') {
      const on = new Set(m.nums);
      document.querySelectorAll('tr.item').forEach((r) => r.classList.toggle('live', on.has(Number(r.dataset.n))));
    }
    if (m.type === 'pick') {
      if (document.getElementById('split').dataset.mode === 'ui-full') setMode('half');
      highlight(m.n, true);
    }
    if (m.type === 'missing') {
      const it = ITEMS.find((x) => x.n === m.n);
      say('項次 ' + m.n + ' 不在目前畫面。進入方式：' + (it ? it.path : ''));
    }
  });

  document.getElementById('specBody').addEventListener('click', (e) => {
    const row = e.target.closest('tr.item');
    if (!row) return;
    const num = Number(row.dataset.n);
    highlight(num, false);
    if (document.getElementById('split').dataset.mode === 'spec-full') { say('切換到其他版面即可看到介面上的位置'); return; }
    send({ type: 'focus', n: num });
  });
  pins.addEventListener('change', () => send({ type: 'show', show: pins.checked }));

  /* ---------- 版面切換與介面縮放 ---------- */
  // 介面以 1280px 寬排版，窗格較窄時等比縮小，維持桌機版面
  const BASE = 1280;
  function fit() {
    const w = box.clientWidth;
    const h = box.clientHeight;
    if (!w || !h) return;
    const s = Math.min(1, w / BASE);
    frame.style.width = (s < 1 ? BASE : w) + 'px';
    frame.style.height = Math.ceil(h / s) + 'px';
    frame.style.transform = s < 1 ? 'scale(' + s + ')' : '';
  }
  function setMode(mode) {
    document.getElementById('split').dataset.mode = mode;
    document.querySelectorAll('.modes button').forEach((b) => b.classList.toggle('on', b.dataset.mode === mode));
    try { localStorage.setItem('spec-mode', mode); } catch (e) { /* 無法儲存時忽略 */ }
  }
  document.querySelector('.modes').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-mode]');
    if (b) setMode(b.dataset.mode);
  });
  try { const saved = localStorage.getItem('spec-mode'); if (saved) setMode(saved); } catch (e) { /* 忽略 */ }
  new ResizeObserver(fit).observe(box);
  fit();
})();
