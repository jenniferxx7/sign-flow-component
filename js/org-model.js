/*
 * 組織模型：把組織資料轉成畫面使用的 8 種簽核來源，並依關卡設定算出實際簽核人。
 * 部門主管、組織層級、表單關係人等「依申請人動態帶入」的人員，以 sample.applicantId 指定的申請人示範。
 *
 * 簽核人解析規則（resolve）：
 * - 主管類來源（部門主管、組織層級）：可選主管、副主管；同層兩者都簽時順序為副主管 → 主管。
 *   有勾主管時缺副主管只略過副主管；只勾副主管卻缺副主管時，改由同層主管簽。
 *   申請人本身是該層主管或副主管時，不列為簽核人（直屬主管從申請人的上一位主管算起）。
 * - 不在職（離職、留職停薪）或職位空缺，輪到該關時依 absent 設定：
 *   主管類 up＝往上一層找、deputy＝改由職務代理人簽、skip＝略過此關；
 *   其他來源 boss＝由該員工的主管簽、deputy＝改由職務代理人簽、skip＝略過此關。
 *   群組、角色、部門成員有多位時，部分不在職由在職成員簽，全部不在職才依設定處理。
 * - 找不到簽核人（組織沒有該層級、沒有成員等），依 notfound 設定：top＝由最高主管簽、skip＝略過此關、block＝不准送出。
 */
(function () {
  'use strict';

  const ACTIVE = '在職';

  function build(raw) {
    const emps = new Map(raw.employees.map((e) => [e.id, e]));
    const depts = new Map(raw.departments.map((d) => [d.id, d]));
    const sample = raw.sample || {};
    const applicant = emps.get(sample.applicantId) || raw.employees[0];
    const topDept = raw.departments.find((d) => !d.parentId) || null;

    const statusOf = (id) => { const e = emps.get(id); return e ? (e.status || ACTIVE) : ''; };
    const isActive = (id) => statusOf(id) === ACTIVE;
    function person(id, extra) {
      const e = emps.get(id);
      if (!e) return null;
      const d = depts.get(e.deptId);
      return Object.assign({ id: e.id, name: e.name, title: (d ? d.name + ' ' : '') + e.title, status: e.status || ACTIVE }, extra || {});
    }
    const people = (ids) => ids.map((id) => person(id)).filter(Boolean);
    const membersOf = (deptId) => raw.employees.filter((e) => e.deptId === deptId).map((e) => e.id);
    const deputiesOf = (d) => (d && d.deputyIds) || [];
    const parentOf = (d) => (d && d.parentId ? depts.get(d.parentId) : null);
    const name = (id) => (emps.get(id) || {}).name || id;

    // 申請人所屬部門往上的部門鏈（含自己的部門）
    function deptChain(empId) {
      const out = [];
      const e = emps.get(empId);
      let d = e ? depts.get(e.deptId) : null;
      while (d) { out.push(d); d = parentOf(d); }
      return out;
    }
    // 申請人往上的「主管層」：略過申請人自己就是主管的那一層，第 1 層就是直屬主管所在的部門
    function supervisorUnits(empId) {
      return deptChain(empId).filter((d) => d.managerId !== empId);
    }

    // 具名層級（不含最高層），由下往上排列，例如 部 → 處 → 中心
    const depthOf = (d) => { let n = 0; let p = parentOf(d); while (p) { n++; p = parentOf(p); } return n; };
    const levelDepth = {};
    raw.departments.forEach((d) => { if (d.parentId && d.level) levelDepth[d.level] = Math.max(levelDepth[d.level] || 0, depthOf(d)); });
    const levels = Object.keys(levelDepth).sort((a, b) => levelDepth[b] - levelDepth[a]);
    const top = topDept ? emps.get(topDept.managerId) : null;

    /* ---------- 簽核人解析 ---------- */
    const DEFAULT = { who: { mgr: true, deputy: false }, absent: null, notfound: 'top' };

    // 由最高主管簽、略過、不准送出
    function notFound(res, why, s) {
      res.notFound = true;
      res.notes.push(why);
      if (s.notfound === 'skip') { res.skip = true; res.reason = why + '，依設定略過此關'; return res; }
      if (s.notfound === 'block') { res.block = true; res.reason = why + '，依設定不准送出'; return res; }
      if (top && isActive(top.id)) {
        res.signers.push(person(top.id, { note: why + '，改由最高主管簽' }));
      } else { res.block = true; res.reason = why + '，且最高主管不在職'; }
      return res;
    }

    // 主管類：取得某一層的簽核人（依主管／副主管設定）；回傳 { list, absentMgr }
    function unitSigners(d, s, appId) {
      const list = [];
      const notes = [];
      const wantDep = s.who.deputy;
      const wantMgr = s.who.mgr;
      const deps = deputiesOf(d).filter((id) => id !== appId);
      const depActive = deps.filter(isActive);
      deps.filter((id) => !isActive(id)).forEach((id) => notes.push('副主管' + name(id) + statusOf(id) + '，略過'));
      let needMgr = wantMgr;
      if (wantDep) {
        depActive.forEach((id) => list.push(person(id, { role: '副主管' })));
        if (!depActive.length && !wantMgr) { needMgr = true; notes.push(d.name + '沒有在職的副主管，改由同層主管簽'); }
      }
      let absentMgr = null;
      if (needMgr) {
        const m = d.managerId && d.managerId !== appId ? d.managerId : null;
        if (m && isActive(m)) list.push(person(m, { role: '主管' }));
        else if (d.managerId !== appId) absentMgr = m || 'vacant';
      }
      return { list, notes, absentMgr };
    }

    // 不在職的主管：依設定往上一層、找代理人或略過；回傳 'up' | 'skip' | person
    function handleAbsentMgr(absentMgr, s, res, d) {
      const who = absentMgr === 'vacant' ? d.name + '主管職位空缺' : '主管' + name(absentMgr) + statusOf(absentMgr);
      const rule = s.absent || 'up';
      if (rule === 'skip') { res.skip = true; res.reason = who + '，依設定略過此關'; return 'skip'; }
      if (rule === 'deputy' && absentMgr !== 'vacant') {
        const dep = (emps.get(absentMgr) || {}).deputyId;
        if (dep && isActive(dep)) return person(dep, { note: who + '，改由職務代理人簽' });
        res.notes.push(who + '，沒有在職的職務代理人，改為往上一層找');
        return 'up';
      }
      res.notes.push(who + '，往上一層找');
      return 'up';
    }

    // 單一層級（部門主管、第 N 層主管）
    function resolveUnit(start, s, appId, missingWhy) {
      const res = { signers: [], notes: [], skip: false, block: false, reason: '' };
      let d = start;
      let cur = s;
      if (!d) return notFound(res, missingWhy, s);
      while (d) {
        const u = unitSigners(d, cur, appId);
        res.notes.push(...u.notes);
        if (u.absentMgr) {
          const r = handleAbsentMgr(u.absentMgr, cur, res, d);
          if (r === 'skip') { res.signers = []; return res; }
          res.signers.push(...u.list);
          if (r !== 'up') { res.signers.push(r); return res; }
          // 同層副主管照簽，往上一層只找主管
          cur = Object.assign({}, cur, { who: { mgr: true, deputy: false } });
        } else if (u.list.length) { res.signers.push(...u.list); return res; }
        d = parentOf(d);
        if (!d) return res.signers.length ? res : notFound(res, '往上已沒有更高層級', s);
      }
      return res;
    }

    // 逐級簽核：從直屬主管所在部門依序簽到指定層級（toLevel 為空表示簽到最高層）
    function resolveChain(appId, toLevel, s) {
      const res = { signers: [], notes: [], skip: false, block: false, reason: '' };
      const units = supervisorUnits(appId);
      const idx = toLevel ? units.findIndex((d) => d.level === toLevel) : units.length - 1;
      if (idx < 0) return notFound(res, '申請人往上的組織沒有「' + toLevel + '」層級', s);
      for (let i = 0; i <= idx; i++) {
        const d = units[i];
        const u = unitSigners(d, s, appId);
        res.notes.push(...u.notes);
        res.signers.push(...u.list);
        if (u.absentMgr) {
          const r = handleAbsentMgr(u.absentMgr, s, res, d);
          if (r === 'skip') { res.signers = []; return res; }
          if (r !== 'up') res.signers.push(r);
          else if (i === idx) {
            // 目標層級的主管不在職：往上一層找主管補上
            const more = resolveUnit(parentOf(d), Object.assign({}, s, { who: { mgr: true, deputy: false } }), appId, '往上已沒有更高層級');
            res.notes.push(...more.notes);
            res.signers.push(...more.signers);
            Object.assign(res, { skip: more.skip, block: more.block, reason: more.reason || res.reason, notFound: more.notFound });
          }
        }
      }
      // 同一人只簽一次（例如往上找到的主管剛好是下一層的主管）
      const seen = new Set();
      res.signers = res.signers.filter((p) => (seen.has(p.id) ? false : seen.add(p.id)));
      return res;
    }

    // 指定人員（指定員工、群組、角色、部門成員、表單關係人）
    function resolvePersons(ids, s, what) {
      const res = { signers: [], notes: [], skip: false, block: false, reason: '' };
      const list = ids.filter((id) => emps.has(id));
      if (!list.length) return notFound(res, what + '沒有可簽核的人員', s);
      const active = list.filter(isActive);
      if (active.length) {
        list.filter((id) => !isActive(id)).forEach((id) => res.notes.push(name(id) + statusOf(id) + '，不列入簽核，由其他在職成員簽'));
        res.excluded = list.length - active.length;
        res.signers = people(active);
        return res;
      }
      const rule = s.absent || 'boss';
      const who = list.length > 1 ? '所有成員都不在職' : name(list[0]) + statusOf(list[0]);
      if (rule === 'skip') { res.skip = true; res.reason = who + '，依設定略過此關'; return res; }
      if (rule === 'deputy') {
        const deps = [...new Set(list.map((id) => (emps.get(id) || {}).deputyId).filter((id) => id && isActive(id)))];
        if (deps.length) { res.signers = deps.map((id) => person(id, { note: who + '，改由職務代理人簽' })); return res; }
        res.notes.push(who + '，沒有在職的職務代理人，改由其主管簽');
      }
      const bosses = [];
      list.forEach((id) => {
        const e = emps.get(id);
        const r = resolveUnit(depts.get(e.deptId), { who: { mgr: true, deputy: false }, absent: 'up', notfound: s.notfound }, id, '找不到' + e.name + '的主管');
        r.signers.forEach((p) => { if (!bosses.some((b) => b.id === p.id)) bosses.push(Object.assign({}, p, { note: who + '，改由其主管簽' })); });
      });
      if (bosses.length) { res.signers = bosses; return res; }
      return notFound(res, who + '，也找不到其主管', s);
    }

    /* ---------- 8 種簽核來源 ---------- */
    const appDept = depts.get(applicant.deptId);
    const units = supervisorUnits(applicant.id);
    const fields = (raw.form.fields || []).map((f) => {
      const copy = Object.assign({}, f);
      if (f.type === 'rank') copy.options = raw.grades.slice();
      if (f.type === 'dept') { copy.type = 'enum'; copy.options = raw.departments.map((d) => d.name); }
      return copy;
    });
    const personFields = fields.filter((f) => f.type === 'person');
    const sampleValues = sample.values || {};
    const tagOf = (id) => (isActive(id) ? '' : '（' + statusOf(id) + '）');

    // rs：解析方式，供 resolve 使用
    const nth = (n) => ({ type: 'nth', n });
    const categories = {
      emp: {
        name: '指定員工', desc: '直接指定一位或多位員工作為簽核人', placeholder: '搜尋姓名、員編或部門', mode: 'all',
        // 已離職的員工不列入選項；留職停薪可能復職，保留並標示
        items: raw.employees.filter((e) => statusOf(e.id) !== '離職').map((e) => {
          const d = depts.get(e.deptId);
          return { id: e.id, label: e.name, sub: [d && d.name, e.title, e.id].filter(Boolean).join('｜') + tagOf(e.id), rs: { type: 'persons', ids: [e.id], what: e.name } };
        })
      },
      group: {
        name: '員工群組', desc: '由群組內成員簽核，可設定任一人或全部', placeholder: '搜尋群組名稱', mode: 'any',
        items: (raw.groups || []).map((g) => ({ id: g.id, label: g.name, sub: g.memberIds.length + ' 位成員', rs: { type: 'persons', ids: g.memberIds, what: '群組' } }))
      },
      dept: {
        name: '部門成員', desc: '指定部門內的成員作為簽核人', placeholder: '搜尋部門', mode: 'any',
        items: raw.departments.map((d) => {
          const ids = membersOf(d.id);
          return { id: d.id, label: d.name, sub: ids.length + ' 位成員', rs: { type: 'persons', ids, what: '部門' } };
        }).filter((x) => x.rs.ids.length)
      },
      head: {
        name: '部門主管', desc: '依部門帶出該部門主管或副主管，人事異動時自動更新', placeholder: '搜尋部門', mode: 'all', sup: true,
        items: [
          { id: 'self', label: '申請人所屬部門主管', sub: '依申請人部門動態帶入', howto: '申請人所屬部門的主管', example: true, rs: { type: 'unit', which: 'self' } },
          { id: 'parent', label: '申請人上一層部門主管', sub: '依申請人部門動態帶入', howto: '申請人上一層部門的主管', example: true, rs: { type: 'unit', which: 'parent' } }
        ].concat(raw.departments.filter((d) => d.managerId).map((d) => {
          const m = emps.get(d.managerId);
          return { id: 'dept:' + d.id, label: d.name + '主管', sub: '指定部門｜目前：' + (m ? m.name + tagOf(m.id) : '未設定'), rs: { type: 'unit', dept: d.id } };
        }))
      },
      org: {
        name: '組織層級', desc: '依申請人在組織架構中的位置，逐層往上簽核', placeholder: '搜尋層級', mode: 'all', sup: true,
        items: [
          { id: '1', label: '直屬主管', sub: '依申請人往上第 1 層', howto: '申請人的直屬主管（往上第 1 層部門的主管）', example: true, rs: nth(1) },
          { id: '2', label: '第 2 層主管', sub: '依申請人往上第 2 層', howto: '申請人往上第 2 層部門的主管', example: true, rs: nth(2) },
          { id: '3', label: '第 3 層主管', sub: '依申請人往上第 3 層', howto: '申請人往上第 3 層部門的主管', example: true, rs: nth(3) }
        ].concat(levels.map((lv) => ({
          id: 'lv:' + lv, label: '逐級簽核至' + lv + '級', sub: '自直屬主管起，依序簽至' + lv + '級主管', howto: '自申請人的直屬主管起，依序簽到' + lv + '級主管', example: true, seq: true, rs: { type: 'chain', to: lv }
        }))).concat([
          { id: 'to-top', label: '逐級簽核至' + (top ? top.title : '最高主管'), sub: '自直屬主管起，依序簽至最高主管', howto: '自申請人的直屬主管起，依序簽到最高主管', example: true, seq: true, rs: { type: 'chain', to: null } }
        ])
      },
      role: {
        name: '簽核角色', desc: '指定具備特定職能角色的人員', placeholder: '搜尋角色', mode: 'any',
        items: (raw.roles || []).map((r) => {
          const d = depts.get(r.deptId);
          return { id: r.id, label: r.name, sub: (d ? d.name + '｜' : '') + r.memberIds.length + ' 位成員', rs: { type: 'persons', ids: r.memberIds, what: '角色' } };
        })
      },
      rel: {
        name: '表單關係人', desc: '依表單內容帶出相關人員', placeholder: '搜尋關係人', mode: 'all',
        items: [
          { id: 'self', label: '申請人本人', sub: '送出表單的員工', howto: '送出表單的員工本人', example: true, rs: { type: 'persons', ids: [applicant.id], what: '申請人' } },
          { id: 'deputy', label: '申請人代理人', sub: '表單上填寫的職務代理人', howto: '申請人在表單上填寫的職務代理人', example: true, rs: { type: 'persons', ids: applicant.deputyId ? [applicant.deputyId] : [], what: '申請人代理人' } }
        ].concat(personFields.map((f) => ({
          id: 'field:' + f.key, label: '欄位「' + f.label + '」', sub: '取自表單欄位', howto: '表單欄位「' + f.label + '」填入的人員', example: true,
          rs: { type: 'persons', ids: sampleValues[f.key] ? [sampleValues[f.key]] : [], what: '欄位「' + f.label + '」' }
        })))
      },
      cond: {
        name: '條件式', desc: '符合條件時才加入此關卡，不符合則自動略過', placeholder: '搜尋條件', mode: 'all',
        items: []
      }
    };

    function run(rs, s, appId) {
      if (!rs) return { signers: [], notes: [], skip: false, block: false, reason: '' };
      if (rs.type === 'persons') return resolvePersons(rs.ids, s, rs.what);
      if (rs.type === 'chain') return resolveChain(appId, rs.to, s);
      if (rs.type === 'nth') return resolveUnit(supervisorUnits(appId)[rs.n - 1], s, appId, '申請人往上沒有第 ' + rs.n + ' 層主管');
      const ad = depts.get((emps.get(appId) || {}).deptId);
      if (rs.which === 'self') return resolveUnit(ad && ad.managerId === appId ? parentOf(ad) : ad, s, appId, '申請人沒有上一層部門');
      if (rs.which === 'parent') return resolveUnit(parentOf(ad && ad.managerId === appId ? parentOf(ad) : ad), s, appId, '申請人沒有上一層部門');
      return resolveUnit(depts.get(rs.dept), s, appId, '找不到指定部門');
    }

    function findItem(key) {
      const i = key.indexOf(':');
      const cat = categories[key.slice(0, i)];
      const item = cat ? cat.items.find((it) => it.id === key.slice(i + 1)) : null;
      return item ? { cat, item } : null;
    }

    // 依關卡設定解析簽核人；預設以範例申請人計算
    function resolve(key, settings, appId) {
      const hit = findItem(key);
      const s = Object.assign({}, DEFAULT, settings || {});
      s.who = Object.assign({}, DEFAULT.who, (settings && settings.who) || {});
      return run(hit && hit.item.rs, s, appId || applicant.id);
    }

    // 有多少員工會遇到「找不到簽核人」（設定畫面提醒用）
    function coverage(key, settings) {
      const hit = findItem(key);
      if (!hit || !hit.item.example || !(hit.item.rs.type === 'nth' || hit.item.rs.type === 'chain' || hit.item.rs.type === 'unit')) return null;
      const s = Object.assign({}, DEFAULT, settings || {}, { notfound: 'top' });
      const miss = raw.employees.filter((e) => run(hit.item.rs, s, e.id).notFound);
      return miss.length ? { count: miss.length, depts: [...new Set(miss.map((e) => (depts.get(e.deptId) || {}).name))] } : null;
    }

    // 範例申請人的預設結果（清單副標、快速加入判斷用）
    Object.values(categories).forEach((c) => c.items.forEach((it) => {
      it.people = run(it.rs, Object.assign({}, DEFAULT, { absent: c.sup ? 'up' : 'boss' }), applicant.id).signers;
    }));

    // 預設條件只保留「用到的欄位都在表單上、簽核人也找得到」的項目，避免條件和表單對不起來
    const condFields = new Set(fields.filter((f) => f.type !== 'person').map((f) => f.key));
    const hasApprover = (key) => !!findItem(key);
    const presets = (raw.form.presetConditions || []).filter((p) => {
      const missing = p.clauses.map((c) => c.field).filter((k) => !condFields.has(k));
      if (missing.length || !hasApprover(p.then)) {
        console.warn('[OrgModel] 略過預設條件「' + p.name + '」：' + (missing.length ? '表單沒有欄位 ' + missing.join('、') : '找不到簽核人 ' + p.then));
        return false;
      }
      return true;
    });

    return {
      raw,
      formName: raw.form.name,
      fields: fields.filter((f) => f.type !== 'person'),
      presets,
      categories,
      levels,
      resolve,
      coverage,
      applicant: person(applicant.id),
      appDept,
      depth: units.length,
      sample: { submittedAt: sample.submittedAt || '', values: sampleValues, inProgressCount: Number(sample.inProgressCount) || 0 }
    };
  }

  window.OrgModel = { build };
})();
