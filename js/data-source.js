/*
 * 資料層：頁面讀取與儲存資料都只經過這裡。
 * 目前讀取 repo 內的 data/org.js（window.ORG_DATA）；之後要接 HR 系統，只需改寫這個檔案，
 * 讓 loadOrg() 回傳相同格式的資料（格式說明見 README.md），例如改成：
 *   const res = await fetch('/api/org'); return res.json();
 */
(function () {
  'use strict';

  async function loadOrg() {
    if (!window.ORG_DATA) throw new Error('找不到組織資料，請確認 data/org.js 存在且格式正確。');
    return window.ORG_DATA;
  }

  // 儲存簽核流程。目前只在主控台輸出，接上後端時改成呼叫 API。
  async function saveFlow(flow) {
    console.info('[DataSource] saveFlow', flow);
    return { ok: true };
  }

  window.DataSource = { loadOrg, saveFlow };
})();
