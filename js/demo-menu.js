/* 「畫面示意」選單：標示目前正在檢視的狀態（網址參數 ?demo=...） */
(function () {
  'use strict';
  var demo = new URLSearchParams(window.location.search).get('demo') || '';
  document.querySelectorAll('.demo-menu a').forEach(function (a) {
    if (a.getAttribute('data-demo') === demo) a.setAttribute('aria-current', 'page');
  });
})();
