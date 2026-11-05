/*
 * 規格文件用的標號：只在 index.html?spec=1 且被 spec.html 內嵌時啟用，平常開啟 index.html 不會有任何作用。
 * 標號定義由 spec.html 以 postMessage 傳入；點標號會通知外層定位到對應項次。
 */
(function () {
  'use strict';
  if (!/[?&]spec=1(&|$)/.test(window.location.search) || window.parent === window) return;

  var defs = [];
  var show = true;
  var layer = null;
  var pending = 0;
  var lastSent = null;

  function post(msg) { msg.source = 'sign-flow-spec'; window.parent.postMessage(msg, '*'); }

  function matches(d) {
    var list = document.querySelectorAll(d.sel);
    var out = [];
    for (var i = 0; i < list.length; i++) {
      if (!d.text || list[i].textContent.indexOf(d.text) >= 0) out.push(list[i]);
    }
    return out;
  }

  // 找出畫面上看得到、沒有被遮罩蓋住的第一個元素
  function visibleEl(d) {
    var list = matches(d);
    for (var i = 0; i < list.length; i++) {
      var el = list[i];
      var r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      if (r.bottom < 4 || r.top > window.innerHeight - 4 || r.right < 4 || r.left > window.innerWidth - 4) continue;
      var x = Math.min(Math.max(r.left + Math.min(10, r.width / 2), 1), window.innerWidth - 1);
      var y = Math.min(Math.max(r.top + Math.min(10, r.height / 2), 1), window.innerHeight - 1);
      var hit = document.elementFromPoint(x, y);
      if (hit && (el === hit || el.contains(hit))) return { el: el, r: r };
    }
    return null;
  }

  function draw() {
    pending = 0;
    if (!layer) return;
    layer.style.display = 'none';
    var placed = [];
    var html = '';
    var nums = [];
    defs.forEach(function (d) {
      var v = visibleEl(d);
      if (!v) return;
      nums.push(d.n);
      var x = Math.max(2, Math.min(v.r.left - 10, window.innerWidth - 26));
      var y = Math.max(2, Math.min(v.r.top - 10, window.innerHeight - 26));
      // 位置太近時往右錯開，避免標號重疊
      for (var k = 0; k < placed.length; k++) {
        if (Math.abs(placed[k][0] - x) < 22 && Math.abs(placed[k][1] - y) < 22) { x += 26; k = -1; }
      }
      placed.push([x, y]);
      html += '<button type="button" class="spec-pin" data-n="' + d.n + '" style="left:' + x + 'px;top:' + y + 'px" aria-label="規格項次 ' + d.n + '">' + d.n + '</button>';
    });
    layer.innerHTML = show ? html : '';
    layer.style.display = '';
    var sig = nums.join(',');
    if (sig !== lastSent) { lastSent = sig; post({ type: 'visible', nums: nums }); }
  }
  function schedule() { if (!pending) pending = window.requestAnimationFrame(draw); }

  function flash(el) {
    el.classList.add('spec-flash');
    window.setTimeout(function () { el.classList.remove('spec-flash'); }, 1600);
  }

  function focus(n) {
    var d = defs.filter(function (x) { return x.n === n; })[0];
    if (!d) return;
    var v = visibleEl(d);
    var el = v ? v.el : matches(d).filter(function (e) { var r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; })[0];
    if (!el) { post({ type: 'missing', n: n }); return; }
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    flash(el);
    window.setTimeout(schedule, 400);
  }

  window.addEventListener('message', function (e) {
    var m = e.data;
    if (!m || m.source !== 'sign-flow-spec-parent') return;
    if (m.type === 'markers') { defs = m.items || []; show = m.show !== false; lastSent = null; schedule(); }
    if (m.type === 'show') { show = !!m.show; schedule(); }
    if (m.type === 'focus') focus(m.n);
  });

  function init() {
    var style = document.createElement('style');
    style.textContent = '.spec-layer{position:fixed;inset:0;z-index:100;pointer-events:none}'
      + '.spec-pin{position:absolute;width:24px;height:24px;border-radius:50%;border:2px solid #fff;background:#D93A3A;color:#fff;font:700 12px/20px system-ui,sans-serif;text-align:center;padding:0;cursor:pointer;pointer-events:auto;box-shadow:0 2px 6px rgba(0,0,0,.3)}'
      + '.spec-pin:hover{transform:scale(1.15)}'
      + '.spec-flash{outline:3px solid #D93A3A !important;outline-offset:2px;border-radius:6px}';
    document.head.appendChild(style);
    layer = document.createElement('div');
    layer.className = 'spec-layer';
    document.body.appendChild(layer);
    layer.addEventListener('click', function (e) {
      var b = e.target.closest('.spec-pin');
      if (b) post({ type: 'pick', n: Number(b.dataset.n) });
    });
    // 「畫面示意」連結保留 spec=1，切換狀態後標號仍在
    document.querySelectorAll('.demo-menu a').forEach(function (a) {
      var href = a.getAttribute('href');
      a.setAttribute('href', href + (href.indexOf('?') >= 0 ? '&' : '?') + 'spec=1');
    });
    var app = document.getElementById('app');
    new MutationObserver(function () { schedule(); window.setTimeout(schedule, 250); }).observe(app, { childList: true, subtree: true });
    window.addEventListener('scroll', schedule, true);
    window.addEventListener('resize', schedule);
    document.addEventListener('toggle', schedule, true);
    post({ type: 'ready' });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
