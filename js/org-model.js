/*
 * 組織模型：把 org.json 轉成畫面使用的 8 種簽核來源。
 * 部門主管、組織層級、表單關係人等「依申請人動態帶入」的人員，
 * 以 sample.applicantId 指定的申請人示範。
 */
(function () {
  'use strict';

  function build(raw) {
    const emps = new Map(raw.employees.map((e) => [e.id, e]));
    const depts = new Map(raw.departments.map((d) => [d.id, d]));
    const sample = raw.sample || {};
    const applicant = emps.get(sample.applicantId) || raw.employees[0];

    function person(id) {
      const e = emps.get(id);
      if (!e) return null;
      const d = depts.get(e.deptId);
      return { id: e.id, name: e.name, title: (d ? d.name + ' ' : '') + e.title };
    }
    const people = (ids) => ids.map(person).filter(Boolean);
    const membersOf = (deptId) => raw.employees.filter((e) => e.deptId === deptId).map((e) => e.id);

    // 由申請人所屬部門往上逐層取主管（略過申請人本人與重複的人）
    function managerChain(empId, stopLevel) {
      const out = [];
      const e = emps.get(empId);
      let d = e ? depts.get(e.deptId) : null;
      while (d) {
        if (d.managerId && d.managerId !== empId && !out.includes(d.managerId)) out.push(d.managerId);
        if (stopLevel && d.level === stopLevel) break;
        d = d.parentId ? depts.get(d.parentId) : null;
      }
      return out;
    }

    const chain = managerChain(applicant.id);
    const appDept = depts.get(applicant.deptId);
    const parentDept = appDept && appDept.parentId ? depts.get(appDept.parentId) : null;
    const top = chain.length ? emps.get(chain[chain.length - 1]) : null;

    const fields = (raw.form.fields || []).map((f) => {
      const copy = Object.assign({}, f);
      if (f.type === 'rank') copy.options = raw.grades.slice();
      if (f.type === 'dept') { copy.type = 'enum'; copy.options = raw.departments.map((d) => d.name); }
      return copy;
    });
    const personFields = fields.filter((f) => f.type === 'person');
    const sampleValues = sample.values || {};

    const categories = {
      emp: {
        name: '指定員工', desc: '直接指定一位或多位員工作為簽核人', placeholder: '搜尋姓名、員編或部門', mode: 'all',
        items: raw.employees.map((e) => {
          const d = depts.get(e.deptId);
          return { id: e.id, label: e.name, sub: [d && d.name, e.title, e.id].filter(Boolean).join('｜'), people: people([e.id]) };
        })
      },
      group: {
        name: '員工群組', desc: '由群組內成員簽核，可設定任一人或全部', placeholder: '搜尋群組名稱', mode: 'any',
        items: (raw.groups || []).map((g) => ({ id: g.id, label: g.name, sub: g.memberIds.length + ' 位成員', people: people(g.memberIds) }))
      },
      dept: {
        name: '部門成員', desc: '指定部門內的成員作為簽核人', placeholder: '搜尋部門', mode: 'any',
        items: raw.departments.map((d) => {
          const ids = membersOf(d.id);
          return { id: d.id, label: d.name, sub: ids.length + ' 位成員', people: people(ids) };
        }).filter((x) => x.people.length)
      },
      head: {
        name: '部門主管', desc: '依部門帶出該部門主管，人事異動時自動更新', placeholder: '搜尋部門', mode: 'all',
        items: [
          { id: 'self', label: '申請人所屬部門主管', sub: '依申請人部門動態帶入', example: true, people: people(chain.slice(0, 1)) },
          { id: 'parent', label: '申請人上一層部門主管', sub: '依申請人部門動態帶入', example: true, people: people(parentDept && parentDept.managerId ? [parentDept.managerId] : []) }
        ].concat(raw.departments.filter((d) => d.managerId).map((d) => {
          const m = emps.get(d.managerId);
          return { id: 'dept:' + d.id, label: d.name + '主管', sub: '指定部門｜目前：' + (m ? m.name : '未設定'), people: people([d.managerId]) };
        }))
      },
      org: {
        name: '組織層級', desc: '依申請人在組織架構中的位置，逐層往上簽核', placeholder: '搜尋層級', mode: 'all',
        items: [
          { id: '1', label: '直屬主管', sub: '依申請人往上第 1 層', example: true, people: people(chain.slice(0, 1)) },
          { id: '2', label: '第 2 層主管', sub: '依申請人往上第 2 層', example: true, people: people(chain.slice(1, 2)) },
          { id: '3', label: '第 3 層主管', sub: '依申請人往上第 3 層', example: true, people: people(chain.slice(2, 3)) },
          { id: 'to-div', label: '逐級簽核至處長', sub: '自直屬主管起，依序簽至處級', example: true, seq: true, people: people(managerChain(applicant.id, '處')) },
          { id: 'to-top', label: '逐級簽核至' + (top ? top.title : '最高主管'), sub: '自直屬主管起，依序簽至最高主管', example: true, seq: true, people: people(chain) }
        ]
      },
      role: {
        name: '簽核角色', desc: '指定具備特定職能角色的人員', placeholder: '搜尋角色', mode: 'any',
        items: (raw.roles || []).map((r) => {
          const d = depts.get(r.deptId);
          return { id: r.id, label: r.name, sub: (d ? d.name + '｜' : '') + r.memberIds.length + ' 位成員', people: people(r.memberIds) };
        })
      },
      rel: {
        name: '表單關係人', desc: '依表單內容帶出相關人員', placeholder: '搜尋關係人', mode: 'all',
        items: [
          { id: 'self', label: '申請人本人', sub: '送出表單的員工', example: true, people: people([applicant.id]) },
          { id: 'deputy', label: '申請人代理人', sub: '表單上填寫的職務代理人', example: true, people: people(applicant.deputyId ? [applicant.deputyId] : []) }
        ].concat(personFields.map((f) => ({
          id: 'field:' + f.key, label: '欄位「' + f.label + '」', sub: '取自表單欄位', example: true,
          people: people(sampleValues[f.key] ? [sampleValues[f.key]] : [])
        })))
      },
      cond: {
        name: '條件式', desc: '符合條件時才加入此關卡，不符合則自動略過', placeholder: '搜尋條件', mode: 'all',
        items: []
      }
    };

    return {
      raw,
      formName: raw.form.name,
      fields: fields.filter((f) => f.type !== 'person'),
      presets: raw.form.presetConditions || [],
      categories,
      applicant: person(applicant.id),
      sample: { submittedAt: sample.submittedAt || '', values: sampleValues }
    };
  }

  window.OrgModel = { build };
})();
