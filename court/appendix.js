#!/usr/bin/env node
'use strict';
// 법정(court) — 헌법 별표 생성기·대조기.
// 확인 수준 하한표([별표 2])와 금고 목록([별표 3])은 헌법에 실려야 규범이다(헌법 독점주의, 제14조 제6항 3호).
// 그런데 법정이 실제로 읽는 것은 JSON 이다. 사람이 표를 손으로 옮기면 둘이 어긋나고, 어긋난 쪽이 조용히 집행된다.
// 그래서 표는 JSON 에서 기계가 만들고, 정본 안의 표가 그 생성 결과와 글자 단위로 같은지 자가시험이 매번 대조한다.
//   node court/appendix.js --print 2|3
//   node court/appendix.js --check <헌법 정본 경로>
// 종료코드: 0 일치 · 1 불일치 · 2 사용법/도구 오류(일치가 아니다)
const fs = require('node:fs');
const path = require('node:path');
const grade = require('./lib/grade');
const { loadVault } = require('./vault-check');

const MARKERS = {
  2: { start: '<!-- court-appendix-2:start -->', end: '<!-- court-appendix-2:end -->' },
  3: { start: '<!-- court-appendix-3:start -->', end: '<!-- court-appendix-3:end -->' },
};

// 표 칸 안의 '|' 는 칸 구분자로 읽힌다. 낱말 패턴(정규식)에 '|' 가 많아서 반드시 막아야 표가 깨지지 않는다.
function cell(s) { return String(s).replace(/\\/g, '\\\\').replace(/\|/g, '\\|').replace(/\r?\n/g, ' '); }
// 코드 칸(` `) 안에서는 역슬래시가 글자 그대로 보이므로 '|' 만 막는다. 백틱은 코드 칸을 끊으므로 작은따옴표로 바꾼다.
function code(s) { return '`' + String(s).replace(/\|/g, '\\|').replace(/`/g, "'").replace(/\r?\n/g, ' ') + '`'; }
function table(head, rows) {
  const out = ['| ' + head.join(' | ') + ' |', '| ' + head.map(() => ':---').join(' | ') + ' |'];
  for (const r of rows) out.push('| ' + r.join(' | ') + ' |');
  return out;
}

// [별표 2] 확인 수준과 분야별 하한. 상민님이 읽는 표이므로 L 숫자를 쓰지 않고 이름만 쓴다(grade.label).
function renderAppendix2(floors) {
  const f = floors || grade.loadFloors();
  const L = [];
  L.push('**확인 수준(낮은 것부터)**');
  L.push('');
  L.push(...table(['확인 수준', '뜻'], grade.GRADES.map(g => [cell(g.label), cell(g.plain)])));
  L.push('');
  L.push('**분야별 하한** — 분야를 알 수 없는 주장의 하한: ' + cell(grade.label(f.unknownDomainFloor)));
  L.push('');
  L.push(...table(['분야', '최소 확인 수준', '뜻'], Object.entries(f.domains || {}).map(([id, d]) => [code(id), cell(grade.label(d.floor)), cell(d['뜻'] || '')])));
  L.push('');
  L.push('**걸린 파일 경로에 따른 하한**');
  L.push('');
  L.push(...table(['경로 패턴', '최소 확인 수준', '뜻'], (f.pathFloors || []).map(p => [code(p.pattern), cell(grade.label(p.floor)), cell(p['뜻'] || '')])));
  L.push('');
  L.push('**주장 문장의 낱말에 따른 하한**');
  L.push('');
  L.push(...table(['갈래', '낱말 패턴', '최소 확인 수준'], (f.keywordFloors || []).map(k => [cell(k.label), code(k.pattern), cell(grade.label(k.floor))])));
  return L.join('\n');
}

// [별표 3] 금고 목록. vault.json 에 적힌 순서 그대로 옮긴다(정렬하지 않는다 — 순서가 바뀐 것도 변경이다).
// 테스트 파일 목록은 금고 설계에 따라 열쇠 이름이 다르다(appendOnly=추가 전용, baseTests=기준 시험지 채점). 있는 열쇠만 싣는다.
// 열쇠가 생기거나 사라지면 표가 달라지므로 대조에서 드러난다 — 조용히 빠지는 길이 없다.
const TEST_LISTS = [
  ['appendOnly', '**추가만 할 수 있는 파일(추가 전용)**'],
  ['baseTests', '**테스트 파일(법정은 기준 커밋의 시험지로 채점한다)**'],
];
function renderAppendix3(vault) {
  const v = vault || loadVault();
  const L = [];
  L.push('**고칠 수 없는 파일(동결)**');
  L.push('');
  L.push(...table(['순번', '경로'], (v.frozen || []).map((p, i) => [String(i + 1), code(p)])));
  L.push('');
  L.push('**고칠 수 없는 설정 칸(동결)**');
  L.push('');
  L.push(...table(['파일', '칸'], Object.entries(v.frozenJsonKeys || {}).map(([file, keys]) => [code(file), (keys || []).map(code).join(', ')])));
  for (const [key, caption] of TEST_LISTS) {
    if (!Array.isArray(v[key])) continue;
    L.push('');
    L.push(caption);
    L.push('');
    L.push(...table(['순번', '경로'], v[key].map((p, i) => [String(i + 1), code(p)])));
  }
  // 분류는 뒤집혀 있다: 아래 목록만 "주장 없이 바꿔도 되는 파일"이고, 여기에도 동결에도 없는 나머지 변경은 전부 제품으로 본다.
  if (Array.isArray(v.neutral)) {
    L.push('');
    L.push('**주장 없이 바꿔도 되는 파일(배포 안 됨) — 이 목록·동결에 없는 나머지는 모두 제품**');
    L.push('');
    L.push(...table(['순번', '경로'], v.neutral.map((p, i) => [String(i + 1), code(p)])));
  }
  return L.join('\n');
}

// [승인 근거 검사] 버전 대장(CONSTITUTION_VERSIONS.md)의 마지막 행 승인 근거 칸에 병합 기록(PR #숫자)이 있는가.
// 승인 근거는 작업자가 쓸 수 없는 기록의 주소여야 한다 — 인용문만 있고 PR 번호가 없으면 효력이 없다(헌법 제14조 제8항 3호).
function lastLedgerRow(src) {
  const lines = src.split('\n');
  let hi = -1;
  for (let i = 0; i < lines.length; i++) { const t = lines[i].trim(); if (t.startsWith('|') && t.includes('승인 근거')) { hi = i; break; } }
  if (hi < 0) return null;
  const rows = [];
  for (let i = hi + 1; i < lines.length; i++) {
    const t = lines[i].trim();
    if (!t.startsWith('|')) break;
    if (/^\|[\s:|-]+\|?$/.test(t)) continue; // 구분선(:---)은 건너뛴다
    rows.push(t);
  }
  return rows.length ? rows[rows.length - 1] : null;
}

function checkLedger(ledgerPath) {
  let src;
  try { src = fs.readFileSync(ledgerPath, 'utf8').replace(/\r\n/g, '\n'); }
  catch (e) { return { ok: false, reason: '버전 대장을 읽을 수 없다: ' + e.message }; }
  const row = lastLedgerRow(src);
  if (!row) return { ok: false, reason: '버전 대장에서 승인 근거 표를 찾지 못했다' };
  const cells = row.split(/(?<!\\)\|/).map(s => s.trim());
  while (cells.length && cells[0] === '') cells.shift();
  while (cells.length && cells[cells.length - 1] === '') cells.pop();
  const basis = cells.length ? cells[cells.length - 1] : '';
  if (!/PR\s*#\s*\d+/.test(basis)) return { ok: false, reason: '버전 대장 마지막 행의 승인 근거 칸에 병합 기록(PR #숫자)이 없다: ' + basis.slice(0, 100), cell: basis };
  return { ok: true, cell: basis };
}

// 마커 사이 구간을 꺼낸다. 마커가 없거나 둘 이상이면 "대조했다"고 말할 수 없으므로 불일치로 돌려준다.
function extract(src, n) {
  const m = MARKERS[n];
  const s = src.indexOf(m.start), e = src.indexOf(m.end);
  if (s < 0 || e < 0) return { error: '마커가 없다(' + (s < 0 ? m.start : m.end) + ')' };
  if (src.indexOf(m.start, s + 1) >= 0 || src.indexOf(m.end, e + 1) >= 0) return { error: '마커가 둘 이상이다 — 어느 표가 정본인지 정할 수 없다' };
  if (e < s) return { error: '끝 마커가 시작 마커보다 앞에 있다' };
  let body = src.slice(s + m.start.length, e);
  if (body.startsWith('\n')) body = body.slice(1);
  if (body.endsWith('\n')) body = body.slice(0, -1);
  return { body, line: src.slice(0, s).split('\n').length + 1 };
}

function firstDiff(expected, actual) {
  const a = expected.split('\n'), b = actual.split('\n');
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) if (a[i] !== b[i]) return { offset: i, expected: a[i] === undefined ? null : a[i], actual: b[i] === undefined ? null : b[i] };
  return null;
}

// 정본 안의 [별표 2]·[별표 3] 구간이 JSON 에서 만든 결과와 글자 단위로 같은지 본다.
// 줄바꿈만은 맞춰서 본다: 이 저장소는 core.autocrlf 때문에 같은 커밋이 Windows 에서는 CRLF, CI(리눅스)에서는 LF 로 풀린다. 글자는 하나도 봐주지 않는다.
function check(constitutionPath, opts) {
  const o = opts || {};
  const mismatches = [];
  let src;
  try { src = fs.readFileSync(constitutionPath, 'utf8').replace(/\r\n/g, '\n'); }
  catch (e) { return { ok: false, mismatches: [{ appendix: null, reason: '정본을 읽을 수 없다: ' + e.message }] }; }
  const expected = { 2: renderAppendix2(o.floors), 3: renderAppendix3(o.vault) };
  for (const n of [2, 3]) {
    const got = extract(src, n);
    if (got.error) { mismatches.push({ appendix: n, reason: got.error }); continue; }
    if (got.body === expected[n]) continue;
    const d = firstDiff(expected[n], got.body);
    mismatches.push({ appendix: n, reason: '정본의 표와 JSON 에서 만든 표가 다르다', line: got.line + d.offset, expected: d.expected, actual: d.actual });
  }
  // 버전 대장의 마지막 행 승인 근거 칸에 병합 기록(PR #숫자)이 있는가. 없으면 근거 없는 행이 main 에 들어온 것이므로 실패로 알린다.
  // 버전 대장은 저장소의 정해진 자리(docs/rules)에 하나뿐이다. 검사 대상 파일 옆에서만 찾으면 헌법 사본(AGENTS.md·archive 사본)을 점검할 때 대장을 못 찾아 거짓 불일치가 난다.
  const beside = path.join(path.dirname(path.resolve(constitutionPath)), 'CONSTITUTION_VERSIONS.md');
  const ledgerPath = o.ledger || (fs.existsSync(beside) ? beside : path.join(__dirname, '..', 'docs', 'rules', 'CONSTITUTION_VERSIONS.md'));
  const led = checkLedger(ledgerPath);
  if (!led.ok) mismatches.push({ appendix: 'ledger', reason: led.reason });
  return { ok: mismatches.length === 0, mismatches };
}

module.exports = { renderAppendix2, renderAppendix3, check, checkLedger, lastLedgerRow, MARKERS };

if (require.main === module) {
  const [mode, arg] = process.argv.slice(2);
  if (mode === '--print' && (arg === '2' || arg === '3')) {
    process.stdout.write((arg === '2' ? renderAppendix2() : renderAppendix3()) + '\n');
  } else if (mode === '--check' && arg) {
    const r = check(path.resolve(arg));
    console.log(JSON.stringify(r, null, 2));
    process.exit(r.ok ? 0 : 1);
  } else {
    console.error('사용: node court/appendix.js --print 2|3\n      node court/appendix.js --check <헌법 정본 경로>');
    process.exit(2);
  }
}
