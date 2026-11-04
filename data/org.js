/*
 * 組織資料。更新組織時只需修改這個檔案（格式說明見 README.md）。
 * 以 JavaScript 檔載入，是為了讓 index.html 直接用瀏覽器開啟也能讀到資料。
 */
window.ORG_DATA = {
  "meta": {
    "company": "範例公司",
    "updatedAt": "2026-11-04",
    "note": "此為範例資料，請以 HR 系統匯出的實際組織資料取代。"
  },
  "grades": ["專員", "資深專員", "主任", "經理", "資深經理", "協理", "處長", "副總經理", "總經理"],
  "departments": [
    { "id": "CEO", "name": "總經理室", "parentId": null, "level": "公司", "managerId": "E00001" },
    { "id": "OPS", "name": "營運中心", "parentId": "CEO", "level": "中心", "managerId": "E00002" },
    { "id": "DIV1", "name": "營運處", "parentId": "OPS", "level": "處", "managerId": "E00010" },
    { "id": "DIV2", "name": "管理處", "parentId": "OPS", "level": "處", "managerId": "E00011" },
    { "id": "SALES", "name": "業務部", "parentId": "DIV1", "level": "部", "managerId": "E10301" },
    { "id": "DESIGN", "name": "產品設計部", "parentId": "DIV1", "level": "部", "managerId": "E10201" },
    { "id": "IT", "name": "資訊部", "parentId": "DIV1", "level": "部", "managerId": "E10401" },
    { "id": "HR", "name": "人力資源部", "parentId": "DIV2", "level": "部", "managerId": "E10057" },
    { "id": "FIN", "name": "財務部", "parentId": "DIV2", "level": "部", "managerId": "E10112" },
    { "id": "LEGAL", "name": "法務部", "parentId": "DIV2", "level": "部", "managerId": "E10501" },
    { "id": "ADMIN", "name": "行政管理部", "parentId": "DIV2", "level": "部", "managerId": "E10601" }
  ],
  "employees": [
    { "id": "E00001", "name": "林宏達", "deptId": "CEO", "title": "總經理", "grade": "總經理" },
    { "id": "E00002", "name": "蘇明德", "deptId": "OPS", "title": "副總經理", "grade": "副總經理" },
    { "id": "E00010", "name": "高振宇", "deptId": "DIV1", "title": "處長", "grade": "處長" },
    { "id": "E00011", "name": "何美惠", "deptId": "DIV2", "title": "處長", "grade": "處長" },
    { "id": "E10301", "name": "吳俊傑", "deptId": "SALES", "title": "經理", "grade": "經理" },
    { "id": "E10388", "name": "張雅婷", "deptId": "SALES", "title": "業務專員", "grade": "專員", "deputyId": "E10392" },
    { "id": "E10392", "name": "賴冠宇", "deptId": "SALES", "title": "業務專員", "grade": "專員" },
    { "id": "E10201", "name": "劉家豪", "deptId": "DESIGN", "title": "經理", "grade": "經理" },
    { "id": "E10231", "name": "王小明", "deptId": "DESIGN", "title": "資深設計師", "grade": "資深專員" },
    { "id": "E10245", "name": "楊詩涵", "deptId": "DESIGN", "title": "設計師", "grade": "專員" },
    { "id": "E10401", "name": "許文華", "deptId": "IT", "title": "經理", "grade": "經理" },
    { "id": "E10204", "name": "黃建宏", "deptId": "IT", "title": "資深工程師", "grade": "資深專員" },
    { "id": "E10418", "name": "蔡宗翰", "deptId": "IT", "title": "資安工程師", "grade": "專員" },
    { "id": "E10057", "name": "陳怡君", "deptId": "HR", "title": "人資經理", "grade": "經理" },
    { "id": "E10063", "name": "謝佳穎", "deptId": "HR", "title": "招募專員", "grade": "專員" },
    { "id": "E10071", "name": "郭志明", "deptId": "HR", "title": "薪酬專員", "grade": "專員" },
    { "id": "E10112", "name": "林志豪", "deptId": "FIN", "title": "會計主任", "grade": "主任" },
    { "id": "E10118", "name": "曾柏翰", "deptId": "FIN", "title": "會計", "grade": "專員" },
    { "id": "E10125", "name": "洪淑芬", "deptId": "FIN", "title": "出納", "grade": "專員" },
    { "id": "E10501", "name": "方振國", "deptId": "LEGAL", "title": "法務主管", "grade": "經理" },
    { "id": "E10276", "name": "李佩珊", "deptId": "LEGAL", "title": "法務專員", "grade": "專員" },
    { "id": "E10601", "name": "鄭雅文", "deptId": "ADMIN", "title": "行政主任", "grade": "主任" },
    { "id": "E10612", "name": "周美玲", "deptId": "ADMIN", "title": "採購專員", "grade": "專員" }
  ],
  "groups": [
    { "id": "G01", "name": "採購審核小組", "memberIds": ["E10112", "E10612", "E10301", "E10401", "E10601"] },
    { "id": "G02", "name": "預算委員會", "memberIds": ["E10112", "E10057", "E10301", "E00010", "E00011"] },
    { "id": "G03", "name": "資安審查小組", "memberIds": ["E10401", "E10204", "E10276", "E10418"] }
  ],
  "roles": [
    { "id": "hr", "name": "人資窗口", "deptId": "HR", "memberIds": ["E10057", "E10063", "E10071"] },
    { "id": "fin", "name": "財務審核", "deptId": "FIN", "memberIds": ["E10112", "E10118"] },
    { "id": "legal", "name": "法務審核", "deptId": "LEGAL", "memberIds": ["E10501", "E10276"] },
    { "id": "sec", "name": "資安長", "deptId": "IT", "memberIds": ["E10401"] },
    { "id": "ga", "name": "總務", "deptId": "ADMIN", "memberIds": ["E10601", "E10612"] }
  ],
  "form": {
    "name": "費用報銷單",
    "fields": [
      { "key": "amount", "label": "申請金額", "type": "num", "unit": "元" },
      { "key": "category", "label": "費用類別", "type": "enum", "options": ["差旅", "交際", "採購", "訓練", "其他"] },
      { "key": "grade", "label": "申請人職等", "type": "rank" },
      { "key": "dept", "label": "申請人部門", "type": "dept" },
      { "key": "project", "label": "專案代碼", "type": "text" },
      { "key": "projectOwner", "label": "專案負責人", "type": "person" },
      { "key": "costOwner", "label": "成本中心主管", "type": "person" }
    ],
    "presetConditions": [
      { "id": "c1", "name": "金額超過 50,000", "logic": "and", "clauses": [{ "field": "amount", "op": ">", "value": "50000" }], "then": "head:dept:FIN", "otherwise": "skip" },
      { "id": "c2", "name": "職等協理以上", "logic": "and", "clauses": [{ "field": "grade", "op": "以上（含）", "value": "協理" }], "then": "org:to-top", "otherwise": "skip" },
      { "id": "c3", "name": "交際費用", "logic": "and", "clauses": [{ "field": "category", "op": "等於", "value": "交際" }], "then": "head:parent", "otherwise": "skip" },
      { "id": "c4", "name": "專案費用", "logic": "and", "clauses": [{ "field": "project", "op": "不為空" }], "then": "rel:field:projectOwner", "otherwise": "skip" }
    ]
  },
  "sample": {
    "note": "預覽用的範例申請單，用來示範「依申請人動態帶入」與簽核狀態畫面。",
    "applicantId": "E10388",
    "submittedAt": "11/03 09:20",
    "inProgressCount": 3,
    "values": { "amount": 45000, "category": "差旅", "project": "", "projectOwner": "E10301", "costOwner": "E00010" }
  }
};
