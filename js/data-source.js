/*
 * 資料層：頁面讀取與儲存資料都只經過這裡。
 * 目前讀取 repo 內的 data/org.js（window.ORG_DATA）；之後要接 HR 系統，只需改寫這個檔案，
 * 讓 loadOrg() 回傳相同格式的資料（格式說明見 README.md），例如改成：
 *   const res = await fetch('/api/org'); return res.json();
 *
 * 網址加上 ?demo=loading、?demo=load-error、?demo=save-error 可預覽對應的狀態畫面。
 */
(function () {
  'use strict';

  const DEMO = new URLSearchParams(window.location.search).get('demo');
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  async function loadOrg() {
    if (DEMO === 'loading') return new Promise(() => {}); // 停在載入中，方便檢視畫面
    await wait(400);
    if (DEMO === 'load-error') throw new Error('連線逾時，無法取得組織資料。');
    if (!window.ORG_DATA) throw new Error('找不到組織資料，請確認 data/org.js 存在且格式正確。');
    return window.ORG_DATA;
  }

  // 儲存簽核流程。回傳 { ok: true } 或 { ok: false, message }。
  // 目前只在主控台輸出，接上後端時改成呼叫 API。
  async function saveFlow(flow) {
    await wait(800);
    if (DEMO === 'save-error') return { ok: false, message: '伺服器暫時無法回應，請稍後再試。' };
    console.info('[DataSource] saveFlow', flow);
    return { ok: true };
  }

  window.DataSource = { loadOrg, saveFlow };
})();
