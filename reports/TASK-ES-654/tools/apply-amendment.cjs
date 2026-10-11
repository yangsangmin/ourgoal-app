#!/usr/bin/env node
'use strict';
// TASK-ES-654 — 헌법 개정 초안 v2026.10.11-ARGUMENTS 적용기(멱등).
// 고치는 조문은 CELL_SPLIT 5호 한 곳뿐이고, 나머지는 그 개정에 헌법 조문 14.3 이 요구하는 부수 기재다
// (버전 표기 3곳 · 직전 커널 archive · 법령 전문 머리 · 버전 대장 새 행 · 티켓 한 줄).
// 포인터(CLAUDE.md·AGENTS.md)·법령 전문 본문·제품 코드·생성기·시험은 건드리지 않는다.
//
//   node reports/TASK-ES-654/tools/apply-amendment.cjs [--root <저장소 루트>] [--base <직전 커널을 읽을 커밋, 기본 origin/main>]
//   node reports/TASK-ES-654/tools/apply-amendment.cjs --pr <PR 번호>     PR 생성 뒤 대장 행·법령 머리에 번호만 기입
//   --dry  쓰지 않고 무엇을 할지만 출력
//
// 멱등: 단계마다 「바꾼 뒤 글자」가 이미 있는지를 먼저 본다(작업참고 L044 — 앵커만 보면 재실행 때 중복된다).
// 바꾸기 전 글자가 정확히 한 번 있지 않으면 아무 파일도 쓰지 않고 멈춘다(종료코드 1).
// 줄바꿈(CRLF/LF)과 BOM 은 읽은 그대로 되쓴다. 한글은 리터럴이다.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');

const argv = process.argv.slice(2);
const opt = name => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : null; };
const ROOT = path.resolve(opt('--root') || path.join(__dirname, '..', '..', '..'));
const BASE = opt('--base') || 'origin/main';
const PR = opt('--pr');
const DRY = argv.includes('--dry');

const OLD_V = 'v2026.10.11-ALIGNED';
const NEW_V = 'v2026.10.11-ARGUMENTS';
const KERNEL = '01_OURGOAL_SUPREME_CONSTITUTION_FULL.md';
const STATUTE = 'docs/rules/OURGOAL_ABSOLUTE_INTEGRITY_RULES.md';
const LEDGER = 'docs/rules/CONSTITUTION_VERSIONS.md';
const TICKETS = 'docs/rules/TICKETS.md';
const ARCHIVE = 'docs/rules/archive/AGENTS_KERNEL_' + OLD_V + '.md';
const REQ = 'docs/specs/REQ-TASK-ES-654-CONSTITUTION-ARGUMENTS.md';
const BOM = String.fromCharCode(0xFEFF);

// ── 바뀌는 글자 ─────────────────────────────────────────────────────────────
const TITLE_OLD = '# [정본] 아워골 최고 헌법 ' + OLD_V + ' (OurGoal Supreme Constitution ' + OLD_V + ')';
const TITLE_NEW = '# [정본] 아워골 최고 헌법 ' + NEW_V + ' (OurGoal Supreme Constitution ' + NEW_V + ')';

const VERLINE_OLD_PREFIX = '> **버전**: ' + OLD_V + ' (';
const VERLINE_KEEP_FROM = '. 효력은 이 개정을 담은 PR 이';
const VERLINE_NEW_HEAD = '> **버전**: ' + NEW_V + ' (세포 분열 `arguments` 조항 개정 — CELL_SPLIT 5호 한 곳: 함수 선언을 선언째로 글자 그대로 옮길 때 그 함수 본문에서 쓰는, 그 함수 자신의 호출 인자를 가리키는 `arguments` 는 허용하고, 최상위 `this` 0 과 감싸기·화살표 함수의 `arguments` 0 은 그대로 둔다. 그 밖의 조문 내용 변경 0)';

const KID_OLD = '<system_kernel id="ourgoal-supreme-constitution-' + OLD_V.toLowerCase() + '">';
const KID_NEW = '<system_kernel id="ourgoal-supreme-constitution-' + NEW_V.toLowerCase() + '">';

const CLAUSE_OLD = '        5. 전역 이름을 새로 늘리지 않는다. 옮긴 함수의 최상위 `this`·`arguments` 는 0 이어야 한다.';
const CLAUSE_NEW = '        5. 전역 이름을 새로 늘리지 않는다. 옮긴 함수의 최상위 `this` 는 0 이어야 한다. 최상위 `arguments` 도 0 이어야 하되, 함수 선언(`function 이름(…) { … }` 꼴)을 선언째로 글자 그대로 옮길 때 그 함수 본문에서 쓰는 `arguments` 는 그 함수 자신의 호출 인자를 가리켜 옮겨도 뜻이 같으므로 허용한다. 이 허용은 거기까지다 — 감싸기로 옮기는 로드 중 문, 생성기가 새로 만든 감싸기 함수의 최상위, 화살표 함수 안의 `arguments`(바깥 함수의 것을 가리킨다)처럼 옮기면 뜻이 달라질 수 있는 꼴은 그대로 0 이어야 한다.';

const QUOTE = '「3. 함수 이전 사전 승인, 헌법 개정 승인 및 병합 사전 승인」';
const QUOTE_FULL = '「1. 887 병합완료 2. 철거 2차 사전 승인, 금고 변경 승인 3. 함수 이전 사전 승인, 헌법 개정 승인 및 병합 사전 승인 4. 완료기록 병합 사전 승인」';
const PR_PLACEHOLDER = '개정 초안 PR 번호: PR 생성 뒤 기입 (병합 금지·결심 대기. 병합 기록은 병합 뒤 기입)';
const prFilled = n => 'PR #' + n + ' 개정 초안(github.com/yangsangmin/ourgoal-app/pull/' + n + ' — 병합 금지·결심 대기. 병합 기록은 병합 뒤 기입)';
const QUOTE_NOTE = '참고(작업 세션이 옮겨 적은 인용이며 근거가 아니다): 상민님 발화 ' + QUOTE + ' — 2026-10-11, 커맨드센터 세션 309dca5d 대화(전체 문장 ' + QUOTE_FULL + '). 이 PR 을 만든 빌더 세션은 그 대화를 직접 보지 못했고 오케스트레이터 세션이 옮겨 준 글자다';
const SUMMARY = '세포 분열 절차 CELL_SPLIT 5호 한 곳 — 함수 선언을 선언째로 글자 그대로 옮길 때 그 함수 본문에서 쓰는, 그 함수 자신의 호출 인자를 가리키는 `arguments` 는 허용. 최상위 `this` 0 과 감싸기로 옮기는 로드 중 문·새로 만든 감싸기 함수의 최상위·화살표 함수 안의 `arguments` 0 은 그대로. 그 밖의 조문 변경 0 · 삭제 조항 0';

const STATUTE_CUR_OLD_PREFIX = '- **현행 커널 버전**: `' + OLD_V + '` — ';
const STATUTE_PREV_OLD_PREFIX = '- **직전 커널 버전**: `v2026.10.10-CORE` — ';
const STATUTE_CUR_NEW = '- **현행 커널 버전**: `' + NEW_V + '` — ' + PR_PLACEHOLDER + ' · ' + QUOTE_NOTE + '. 개정 요약: ' + SUMMARY + '. 이 문서(법령 전문) 본문 변경 0 — 전문에는 CELL_SPLIT 5호에 대응하는 조문이 없다. 상세는 `' + REQ + '`.';

const LEDGER_PREV_ROW_PREFIX = '| **`' + OLD_V + '`** (커널 + 법령 전문) | 2026-10-11 |';
const LEDGER_NEW_ROW_PREFIX = '| **`' + NEW_V + '`** (커널) | 2026-10-11 |';
const LEDGER_NEW_ROW = LEDGER_NEW_ROW_PREFIX + ' 상민님 | **커널 세포 분열 `arguments` 조항 개정**(TASK-ES-654, 지시함 DIR-004 묶음 5 · 결심 대기 표 「saveGoogleToken 의 arguments」 후속): CELL_SPLIT 5호 한 곳만 고쳤다 — 「옮긴 함수의 최상위 `this`·`arguments` 는 0 이어야 한다」를 「최상위 `this` 는 0 · 최상위 `arguments` 도 0 이되, 함수 선언을 선언째로 글자 그대로 옮길 때 그 함수 본문에서 쓰는 `arguments` 는 그 함수 자신의 호출 인자를 가리켜 옮겨도 뜻이 같으므로 허용」으로. 허용의 한계를 조문에 적었다: 감싸기로 옮기는 로드 중 문 · 생성기가 새로 만든 감싸기 함수의 최상위 · 화살표 함수 안의 `arguments` 는 그대로 0. `this` 금지 그대로 · 그 밖의 조문·포인터·법령 전문 본문 변경 0(전문에 대응 조문 없음 — 측정) · 삭제 조항 0 · 승인선·판정 분리·금고 완화 0. 생성기(유형 K 정지)·제품 코드·시험 변경 0 — 실제 함수 이전은 별도 PR | 직전 커널: [`AGENTS_KERNEL_' + OLD_V + '.md`](archive/AGENTS_KERNEL_' + OLD_V + '.md) · REQ `' + REQ + '` | ' + PR_PLACEHOLDER + ' · ' + QUOTE_NOTE + ' |';

const TICKET_KEY = '- #TASK-ES-654 | INFRA |';
const TICKET_LINE = TICKET_KEY + ' 헌법 개정 초안 ' + NEW_V + ' 「세포 분열 arguments 조항」 — CELL_SPLIT 5호 한 곳: 함수 선언을 선언째로 글자 그대로 옮길 때 그 함수 자신의 호출 인자를 가리키는 arguments 는 허용, 최상위 this 0 과 감싸기·화살표 함수의 arguments 0 은 그대로. 그 밖의 조문·포인터·법령 전문 본문 변경 0 · 제품 코드·생성기·시험 변경 0 | ' + REQ + ' · reports/TASK-ES-654/claims.json | 4단계(심사 청구 · 승인선 ⑤ · 상민님 2026-10-11 ' + QUOTE + ' — 오케스트레이터 세션 309dca5d 가 옮겨 준 인용)';

// ── 도구 ───────────────────────────────────────────────────────────────────
const sha = buf => crypto.createHash('sha256').update(buf).digest('hex');
const abs = rel => path.join(ROOT, rel);
function load(rel) {
  let raw = fs.readFileSync(abs(rel), 'utf8');
  const bom = raw.startsWith(BOM);
  if (bom) raw = raw.slice(1);
  const eol = raw.includes('\r\n') ? '\r\n' : '\n';
  const lf = raw.replace(/\r\n/g, '\n');
  return { rel, bom, eol, before: lf, text: lf };
}
function count(hay, needle) { let n = 0, i = 0; while ((i = hay.indexOf(needle, i)) >= 0) { n++; i += needle.length; } return n; }
class Stop extends Error {}
const steps = [];
function note(file, step, status, extra) { steps.push(Object.assign({ file, step, status }, extra || {})); }
// 바꾼 뒤 글자가 있으면 already, 없으면 바꾸기 전 글자가 정확히 한 번 있어야 바꾼다.
function swap(f, step, oldS, newS) {
  if (f.text.includes(newS)) return note(f.rel, step, 'already');
  const n = count(f.text, oldS);
  if (n !== 1) throw new Stop(f.rel + ' · ' + step + ': 바꾸기 전 글자가 ' + n + '번 있다(정확히 1번이어야 한다)');
  f.text = f.text.replace(oldS, () => newS);
  note(f.rel, step, 'applied');
}
function lineIndex(f, prefix, step) {
  const lines = f.text.split('\n');
  const hits = lines.map((l, i) => (l.startsWith(prefix) ? i : -1)).filter(i => i >= 0);
  if (hits.length !== 1) throw new Stop(f.rel + ' · ' + step + ': 「' + prefix.slice(0, 40) + '…」로 시작하는 줄이 ' + hits.length + '개다(정확히 1개여야 한다)');
  return { lines, i: hits[0] };
}
function lineCounts(f) { return { linesBefore: f.before.split('\n').length, linesAfter: f.text.split('\n').length }; }

function main() {
  const kernel = load(KERNEL), statute = load(STATUTE), ledger = load(LEDGER), tickets = load(TICKETS);
  let archiveText = null;

  if (PR) {
    // ── PR 번호 기입(대장 새 행 · 법령 머리 현행 줄) ──
    if (!/^\d+$/.test(PR)) throw new Stop('--pr 값이 숫자가 아니다: ' + PR);
    for (const [f, prefix, step] of [[ledger, LEDGER_NEW_ROW_PREFIX, '대장 새 행에 PR 번호'], [statute, '- **현행 커널 버전**: `' + NEW_V + '` — ', '법령 머리 현행 줄에 PR 번호']]) {
      const { lines, i } = lineIndex(f, prefix, step);
      if (lines[i].includes(prFilled(PR))) { note(f.rel, step, 'already'); continue; }
      if (count(lines[i], PR_PLACEHOLDER) !== 1) throw new Stop(f.rel + ' · ' + step + ': 기입할 자리 표시가 그 줄에 정확히 1번 있지 않다');
      lines[i] = lines[i].replace(PR_PLACEHOLDER, () => prFilled(PR));
      f.text = lines.join('\n');
      note(f.rel, step, 'applied');
    }
  } else {
    // ── 1. 직전 커널 archive(원시 blob 글자 그대로) ──
    if (fs.existsSync(abs(ARCHIVE))) {
      note(ARCHIVE, '직전 커널 원문 보관', 'already', { sha256LfNormalized: sha(Buffer.from(fs.readFileSync(abs(ARCHIVE), 'utf8').replace(/\r\n/g, '\n'), 'utf8')) });
    } else {
      const baseBlob = execFileSync('git', ['-C', ROOT, 'cat-file', '-p', BASE + ':' + KERNEL], { maxBuffer: 64 * 1024 * 1024 });
      const baseText = baseBlob.toString('utf8');
      if (!Buffer.from(baseText, 'utf8').equals(baseBlob)) throw new Stop(BASE + ' 의 커널이 utf8 로 왕복되지 않는다 — 글자 그대로 보관할 수 없다');
      const first = baseText.split('\n')[0];
      if (!first.includes(OLD_V)) throw new Stop(BASE + ' 의 커널 첫 줄이 ' + OLD_V + ' 가 아니다 — 직전 커널을 다른 커밋에서 읽어야 한다(--base): ' + first.slice(0, 80));
      archiveText = baseText;
      note(ARCHIVE, '직전 커널 원문 보관', 'applied', { from: BASE + ':' + KERNEL, sha256: sha(baseBlob), bytes: baseBlob.length });
    }

    // ── 2. 커널 정본: 버전 표기 3곳 + CELL_SPLIT 5호 ──
    swap(kernel, '첫 줄 제목의 버전', TITLE_OLD, TITLE_NEW);
    if (kernel.text.includes(VERLINE_NEW_HEAD)) note(kernel.rel, '머리 「버전」 줄', 'already');
    else {
      const { lines, i } = lineIndex(kernel, VERLINE_OLD_PREFIX, '머리 「버전」 줄');
      const k = lines[i].indexOf(VERLINE_KEEP_FROM);
      if (k < 0) throw new Stop(kernel.rel + ' · 머리 「버전」 줄: 효력 문장을 찾지 못했다');
      lines[i] = VERLINE_NEW_HEAD + lines[i].slice(k);
      kernel.text = lines.join('\n');
      note(kernel.rel, '머리 「버전」 줄', 'applied');
    }
    swap(kernel, 'system_kernel id', KID_OLD, KID_NEW);
    swap(kernel, 'CELL_SPLIT 5호', CLAUSE_OLD, CLAUSE_NEW);

    // ── 3. 법령 전문 머리: 현행 → 직전 → 그 전 ──
    if (statute.text.includes('- **현행 커널 버전**: `' + NEW_V + '` — ')) note(statute.rel, '머리 「현행 커널 버전」', 'already');
    else {
      const cur = lineIndex(statute, STATUTE_CUR_OLD_PREFIX, '머리 「현행 커널 버전」');
      const prev = lineIndex(statute, STATUTE_PREV_OLD_PREFIX, '머리 「직전 커널 버전」');
      if (prev.i !== cur.i + 1) throw new Stop(statute.rel + ' · 머리: 현행 줄 바로 아래가 직전 줄이 아니다');
      const lines = cur.lines;
      lines[prev.i] = '- **그 전 커널 버전**: ' + lines[prev.i].slice('- **직전 커널 버전**: '.length);
      lines[cur.i] = '- **직전 커널 버전**: ' + lines[cur.i].slice('- **현행 커널 버전**: '.length);
      lines.splice(cur.i, 0, STATUTE_CUR_NEW);
      statute.text = lines.join('\n');
      note(statute.rel, '머리 「현행 커널 버전」', 'applied');
    }

    // ── 4. 버전 대장: 마지막 행 아래 새 행 ──
    if (ledger.text.includes(LEDGER_NEW_ROW_PREFIX)) note(ledger.rel, '새 행', 'already');
    else {
      const { lines, i } = lineIndex(ledger, LEDGER_PREV_ROW_PREFIX, '새 행');
      if ((lines[i + 1] || '').trim().startsWith('|')) throw new Stop(ledger.rel + ' · 새 행: ' + OLD_V + ' 행이 표의 마지막 행이 아니다');
      lines.splice(i + 1, 0, LEDGER_NEW_ROW);
      ledger.text = lines.join('\n');
      note(ledger.rel, '새 행', 'applied');
    }

    // ── 5. 티켓 한 줄(끝에 추가) ──
    if (tickets.text.includes(TICKET_KEY)) note(tickets.rel, '티켓 한 줄', 'already');
    else {
      tickets.text = tickets.text.replace(/\n*$/, '\n') + TICKET_LINE + '\n';
      note(tickets.rel, '티켓 한 줄', 'applied');
    }
  }

  // ── 쓰기(전부 계산이 끝난 뒤 한 번에) ──
  const written = [];
  if (!DRY) {
    if (archiveText !== null) {
      fs.mkdirSync(path.dirname(abs(ARCHIVE)), { recursive: true });
      fs.writeFileSync(abs(ARCHIVE), archiveText, { encoding: 'utf8' });
      written.push(ARCHIVE);
    }
    for (const f of [kernel, statute, ledger, tickets]) {
      if (f.text === f.before) continue;
      fs.writeFileSync(abs(f.rel), (f.bom ? BOM : '') + f.text.replace(/\n/g, f.eol), { encoding: 'utf8' });
      written.push(f.rel);
    }
  }
  const out = {
    task: 'TASK-ES-654', mode: PR ? 'pr-number' : 'amend', dry: DRY, base: PR ? null : BASE,
    from: OLD_V, to: NEW_V, steps, written,
    lineCounts: Object.fromEntries([kernel, statute, ledger, tickets].map(f => [f.rel, lineCounts(f)])),
  };
  process.stdout.write(JSON.stringify(out, null, 2) + '\n');
}

try { main(); } catch (e) {
  if (e instanceof Stop) { process.stderr.write('멈춤 — 아무 파일도 쓰지 않았다: ' + e.message + '\n'); process.exit(1); }
  throw e;
}
