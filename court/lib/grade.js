'use strict';
// 법정(court) — 검증 등급. "통과했는가"보다 먼저 "어떤 수준으로 확인했는가"를 묻는다.
// 등급은 작업자가 적는 값이 아니라, 법정이 실제로 한 일에서 기계적으로 나온다.
const fs = require('node:fs');
const path = require('node:path');

const GRADES = [
  { id: 'L0', rank: 0, label: '확인 못 함', plain: '아직 확인하지 못했다' },
  { id: 'L1', rank: 1, label: '글자만 봄', plain: '코드·설정에 그렇게 적혀 있는 것만 봤다' },
  { id: 'L2', rank: 2, label: '부품만 돌려 봄', plain: '그 코드 조각을 따로 돌려 봤다(화면에서는 안 봄)' },
  { id: 'L3', rank: 3, label: 'PC 화면에서 눌러 봄', plain: '실제 브라우저에서 눌러 보고 결과를 확인했다' },
  { id: 'L4', rank: 4, label: '진짜 계정끼리 주고받아 봄', plain: '실서버에서 계정 2개로 주고받아 봤다' },
  { id: 'L5', rank: 5, label: '진짜 폰에서 해 봄', plain: '실제 폰에서 해 봤다' },
];
const BY_ID = Object.fromEntries(GRADES.map(g => [g.id, g]));

function rank(id) { return BY_ID[id] ? BY_ID[id].rank : -1; }
function isGrade(id) { return Object.prototype.hasOwnProperty.call(BY_ID, id); }
// 상민님용 문서에는 L 숫자를 쓰지 않는다(헌법 제8조의 '3단계·5단계'와 숫자가 겹쳐 혼선을 준다). 말로만 쓴다.
function label(id) { return BY_ID[id] ? BY_ID[id].label : String(id); }
function meets(achieved, required) { return rank(achieved) >= rank(required) && rank(required) >= 0; }
function min(a, b) { return rank(a) <= rank(b) ? a : b; }

function loadFloors(file) {
  const p = file || path.join(__dirname, '..', 'grade-floors.json');
  const j = JSON.parse(fs.readFileSync(p, 'utf8'));
  for (const [domain, d] of Object.entries(j.domains)) {
    if (!isGrade(d.floor)) throw new Error('grade-floors.json: ' + domain + ' 의 floor 가 등급이 아니다');
  }
  return j;
}

// 분야(domain)의 필수 등급 하한. 모르는 분야는 가장 엄격하게 본다(오표기로 하한을 낮추는 길을 막는다).
function floorFor(domain, floors) {
  const f = floors || loadFloors();
  const d = f.domains[domain];
  return d ? d.floor : f.unknownDomainFloor;
}

module.exports = { GRADES, rank, isGrade, label, meets, min, loadFloors, floorFor };
