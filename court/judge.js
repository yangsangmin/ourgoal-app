#!/usr/bin/env node
'use strict';
// 법정(court) 본체 — 작업 커밋(head)을 기준 커밋(base)과 나란히 띄워 놓고 판정한다.
//   node court/judge.js --repo <저장소> [--head <rev>] [--base <rev>] [--out <폴더>] [--quick] [--json]
// 종료코드: 0 통과 · 3 확인 부족 · 1 돌려보냄 · 2 심사 못 함(통과가 아니다)
// 원칙: ① 작업자는 주장만 쓰고 판정은 법정이 낸다 ② 증거는 법정이 다시 실행해 만든다 ③ 못 잰 것은 "확인 못 함"이다(지어내지 않는다)
// 법정이 보증하는 범위: "이 시험의 행동이 기준 커밋에서는 안 되고 작업 커밋에서는 된다"까지다. 그 시험이 지시 문장과 같은 것을 재는지는 기계가 알 수 없다 — 판정서가 법정이 실제로 한 일을 문장으로 찍어 읽는 분이 대조하게 한다.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const git = require('./lib/git');
const server = require('./lib/static-server');
const grade = require('./lib/grade');
const siteHostLib = require('./lib/site-host');
const { loadConfig } = require('./lib/scenario');
const { checkVault, loadVault, matcher } = require('./vault-check');
const claimsLib = require('./claims');
const { probeBoot } = require('./probes/boot');
const { probeBaseTests, classifyCheck } = require('./probes/base-tests');
const report = require('./report');

const EXIT = { '통과': 0, '확인 부족': 3, '돌려보냄': 1, '심사 못 함': 2, '심사 전': 0 };
// 법정이 판정을 내기 전에 실행이 끝났을 때 남는 판정서의 첫 줄·둘째 줄(시작하자마자 써 두고, 판정이 나면 덮어쓴다).
const INTERIM_HEADLINE = '실행 중 종료 — 법정이 판정을 내기 전에 실행이 끝났습니다(강제 종료·시간 초과·중단일 수 있습니다). 이 판정서는 법정이 시작할 때 미리 써 둔 것입니다';
const INTERIM_TODO = '없음. 같은 커밋으로 심사를 다시 돌립니다. 통과가 아니므로 배포를 결정하실 단계가 아닙니다.';

// 배포되는 제품 파일에 새로 추가된 줄을 두 단으로 본다.
//  HARD(돌려보냄): 자동 브라우저·법정 자체를 알아보는 글자. 정상 제품 코드에 있을 이유가 없다.
//  SOFT(돌려보내지 않음, 최소 "확인 부족" + 안내): 접속 주소·기기·언어·시간대·화면 상태에 따라 갈리는 코드. 정상 코드에도 있을 수 있지만,
//        그런 코드는 법정 화면(PC 의 자동 브라우저)에서 된 것이 실제 사용자 환경에서도 되는지를 법정이 보증하지 못한다.
//  실측(2026-09-21, origin/main 최근 병합 PR 100건의 제품 파일 추가 줄): HARD 0건, SOFT 3건(3.0%). 화면 폭·matchMedia 는 정상 화면 코드에 흔해서 넣지 않았다.
//  주소(location.origin)는 링크를 만들 때 흔히 쓰므로 비교·검사하는 모양만 본다(언급 전부를 잡으면 6.0% — 실측).
const ENV_HARD = /navigator\s*\.\s*webdriver|HeadlessChrome|\bcourt-|__court|isHeadless|court[-.\w]*\.test\b(?!\s*\()|['"`][^'"`\s]*\.test['"`]|\\\.test(?![\w(])|['"`]court(?:\.|['"`])/;
const ENV_SOFT = new RegExp([
  '\\blocation\\s*\\.\\s*(?:hostname|host)\\b',
  '\\blocation\\s*\\.\\s*origin\\b\\s*(?:===?|!==?|\\.\\s*(?:includes|indexOf|startsWith|endsWith|match|search)\\b)',
  '(?:===?|!==?)\\s*(?:(?:window|document|self)\\s*\\.\\s*)?location\\s*\\.\\s*origin\\b',
  '\\.test\\s*\\(\\s*(?:(?:window|document|self)\\s*\\.\\s*)?location\\s*\\.\\s*origin\\b',
  // 기기 글자(userAgent)는 읽어서 갈래를 나누는 모양만 본다. 통계·문의 기록에 그대로 싣는 줄까지 잡으면 오탐이 5.0% 가 된다(실측) — 좁힌 뒤 3.0%.
  '\\.test\\s*\\(\\s*navigator\\s*\\.\\s*userAgent\\b', 'navigator\\s*\\.\\s*userAgent\\s*\\.\\s*(?:match|indexOf|includes|search|toLowerCase|toUpperCase|split)\\b', '[^=!<>]=\\s*\\(?\\s*navigator\\s*\\.\\s*userAgent\\b', '(?:===?|!==?)\\s*navigator\\s*\\.\\s*userAgent\\b',
  // 브라우저 상표 목록(userAgentData)도 기기 글자와 같은 종류의 값이다. 읽는 줄 자체가 드물어서(실측 2026-09-21: origin/main 의 제품 파일 0곳) 언급만으로 표시한다.
  'navigator\\s*\\.\\s*userAgentData\\b',
  'navigator\\s*\\.\\s*languages?\\b', 'visibilityState', 'getTimezoneOffset', 'resolvedOptions',
  // 법정은 언제나 http 와 임의 포트로 앱을 연다. 접속 방식·포트·주소 전체로 가르는 코드는 법정에서만 되고 실제 서비스(https)에서는 안 될 수 있다(독립 확인 검수 2026-09-21).
  // 링크를 만들 때 흔히 쓰는 값(href·search)은 비교·검사하는 모양만 본다.
  '\\blocation\\s*\\.\\s*(?:protocol|port)\\b',
  '\\blocation\\s*\\.\\s*(?:href|search)\\b\\s*(?:===?|!==?|\\.\\s*(?:includes|indexOf|startsWith|endsWith|match|search)\\b)',
  '\\.test\\s*\\(\\s*(?:(?:window|document|self)\\s*\\.\\s*)?(?:location\\s*\\.\\s*(?:href|search)|document\\s*\\.\\s*(?:URL|baseURI))\\b',
  '\\bdocument\\s*\\.\\s*(?:URL|baseURI|domain)\\b\\s*(?:===?|!==?|\\.\\s*(?:includes|indexOf|startsWith|endsWith|match|search)\\b)',
  '\\b(?:self|window)\\s*\\.\\s*origin\\b\\s*(?:===?|!==?|\\.\\s*(?:includes|indexOf|startsWith|endsWith|match|search)\\b)',
  '\\bisSecureContext\\b',
].join('|'));
const TEST_BYPASS = /process\s*\.\s*exit\s*\(\s*0\s*\)|process\s*\.\s*env\s*\.\s*(CI|GITHUB_ACTIONS|COURT)\b/;
// 기준 시험지는 제품 코드를 같은 프로세스에서 돌린다. 제품 코드가 그 프로세스를 끝내거나 시험 결과처럼 보이는 줄을 찍을 이유는 없다(실측: 최근 병합 PR 100건 중 0건).
const EXIT_CALL = /process\s*\.\s*exit\s*\(/;
const FAKE_TEST_OUTPUT = /(?:console\s*\.\s*(?:log|info|warn|error)|process\s*\.\s*std(?:out|err)\s*\.\s*write)\s*\(.*(?:✓|✗|\[PASS\]|\[FAIL\]|\\u271[37])/;
const SCRIPT_EXT = /\.(js|mjs|cjs|sh|ps1|py|bat|cmd)$/i;
const CLAIMS_PATH = /^reports\/[A-Za-z0-9_-]+\/claims\.json$/;
const CLAIMS_PATHSPEC = ':(glob)reports/*/claims.json';
const OUT = claimsLib.OUTCOME;
const REHEARD_OK = [OUT.CONFIRMED, OUT.TEXT_ONLY, OUT.NOTHING_TO_FIX]; // 옛 판을 다시 돌렸을 때 "문제없음"으로 보는 결과
const OK_BUCKETS = ['화면에서 눌러 확인', '글자만 확인(이 종류는 그걸로 충분)'];
// 둘째 줄 "확인 못 한 채 나가는 것" 의 순서: 필요한 확인 수준이 높은 것부터, 같은 수준에서는 아래 순서.
const LACKING_ORDER = ['고칠 게 없었음', '코드만 확인(화면에서는 안 봄)', '확인 못 함', '확인 부족'];
const SHORT_BUCKET = { '코드만 확인(화면에서는 안 봄)': '코드만 확인' };

function parseArgs(argv) {
  const a = { repo: process.cwd(), head: 'HEAD', base: null, out: null, quick: false, json: false };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--quick') a.quick = true; else if (k === '--json') a.json = true;
    else if (['--repo', '--head', '--base', '--out'].includes(k)) a[k.slice(2)] = argv[++i];
    else throw new Error('알 수 없는 인자: ' + k);
  }
  return a;
}

// 어디서 돌았는가. GitHub 의 court 워크플로(pull_request_target) 안에서 돈 것만 'ci' 로 찍는다. 환경변수 하나로 표기가 바뀌지 않게 네 가지를 함께 본다.
// 그래도 환경변수는 누구나 줄 수 있다 — 그래서 판정서는 어디서 돌았든 "효력은 GitHub 의 court 검사 기록에만 있다"를 항상 찍는다(report.js).
function detectWhere(env) {
  const e = env || process.env;
  const runId = typeof e.GITHUB_RUN_ID === 'string' && /^\d{1,20}$/.test(e.GITHUB_RUN_ID) ? e.GITHUB_RUN_ID : null;
  const ci = e.GITHUB_ACTIONS === 'true' && e.GITHUB_EVENT_NAME === 'pull_request_target' && !!runId && /\/\.github\/workflows\/court\.yml@/.test(e.GITHUB_WORKFLOW_REF || '');
  return ci ? { where: 'ci', runId, whereText: 'GitHub 에서 법정이 직접 실행(작업자 PC 밖 · 실행 번호 ' + runId + ')' } : { where: 'local', runId: null, whereText: '작업자 PC 에서 실행한 예비 점검' };
}

// PR 코드(부품)를 실제로 실행하는 탐침은 자식 프로세스에서, 가능하면 권한 제한(파일 쓰기·프로세스 실행 금지)을 걸고 돌린다.
function runModuleProbe(baseDir, headDir) {
  const script = path.join(__dirname, 'probes', 'module-load.js');
  const flags = [];
  const allowed = process.allowedNodeEnvironmentFlags;
  const perm = allowed.has('--permission') ? '--permission' : (allowed.has('--experimental-permission') ? '--experimental-permission' : null);
  if (perm) { flags.push(perm); for (const d of [path.resolve(__dirname), baseDir, headDir]) flags.push('--allow-fs-read=' + d); } // 쉼표 구분은 최신 Node 에서 폐지됐다 — 경로마다 따로 준다
  const r = spawnSync(process.execPath, [...flags, script, baseDir, headDir], { encoding: 'utf8', env: { PATH: process.env.PATH || '' }, timeout: 120000, maxBuffer: 64 * 1024 * 1024 });
  if (r.error || (r.status !== 0 && r.status !== 1)) return { toolError: '부품 로드 탐침 실행 실패: ' + ((r.error && r.error.message) || r.stderr || 'exit ' + r.status).slice(0, 300) };
  try {
    const j = JSON.parse(r.stdout); j.isolated = !!perm;
    // 탐침이 "아무것도 안 봤는데 문제없음"을 내는 것이 가장 위험하다. 부품을 하나도 못 읽었으면 통과가 아니라 도구 오류다.
    if (!j.counts || j.counts.head === 0 || j.counts.base === 0) return { toolError: '부품 로드 탐침이 부품을 하나도 읽지 못했다(기준 ' + (j.counts ? j.counts.base : '?') + '개, 작업 ' + (j.counts ? j.counts.head : '?') + '개) — 점검하지 않은 것을 점검했다고 할 수 없다' };
    return j;
  } catch (e) { return { toolError: '부품 로드 탐침 출력 해석 실패: ' + String(r.stdout).slice(0, 120) }; }
}

function addedLines(repo, base, head, file) {
  return git.fileDiff(repo, base, head, file).split('\n').filter(l => l.startsWith('+') && !l.startsWith('+++')).map(l => l.slice(1));
}

function findClaimsFiles(changed) { return changed.filter(f => CLAIMS_PATH.test(f.path) && f.status !== 'D').map(f => f.path); }

// 이 변경(base..head)의 커밋 이력에 있던 모든 주장 판을 id 별로 모은다(새 판부터). 지워졌거나 다른 폴더로 옮겨진 주장 파일의 옛 판도 포함한다.
// 이 변경이 건드린 주장 파일은 기준 커밋의 판도 본다(앞서 병합된 주장을 이번에 지우는 경우).
// 기준 커밋에 같은 내용으로 이미 있던 판은 이 변경이 만든 것이 아니므로 뺀다(main 을 병합해 들여온 다른 작업의 주장 파일이 섞이지 않게).
function claimHistory(repo, base, head) {
  const hist = git.pathHistory(repo, base, head, CLAIMS_PATHSPEC);
  const baseBlobs = git.treeBlobs(repo, base, 'reports');
  const byId = new Map(), seen = new Set(), paths = new Set();
  const add = (rev, p, src) => {
    let doc; try { doc = JSON.parse(src); } catch (_) { return; } // 깨진 중간판은 건너뛴다
    for (const c of (doc && Array.isArray(doc.claims) ? doc.claims : [])) {
      if (!c || typeof c !== 'object' || typeof c.id !== 'string') continue;
      if (!byId.has(c.id)) byId.set(c.id, []);
      byId.get(c.id).push({ rev, path: p, claim: c });
    }
  };
  for (const ver of hist.versions) {
    if (!CLAIMS_PATH.test(ver.path)) continue;
    if (ver.blob && baseBlobs.get(ver.path) === ver.blob) continue;
    paths.add(ver.path);
    if (!ver.blob || seen.has(ver.blob + ' ' + ver.path)) continue;
    seen.add(ver.blob + ' ' + ver.path);
    const src = git.blobText(repo, ver.blob); if (src) add(ver.sha, ver.path, src);
  }
  for (const p of paths) { const src = git.fileAt(repo, base, p); if (src) add(base, p, src); }
  return { ok: hist.ok, truncated: hist.truncated, error: hist.error || null, byId };
}

// 지금 판보다 센 옛 판(법정이 직접 돌려 보던 behavior·static) 중 가장 센 것. 같으면 새 것. 없으면 null.
function strongerOldVersion(versions, now) {
  const nowRank = now && claimsLib.KIND_RANK[now.kind] !== undefined ? claimsLib.KIND_RANK[now.kind] : -1;
  let old = null;
  for (const ver of versions) {
    const r = claimsLib.KIND_RANK[ver.claim.kind];
    if (r === undefined || r <= Math.max(nowRank, 0)) continue;
    if (!old || r > claimsLib.KIND_RANK[old.claim.kind]) old = ver;
  }
  return old;
}

// 옛 판 주장을 지금의 작업 커밋에 그대로 다시 돌린다. 시나리오 파일도 그 커밋에서 꺼내 임시 폴더에 둔다(지금 트리의 파일을 쓰지 않는다).
async function rehearClaim(repo, ver, ctx, workDir, evidenceDir) {
  const c = ver.claim;
  const blank = { id: String(c.id), req: typeof c.req === 'string' ? c.req : null, kind: c.kind, change: c.change || null, statement: typeof c.statement === 'string' ? c.statement : '', domain: typeof c.domain === 'string' ? c.domain : null, touches: Array.isArray(c.touches) ? c.touches : [], achieved: 'L0', floor: null, floorWhy: null, floorRaised: false, meetsFloor: false, notes: [], evidence: null };
  const errs = claimsLib.claimErrors(c, String(c.id), null);
  if (errs.length) return { ...blank, outcome: OUT.NO_TEST, notes: ['옛 판의 형식 오류: ' + errs.slice(0, 3).join(' / ')] };
  fs.mkdirSync(workDir, { recursive: true });
  if (c.kind === 'behavior') {
    const src = git.fileAt(repo, ver.rev, path.posix.join(path.posix.dirname(ver.path), c.scenario));
    if (src !== null) { const to = path.join(workDir, c.scenario); fs.mkdirSync(path.dirname(to), { recursive: true }); fs.writeFileSync(to, src, 'utf8'); }
  }
  return claimsLib.judgeClaim({ ...ctx, claimsDir: workDir, outDir: evidenceDir }, c);
}

// "확인 못 한 채 나가는 것"을 무거운 것부터 세운다: 필요한 확인 수준이 높은 순(진짜 폰 > 진짜 계정 > PC 화면 …), 같은 수준에서는 고칠 게 없었음 > 코드만 확인 > 확인 못 함.
// 작업자가 적은 순서·문장 앞머리로 둘째 줄에 가벼운 것만 보이게 하는 길을 막는다. 주장이 하나도 없는 지시는 필요한 수준을 알 수 없으므로 "분야를 모르는 주장"의 하한으로 본다.
function sortLacking(lacking, floors) {
  const need = r => grade.rank(r.floor || floors.unknownDomainFloor);
  const ord = r => { const i = LACKING_ORDER.indexOf(r.bucket); return i < 0 ? LACKING_ORDER.length : i; };
  return lacking.map((r, i) => ({ r, i })).sort((a, b) => need(b.r) - need(a.r) || ord(a.r) - ord(b.r) || a.i - b.i).map(x => x.r);
}
// 한 건의 모양: "R3 지시 문장 앞 60자… — 확인 못 함(작업자가 철회함) · 필요한 확인: PC 화면에서 눌러 봄"
function lackingText(r) {
  return r.id + ' ' + r.text.slice(0, 60) + (r.text.length > 60 ? '…' : '') + ' — ' + (SHORT_BUCKET[r.bucket] || r.bucket) + (r.note ? '(' + r.note + ')' : '') + ' · 필요한 확인: ' + (r.floor ? grade.label(r.floor) : (r.claims && r.claims.length ? '알 수 없음(철회한 주장뿐)' : '알 수 없음(주장 없음)'));
}

// "통과"의 둘째 줄에 싣는 "주장 문장 ↔ 법정이 실제로 해 본 것" 쌍(상위 3건). 법정은 시험이 지시와 같은 것을 재는지 알 수 없으므로, 보시는 분이 그 자리에서 대조할 수 있게 한다.
// 앱 열기·기다림 같은 준비 동작은 빼고 마지막 행동과 확인만 남긴다. 작업자가 쓴 글자가 섞이므로 판정서·게시 단계의 무력화(clean)를 그대로 거친다.
function didPairs(claims) {
  const prep = /^(앱 열기|화면이 뜰 때까지 기다림|금고의 시작 상태|화면 크기)/;
  const out = [];
  for (const c of claims || []) {
    if (c.kind !== 'behavior' || c.duplicateOf || !c.evidence || !c.evidence.steps) continue;
    const parts = report.describeSteps(c.evidence.steps, c.evidence.head).split(' → ').filter(p => p && !prep.test(p));
    const did = parts.slice(-3).join(' → ');
    out.push(c.id + ' 주장 “' + report.clean(String(c.statement || ''), 40) + '” ← 법정이 해 본 것: ' + report.clean(did, 110));
    if (out.length >= 3) break;
  }
  const rest = (claims || []).filter(c => c.kind === 'behavior' && !c.duplicateOf).length - out.length;
  if (rest > 0) out.push('외 ' + rest + '건은 판정서의 “법정이 실제로 한 일”에');
  return out;
}

// ── 테스트 파일에서 사라지거나 바뀐 단언을 어떻게 볼 것인가 ──
// 실행형(제품 함수를 실제로 돌리던 검사)인지는 사라진 줄 하나의 모양이 아니라 그 줄이 속한 검사 전체(classifyCheck)로 정한다.
// 여러 줄로 쓴 검사의 제목 줄은 글자 찾기(includes 등)가 없어서 줄만 보면 언제나 실행형으로 보이기 때문이다.
const CHECK_TITLE = /\bcheck\(\s*(['"`])((?:[^\\]|\\.)*?)\1/;
const TITLE_LINE = /^(?:await\s+)?check\(\s*['"`]/;
const TITLE_NUMBERING = /\[[^\[\]\d]{0,12}\d+\s*\/\s*\d+\s*\]\s*/g; // "[검증 3/4]" 같은 번호 표기 — 검사를 더하면 같이 바뀐다
const LINE_TEXT_FIND = /\.includes\(|\.test\(|\.match\(|\.indexOf\(|\.search\(/;

function titleKey(t) { return String(t || '').replace(TITLE_NUMBERING, ' ').replace(/\s+/g, ' ').trim(); }
function sameTitle(a, b) { return a === b || (titleKey(a) !== '' && titleKey(a) === titleKey(b)); }

// 소스에서 검사 제목 줄을 뽑는다. skeleton = 제목 글자만 뺀 그 줄, body = 그 검사의 나머지 줄(들여쓰기 없는 첫 줄까지 = 닫는 줄).
// 한 줄로 쓴 검사는 제목 줄이 곧 본문이므로 body 가 비고 skeleton 이 본문을 담는다.
function titleLines(src) {
  const out = [];
  if (typeof src !== 'string') return out;
  const lines = src.split('\n');
  const flat = s => s.replace(/\s+/g, ' ').trim();
  for (let i = 0; i < lines.length; i++) {
    const norm = flat(lines[i]);
    if (!TITLE_LINE.test(norm)) continue;
    const m = CHECK_TITLE.exec(norm);
    if (!m) continue;
    const body = [];
    if (!/\)\s*;?$/.test(norm)) { // 제목 줄에서 끝나지 않은 검사: 닫는 줄까지가 본문이다
      for (let k = i + 1; k < lines.length && k < i + 400; k++) {
        if (TITLE_LINE.test(flat(lines[k]))) break;
        body.push(flat(lines[k]));
        if (/^[})]/.test(lines[k])) break; // 들여쓰기 없는 닫는 줄 = 그 검사의 끝
      }
    }
    out.push({ title: m[2].trim(), norm, skeleton: norm.slice(0, m.index) + 'check(<제목>' + norm.slice(m.index + m[0].length), body: body.filter(Boolean).join('\n') });
  }
  return out;
}

// 기준 커밋에서 사라진 제목 줄 가운데 "제목 글자만 고친 것"(제목을 뺀 줄과 본문이 작업 커밋에 그대로 있는 것). 기준 제목 → 작업 커밋의 새 제목.
function retitledChecks(baseSrc, headSrc) {
  const b = titleLines(baseSrc), h = titleLines(headSrc);
  const tally = list => { const m = new Map(); for (const x of list) m.set(x.norm, (m.get(x.norm) || 0) + 1); return m; };
  const bn = tally(b), hn = tally(h);
  const fresh = h.filter(x => (bn.get(x.norm) || 0) < hn.get(x.norm));
  const used = new Set(), out = new Map();
  for (const g of b.filter(x => (hn.get(x.norm) || 0) < bn.get(x.norm))) {
    const cands = fresh.map((f, i) => ({ f, i })).filter(c => !used.has(c.i) && c.f.skeleton === g.skeleton && c.f.body === g.body);
    const pick = cands.find(c => titleKey(c.f.title) === titleKey(g.title)) || cands[0];
    if (pick) { used.add(pick.i); out.set(g.title, pick.f.title); }
  }
  return out;
}

// 사라진 단언이 속한 검사가 글자 핀인가 실행형인가. 같은 제목(번호 표기만 다른 것 포함)의 검사가 여럿이면 전부 글자 핀일 때만 글자 핀이다.
// 제목을 모르는 줄은 볼 검사가 없으므로 그 줄의 모양으로만 본다. 모르면 실행형(상민님 결심을 받는 쪽)이다.
function removedKind(baseSrc, rm) {
  if (typeof rm.check === 'string' && rm.check && typeof baseSrc === 'string') {
    const raws = [...new Set(titleLines(baseSrc).map(x => x.title).filter(t => sameTitle(t, rm.check)))];
    return (raws.length ? raws : [rm.check]).every(t => classifyCheck(baseSrc, t) === 'text-pin') ? 'text-pin' : 'exec';
  }
  return LINE_TEXT_FIND.test(rm.line) ? 'text-pin' : 'exec';
}

// 기준 커밋의 그 검사가 작업 커밋의 제품에서도 통과했는가(기준 시험지 채점 결과에서 읽는다). 법정이 돌리지 않는 시험지거나 시험이 중간에 죽었으면 알 수 없다(null).
function basePassedOnHead(baseTests, file, title) {
  const bt = baseTests || {};
  if (typeof bt.stillPasses === 'function') return bt.stillPasses(file, title); // 탐침이 제목별 결과를 직접 알려 준다(true·false·null)
  // 제목별 결과가 없으면 집계에서 읽는다: 시험이 끝까지 돌았고, 기준·작업 양쪽에 실패가 하나도 없을 때만 "통과"라고 말할 수 있다.
  const r = (bt.runners || []).find(x => x.file === file);
  if (!r || r.vanished || (bt.killedByProduct || []).some(k => k && k.file === file)) return null;
  if ((bt.newlyBroken || []).some(x => x.file === file && x.check === title)) return false;
  return r.base && r.head && r.base.failed === 0 && r.head.failed === 0 ? true : null;
}

// ── 비정상 종료 대비 ──
// 법정이 판정을 내기 전에 죽으면 판정서가 없고, 스냅샷 폴더와 headless Chrome 이 남는다.
// ① judge 는 시작하자마자 "심사 못 함 — 실행 중 종료" 판정서를 써 두고 끝에서 덮어쓴다(아래 judge 안).
// ② 프로세스가 끝나거나 중단 신호를 받으면, 띄워 둔 Chrome 을 끄고 이 실행이 만든 임시 폴더만 지운다(공용 임시 폴더를 이름으로 훑지 않는다).
const RUNS = new Set(); // 지금 돌고 있는 실행 { dirs: 지울 폴더, interim(사유): 미리 써 둔 판정서에 사유를 남긴다 }
let exitHooked = false;
function killChromes() { // lib/chrome.js 가 자기가 띄운 Chrome 을 목록에 적어 두고, 동기 정리(killAllSync)를 내준다
  try { const chrome = require('./lib/chrome'); const kill = chrome.killAllSync || chrome.killAll; if (typeof kill === 'function') kill(); } catch (_) { /* 끄지 못해도 정리는 계속한다 */ }
}
function cleanupRuns(why) {
  if (RUNS.size) killChromes();
  for (const r of RUNS) {
    try { r.interim(why); } catch (_) { /* 판정서 폴더에 못 쓰면 시작할 때 써 둔 것이 남는다 */ }
    for (const d of r.dirs) { try { fs.rmSync(d, { recursive: true, force: true }); } catch (_) { /* 잠긴 파일은 남을 수 있다 */ } }
  }
  RUNS.clear();
}
function hookExit() {
  if (exitHooked) return; exitHooked = true;
  process.on('exit', code => cleanupRuns('법정 프로세스가 판정 전에 끝남(종료코드 ' + code + ')'));
  for (const [sig, code] of [['SIGINT', 130], ['SIGTERM', 143]]) process.on(sig, () => { cleanupRuns('중단 신호(' + sig + ')를 받음'); process.exit(code); });
}

// 판정번호. 같은 조건(같은 두 커밋·같은 판정 내용·같은 실행 장소와 방식)이면 같은 값이다. 실행마다 바뀌는 값(법정 호스트·포트·시각)은 넣지 않는다.
// 실행 장소(작업자 PC / GitHub)와 빠른 점검 여부를 넣어, 작업자 PC 에서 미리 돌려 본 번호가 GitHub 판정의 번호와 같아지지 않게 한다. GitHub 에서는 실행 번호도 넣는다.
function verdictIdOf(v) {
  return crypto.createHash('sha256').update(JSON.stringify({
    h: v.head.sha, b: v.base.sha, v: v.verdict, f: v.findings.map(f => f.title + f.text), c: v.claims.map(c => [c.id, c.outcome, c.achieved]), r: v.reheard.map(h => [h.id, h.outcome]),
    w: v.where, q: !!v.quick, run: v.where === 'ci' ? v.runId : null,
  })).digest('hex').slice(0, 8).toUpperCase();
}

async function judge(opts) {
  const t0 = Date.now();
  const cfg = loadConfig();
  const floors = grade.loadFloors();
  const vault = loadVault();
  const repo = path.resolve(opts.repo);
  const ran = detectWhere(process.env);
  const v = {
    schema: 'court-verdict/1', task: null, verdict: null, verdictId: null, headline: '', todo: '',
    where: ran.where, whereText: ran.whereText, runId: ran.runId, quick: !!opts.quick,
    base: { rev: opts.base, sha: null }, head: { rev: opts.head, sha: null }, baseSource: opts.base ? 'manual' : 'merge-base',
    facts: null, findings: [], vault: null, modules: null, boot: null, claims: [], reheard: [], claimsFile: null, rollup: null, coverage: null,
    envSensitive: [], notChecked: [], objection: null, requirementsSource: null,
    tool: { node: process.version, chromeVersion: null, siteHost: null, startedAt: new Date(t0).toISOString(), finishedAt: null, durationMs: 0 },
  };
  const reject = (title, text) => v.findings.push({ severity: 'reject', title, text });
  const warn = (title, text) => v.findings.push({ severity: 'warn', title, text });
  const toolErrors = [];
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'court-judge-'));
  const outDir = opts.out ? path.resolve(opts.out) : path.join(tmp, 'out');
  fs.mkdirSync(outDir, { recursive: true });
  // 시작하자마자 "심사 못 함 — 실행 중 종료" 판정서를 써 둔다. 법정이 판정 전에 죽어도(강제 종료·시간 초과) 빈손이 아니라 이 판정서가 남는다. 판정이 나면 맨 끝에서 덮어쓴다.
  const writeInterim = why => {
    const p = { ...v, verdict: '심사 못 함', headline: INTERIM_HEADLINE + (v.progress ? ' — 마지막으로 하던 일: ' + v.progress : '') + (why ? ' — ' + why : ''), todo: INTERIM_TODO, interim: true, findings: v.findings.slice() };
    p.tool = { ...v.tool, finishedAt: new Date().toISOString(), durationMs: Date.now() - t0 };
    p.verdictId = verdictIdOf(p);
    fs.writeFileSync(path.join(outDir, 'verdict.json'), JSON.stringify(p, null, 2), 'utf8');
    fs.writeFileSync(path.join(outDir, 'REPORT.md'), report.render(p), 'utf8');
  };
  try { writeInterim(null); } catch (_) { /* 미리 써 두지 못해도 심사는 한다(끝에서 쓰는 판정서가 본문이다) */ }
  // 단계가 바뀔 때마다 미리 써 둔 판정서에 "어디까지 봤는가"를 남긴다. 아무 출력 없이 죽었을 때 남는 유일한 단서다.
  const phase = name => { v.progress = name; try { writeInterim(null); } catch (_) { /* 위와 같음 */ } };
  // 판정서를 밖(--out)에 쓰면 임시 폴더를 통째로, 아니면 판정서 폴더만 남기고 지운다. 비정상 종료 때도 같은 범위만 지운다.
  const run = { dirs: opts.out ? [tmp] : ['base', 'head', 'history'].map(d => path.join(tmp, d)), interim: writeInterim };
  RUNS.add(run); hookExit();
  let baseSrv = null, headSrv = null;
  try {
    v.head.sha = git.revParse(repo, opts.head);
    if (!v.head.sha) { toolErrors.push('작업 커밋을 찾을 수 없다: ' + opts.head + ' — 없는 브랜치·커밋이다'); throw new Error('no head'); }
    const remoteMainSha = git.revParse(repo, cfg.remoteMain || 'origin/main');
    v.base.sha = opts.base ? git.revParse(repo, opts.base) : (remoteMainSha ? git.mergeBase(repo, remoteMainSha, v.head.sha) : null);
    if (!v.base.sha) { toolErrors.push('기준 커밋을 정할 수 없다(' + (opts.base || cfg.remoteMain) + ')'); throw new Error('no base'); }
    phase('금고 검사와 추가된 줄 검사'); // 이번에는 두 커밋의 주소가 들어간다
    v.facts = git.headFacts(repo, v.head.sha, cfg.remoteMain);
    if (v.base.sha === v.head.sha) warn('바뀐 것이 없음', '작업 커밋과 기준 커밋이 같다. 심사할 변경이 없다.');

    // 1) 금고
    v.vault = checkVault({ repo, base: v.base.sha, head: v.head.sha, vault });
    for (const x of v.vault.violations) {
      if (x.severity === 'block') reject(x.id === 'VAULT_MIXED' ? '채점 기준을 같이 고침' : (x.id === 'TEST_FILE_DELETED' ? '테스트 파일 삭제' : '금고 위반(' + x.id + ')'), x.message + ' [' + x.files.join(', ') + ']');
      else if (x.severity === 'decision') warn('채점 기준(금고) 변경', x.message + ' [' + x.files.slice(0, 12).join(', ') + (x.files.length > 12 ? ' 외 ' + (x.files.length - 12) + '개' : '') + ']');
      else if (x.id === 'SELF_GRADING_VERIFIER') warn('자기가 낸 시험', x.message + ' [' + x.files.join(', ') + ']');
      // ASSERTION_CHANGED(테스트 단언 변경)는 아래에서 사유(retire) 유무까지 보고 따로 다룬다 — 여기서 찍으면 제목이 틀리고 중복된다.
    }
    const changed = git.changedFiles(repo, v.base.sha, v.head.sha);
    const changedSet = new Set(changed.map(f => f.path));
    const isAppendOnly = matcher(vault.baseTests), isFrozen = matcher(vault.frozen);
    // 제품 파일 = 금고가 제품으로 분류한 것. 그중 법정 서버가 내주지 않는 경로(scripts/·scratch/·docs/ 등 도구·문서)를 뺀 것이 "배포되는 제품 파일"이다. 줄 검사는 배포되는 제품 파일에만 한다.
    const productSet = new Set((v.vault.productChanged || []).map(p => String(p).replace(/ \(.*\)$/, '')));
    const isTooling = p => (cfg.denyServePrefixes || []).some(pre => ('/' + p).toLowerCase().startsWith(String(pre).toLowerCase()));
    const isDeployed = p => productSet.has(p) && !isTooling(p);
    // 2) 추가된 줄 검사: 검증 환경 감지(2단), 시험 결과 꾸미기, 테스트 건너뛰기
    for (const f of changed) {
      if (f.status === 'D') continue;
      const lines = (isDeployed(f.path) || isAppendOnly(f.path)) ? addedLines(repo, v.base.sha, v.head.sha, f.path) : [];
      if (isDeployed(f.path)) {
        const hard = lines.find(l => ENV_HARD.test(l));
        if (hard) reject('검증 환경을 알아채는 코드', f.path + ' 에 법정(자동 브라우저)에서만 다르게 동작할 수 있는 분기가 추가됐다: ' + hard.trim().slice(0, 140));
        for (const l of lines.filter(x => !ENV_HARD.test(x) && ENV_SOFT.test(x)).slice(0, 5)) v.envSensitive.push({ file: f.path, line: l.trim().slice(0, 160) });
        const bye = lines.find(l => EXIT_CALL.test(l));
        if (bye) reject('제품 코드가 프로세스를 끝냄', f.path + ' 에 실행 중인 프로세스를 끝내는 줄이 추가됐다: ' + bye.trim().slice(0, 140) + ' — 기준 시험지는 제품 코드를 같은 프로세스에서 돌리므로, 이 줄은 남은 검사를 돌지 못하게 한다');
        const fake = lines.find(l => FAKE_TEST_OUTPUT.test(l));
        if (fake) reject('제품 코드가 시험 결과처럼 보이는 줄을 찍음', f.path + ': ' + fake.trim().slice(0, 140) + ' — 시험 결과는 시험지만 찍는다');
      }
      if (isAppendOnly(f.path)) { const hit = lines.find(l => TEST_BYPASS.test(l)); if (hit) reject('테스트를 건너뛰게 하는 줄 추가', f.path + ': ' + hit.trim().slice(0, 140)); }
      if (/^reports\/.*\/(verdict\.json|REPORT\.md)$/i.test(f.path)) reject('성적표를 저장소에 넣음', f.path + ' — 판정서는 법정이 만드는 것이며 저장소에 커밋할 수 없다(손으로 고친 성적표를 막는다)');
    }
    if (v.envSensitive.length) warn('접속 환경에 따라 갈리는 코드 ' + v.envSensitive.length + '곳', '접속 주소·기기·언어·시간대·화면 상태를 읽는 줄이 제품 코드에 추가됐다: ' + v.envSensitive.slice(0, 4).map(e => e.file + ' — ' + e.line.slice(0, 120)).join(' / ') + '. 법정의 화면은 PC 의 자동 브라우저라서, 법정에서 된 것이 실제 사용자 환경에서도 되는지는 보증하지 못한다.');
    const deployedChanged = [...productSet].filter(p => !isTooling(p));
    const ownScripts = changed.filter(f => f.status === 'A' && SCRIPT_EXT.test(f.path) && !isAppendOnly(f.path) && !isFrozen(f.path) && !isDeployed(f.path)).map(f => f.path);
    if (ownScripts.length && deployedChanged.length) warn('이 작업이 만든 검사 스크립트 ' + ownScripts.length + '개', '그 출력은 증거로 인정하지 않는다: ' + ownScripts.slice(0, 10).join(', '));

    // 3) 두 커밋을 나란히 푼다
    phase('두 커밋을 임시 폴더에 풀기');
    const baseSnap = git.snapshot(repo, v.base.sha, path.join(tmp, 'base'));
    const headSnap = git.snapshot(repo, v.head.sha, path.join(tmp, 'head'));

    // 4) 주장 파일을 먼저 읽는다(기존 검사 폐기 신청 retire 가 기준 시험지 채점에 필요하다)
    const claimFiles = findClaimsFiles(changed);
    let doc = null, docOk = false;
    if (claimFiles.length) {
      // 법정은 주장 파일 하나만 심사한다. 여러 개를 받아 주면 나머지에 든 주장은 심사받지 않은 채 묻힌다(안 되는 주장을 다른 파일로 옮겨 두는 길).
      if (claimFiles.length > 1) reject('주장 파일이 여러 개', claimFiles.join(', ') + ' — 한 변경에는 주장 파일을 하나만 낼 수 있다(첫 번째만 심사했다)');
      v.claimsFile = claimFiles[0];
      try { doc = JSON.parse(fs.readFileSync(path.join(headSnap.dir, v.claimsFile), 'utf8')); } catch (e) { reject('주장 파일을 읽을 수 없음', v.claimsFile + ' JSON 파싱 실패'); }
      if (doc) {
        // 작업번호는 형식이 맞을 때만 판정서에 싣는다. 작업자가 이 칸에 줄바꿈과 "판정: 통과" 같은 글자를 넣어 판정서 맨 위에 가짜 줄을 찍는 길을 막는다.
        v.task = typeof doc.task === 'string' && /^[A-Za-z0-9_-]{3,40}$/.test(doc.task) ? doc.task : null;
        const errs = claimsLib.validateClaims(doc);
        // 지시 원문 문서를 적었으면 작업 커밋에 실제로 있어야 한다(없는 문서를 가리키는 것은 형식 오류다).
        if (!errs.length && doc.requirementsSource !== undefined) {
          const fp = path.join(headSnap.dir, doc.requirementsSource);
          if (fs.existsSync(fp) && fs.statSync(fp).isFile()) v.requirementsSource = doc.requirementsSource;
          else errs.push('requirementsSource 에 적은 문서가 작업 커밋에 없다: ' + doc.requirementsSource);
        }
        if (errs.length) reject('주장 파일 형식 오류', errs.slice(0, 8).join(' / ')); else docOk = true;
        if (docOk && !doc.claims.length && v.vault.productChanged.length) reject('주장 없음', '제품 코드 ' + v.vault.productChanged.length + '개 파일을 바꿨는데 주장 파일에 폐기 신청(retire)만 있고 주장이 없다.');
        if (docOk && doc.requirements.length && !v.requirementsSource) warn('지시 원문 문서 미기재', '주장 파일에 requirementsSource(지시 원문이 적힌 문서의 경로)가 없다. 지시 항목 목록은 작업자가 적어 낸 것이고, 법정은 그 목록에서 빠진 지시가 있는지 알지 못한다.');
        if (docOk && doc.objection) v.objection = { finding: String(doc.objection.finding), repro: String(doc.objection.repro) };
        if (docOk) for (const c of doc.claims) {
          const stray = (c.touches || []).filter(t => !changedSet.has(t));
          if (stray.length) warn('주장이 가리킨 파일이 이번 변경에 없음', '주장 ' + c.id + ' 의 touches 중 이번에 바뀌지 않은 파일: ' + stray.slice(0, 6).join(', '));
        }
      }
    } else if (v.vault.productChanged.length) {
      reject('주장 없음', '제품 코드 ' + v.vault.productChanged.length + '개 파일을 바꿨는데 이번 변경에 reports/<작업번호>/claims.json 이 없다. 무엇을 했는지 주장하지 않으면 법정은 회귀만 볼 수 있을 뿐 "됐다"를 확인해 줄 수 없다.');
    }

    // 5) 부품 로드 탐침
    phase('부품 로드 점검');
    const mod = runModuleProbe(baseSnap.dir, headSnap.dir);
    if (mod.toolError) toolErrors.push(mod.toolError); else {
      v.modules = mod;
      for (const r of mod.regressions) reject('되던 부품이 고장 남', r.file + ' — ' + r.detail);
    }

    // 6) 기준 시험지 채점: 기준 커밋의 테스트로 작업 커밋의 제품을 채점한다(작업자가 고친 테스트는 판정에 쓰지 않는다)
    phase('기준 시험지 채점');
    // 빈 node_modules 폴더는 "있음"이 아니다(다른 작업이 비워 버린 폴더를 고르면 기준 시험지가 의존성 없이 돌아 거짓 결과가 난다 — 2026-09-21 실제 발생).
    const hasModules = d => { try { return fs.readdirSync(d).length > 0; } catch (_) { return false; } };
    const nodeModules = [path.join(repo, 'node_modules'), path.join(__dirname, '..', 'node_modules')].find(hasModules) || null;
    v.baseTests = probeBaseTests({ baseDir: baseSnap.dir, headDir: headSnap.dir, vault, nodeModules });
    toolErrors.push(...(v.baseTests.toolErrors || []));
    // 기준 커밋을 다시 돌리자 기준에서도 실패한 검사 = 실행 도중 환경이 바뀐 것. 고장으로 세지 않되 확인된 것도 아니므로 "법정이 확인하지 못한 점검"으로 올린다(최소 확인 부족).
    v.baseShaky = (v.baseTests.insufficient || []).filter(s => /기준에서도 실패했다/.test(s)).map(s => ({ kind: 'BASE_TEST_SHAKY', title: '기준 시험지가 흔들림(실행 도중 환경 변화)', text: s }));
    for (const n of v.baseShaky) warn(n.title, n.text);
    // 시험 결과를 꾸민 흔적(시험지가 아닌 코드가 프로세스를 끝냄·결과 줄을 찍음·감시 기록 없음). 하나라도 있으면 돌려보낸다.
    for (const z of (v.baseTests.forgery || [])) reject('시험 결과를 꾸민 흔적', String((z && z.file) || '') + ' — ' + String((z && z.reason) || ''));
    // 기준 커밋에서는 끝까지 돌던 시험지가 작업 커밋에서만 중간에 죽었다. 법정 도구의 고장이 아니라 이 변경이 만든 고장이다(작업자는 법정을 고칠 수 없으므로 도구 오류로 돌리면 아무도 움직일 수 없다).
    for (const k of (Array.isArray(v.baseTests.killedByProduct) ? v.baseTests.killedByProduct : [])) {
      const errLines = String((k && k.error) || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
      const firstLine = errLines.find(s => /^[A-Za-z]*(?:Error|Exception)\b/.test(s)) || errLines[0] || '오류 문구를 읽지 못했다'; // 오류 이름이 있는 줄을 먼저 고른다(임시 폴더 경로가 든 줄은 실행마다 달라진다)
      reject('제품 코드가 기존 시험을 죽임', String((k && k.file) || '') + ' — 작업 커밋의 제품 코드가 기존 시험 실행을 죽였다: ' + firstLine.slice(0, 240) + ' (기준 커밋에서는 끝까지 돌던 시험지다. 시험지가 아니라 제품 코드를 고쳐야 한다)');
    }
    const retire = docOk && Array.isArray(doc.retire) ? doc.retire : [];
    const retireKey = r => r.file + ' :: ' + r.check;
    const declared = new Map(retire.map(r => [retireKey(r), r]));
    for (const b of (v.baseTests.newlyBroken || [])) {
      const d = declared.get(retireKey(b));
      if (!d) reject('있던 검사가 깨졌는데 말이 없음', b.file + ' 의 “' + b.check + '” 가 기준 커밋에서는 통과했는데 작업 커밋에서는 실패한다. 의도한 변경이라면 주장 파일의 retire 에 사유를 적어야 한다.');
      else if (b.kind === 'text-pin') warn('기존 글자 검사 폐기', '“' + b.check + '” — 사유: ' + d.reason + ' (글자가 있는지만 보던 검사라 결심 사항은 아니다)');
      else { v.retireNeedsDecision = (v.retireNeedsDecision || 0) + 1; warn('기존 실행 검사 폐기 신청', '“' + b.check + '” — 사유: ' + d.reason + ' (제품 함수를 실제로 돌리던 검사다. 폐기는 상민님 결심 사항이다)'); }
      declared.delete(retireKey(b));
    }
    // 테스트 파일에서 있던 단언 줄이 사라지거나 바뀐 경우. 기준 시험지 채점은 "깨진 검사"는 잡지만 "여전히 통과하는 검사를 슬쩍 지운 것"은 못 잡는다.
    // 그대로 두면 2단 공격이 된다: 먼저 테스트만 약화시킨 PR 을 넣고(제품 변경 없음 → 조용히 통과), 다음 PR 에서 제품을 깨뜨린다(약해진 시험지가 기준이 된다).
    // 사유(retire)는 파일 단위가 아니라 검사 제목 단위로 맞춘다: 사라진 단언이 속한 검사 제목(removed.check)이 있으면 같은 제목의 retire 가 있어야 한다. 제목을 못 찾은 줄(null)만 파일 단위로 본다.
    const assertChanged = v.vault.violations.filter(x => x.id === 'ASSERTION_CHANGED');
    const usedRetire = new Set();
    for (const x of assertChanged) {
      const file = x.files[0];
      const fileReasons = retire.filter(r => r.file === file);
      const allRemoved = Array.isArray(x.removed) ? x.removed : [];
      const reasonsFor = rm => (typeof rm.check === 'string' && rm.check ? fileReasons.filter(r => sameTitle(r.check, rm.check)) : fileReasons);
      const count = list => list.reduce((n, rm) => n + (rm.count || 1), 0);
      // 금고 검사가 목록을 줄여서 준 나머지 줄(제목을 알 수 없다)은 파일 단위로만 본다.
      const hidden = Math.max(0, (x.removedCount || 0) - count(allRemoved));
      const was = changed.find(f => f.path === file);
      const baseSrc = git.fileAt(repo, v.base.sha, (was && was.oldPath) || file), headSrc = git.fileAt(repo, v.head.sha, file);
      // 제목만 바뀐 검사: 사라진 것이 그 검사의 제목 줄 하나뿐이고, 제목을 뺀 줄과 본문이 작업 커밋에 그대로 있으며, 기준 커밋의 그 검사가 작업 커밋에서도 통과한다.
      // 검사가 없어지거나 약해진 것이 아니므로 사유도 결심도 필요 없다(표시만). 통과 여부를 모르면(법정이 돌리지 않는 시험지 등) 이 길을 쓰지 않는다.
      // 줄여서 받은 목록이면 그 검사의 다른 줄이 가려져 있을 수 있으므로 역시 쓰지 않는다.
      const renamed = hidden ? new Map() : retitledChecks(baseSrc, headSrc);
      const renamedFrom = t => [...renamed.keys()].find(k => sameTitle(k, t)) || null; // 금고 검사가 준 제목 → 기준 소스에 적힌 제목 그대로
      const retitled = allRemoved.filter(rm => TITLE_LINE.test(rm.line) && typeof rm.check === 'string' && renamedFrom(rm.check) !== null
        && !allRemoved.some(o => o !== rm && (o.check === rm.check || o.check === null || o.check === undefined) && !TITLE_LINE.test(o.line)));
      const sheetDied = (Array.isArray(v.baseTests.killedByProduct) ? v.baseTests.killedByProduct : []).some(k => k && k.file === file);
      const passed = rm => (sheetDied ? null : basePassedOnHead(v.baseTests, file, renamedFrom(rm.check)));
      const titleOnly = retitled.filter(rm => passed(rm) === true);
      // 법정이 돌리는 시험지인데 통과 여부를 못 읽었다 = 그 시험지를 끝까지 못 돌렸다(도구 오류이거나 시험이 중간에 죽음). 그 사유는 위에서 이미 따로 나갔다.
      // 여기서 "사유 없음"으로 또 돌려보내면 도구 오류가 작업자 탓으로 바뀐다 — 가리지 못한 것으로만 남긴다(도구 오류가 하나도 없으면 여기서 남긴다).
      const undecided = retitled.filter(rm => passed(rm) === null && (vault.baseTestRunners || []).some(r => r.file === file));
      if (undecided.length) {
        warn('제목만 바뀐 것으로 보이나 가리지 못함', file + ' 의 검사 ' + undecided.length + '개는 제목 글자만 바뀐 것으로 보이지만, 그 시험지를 작업 커밋에서 끝까지 돌리지 못해 기준 커밋의 그 검사가 여전히 통과하는지 확인하지 못했다.');
        if (!sheetDied && !toolErrors.length) toolErrors.push('기준 시험지 ' + file + ' 의 채점 결과를 읽지 못해 제목이 바뀐 검사 ' + undecided.length + '개를 가리지 못했다');
        for (const rm of undecided) for (const r of reasonsFor(rm)) usedRetire.add(retireKey(r));
      }
      if (titleOnly.length) {
        warn('제목만 바뀜', file + ' 의 검사 ' + titleOnly.length + '개는 제목 글자만 바뀌었고 검사 내용은 그대로다 — ' + titleOnly.slice(0, 3).map(rm => '“' + renamedFrom(rm.check) + '” → “' + renamed.get(renamedFrom(rm.check)) + '”').join(' / ') + (titleOnly.length > 3 ? ' 외 ' + (titleOnly.length - 3) + '개' : '') + '. 기준 커밋의 그 검사는 작업 커밋에서도 통과한다. 검사를 없애거나 약하게 한 것이 아니므로 결심 사항이 아니다(표시만).');
        for (const rm of titleOnly) for (const r of reasonsFor(rm)) usedRetire.add(retireKey(r));
      }
      const removed = allRemoved.filter(rm => !titleOnly.includes(rm) && !undecided.includes(rm));
      const isExec = rm => removedKind(baseSrc, rm) === 'exec';
      const explained = removed.filter(rm => reasonsFor(rm).length), unexplained = removed.filter(rm => !reasonsFor(rm).length);
      for (const rm of explained) for (const r of reasonsFor(rm)) usedRetire.add(retireKey(r));
      const unexplainedCount = count(unexplained) + (fileReasons.length ? 0 : hidden);
      if (unexplainedCount) {
        const titles = [...new Set(unexplained.map(rm => rm.check).filter(Boolean))].slice(0, 3);
        const sample = (unexplained.length ? unexplained : removed).slice(0, 2).map(rm => rm.line.slice(0, 90)).join(' / ');
        const where = file + ' 에서 단언 ' + unexplainedCount + '줄이 사유 없이 사라지거나 바뀌었다(' + sample + ')' + (titles.length ? ' — 검사 제목: ' + titles.map(t => '“' + t + '”').join(', ') : '');
        if (v.vault.productChanged.length) reject('있던 검사 기준을 고쳤는데 사유가 없음', where + '. 의도한 변경이면 주장 파일의 retire 에 이 파일과 그 검사 제목(check)별로 사유를 적어야 한다.');
        else { v.retireNeedsDecision = (v.retireNeedsDecision || 0) + unexplainedCount; v.testOnlyWeakened = (v.testOnlyWeakened || 0) + unexplainedCount; warn('테스트만 약화', where + '. 제품 코드는 그대로인데 시험지만 약하게 만드는 변경은 상민님 결심 사항이다.'); }
      }
      const execLines = explained.filter(isExec);
      const why = list => [...new Set(list.flatMap(rm => reasonsFor(rm).map(r => r.reason)))].join(' / ');
      if (execLines.length) {
        const execChecks = [...new Set(execLines.map(rm => rm.check || rm.line))]; // 결심은 줄이 아니라 검사 단위로 센다(제목을 모르는 줄은 줄 하나를 한 건으로)
        v.retireNeedsDecision = (v.retireNeedsDecision || 0) + execChecks.length;
        warn('기존 실행 검사 수정', file + ' 에서 제품 함수를 실제로 돌리던 검사 ' + execChecks.length + '개의 단언 ' + count(execLines) + '줄이 바뀌었다(' + execChecks.slice(0, 3).map(t => '“' + String(t).slice(0, 80) + '”').join(', ') + (execChecks.length > 3 ? ' 외 ' + (execChecks.length - 3) + '개' : '') + ') — 사유: ' + why(execLines) + ' (상민님 결심 사항이다)');
      }
      const textLines = explained.filter(rm => !isExec(rm));
      if (textLines.length) warn('기존 글자 검사 수정', file + ' 단언 ' + count(textLines) + '줄 — 사유: ' + why(textLines));
    }
    for (const r of declared.values()) {
      if (usedRetire.has(retireKey(r))) continue;
      // "통과한다"는 법정이 실제로 본 때에만 말한다(시험지를 끝까지 못 돌렸으면 모른다).
      const stillOk = basePassedOnHead(v.baseTests, r.file, r.check) === true;
      warn('폐기 신청했지만 깨지지 않은 검사', '“' + r.check + '” ' + (stillOk ? '는 작업 커밋에서도 통과한다' : '가 깨지거나 바뀐 것을 법정은 보지 못했다') + ' — retire 에서 빼야 한다');
    }

    // 7) 화면 점검(부팅·표준 시나리오·주장). 제품 코드가 안 바뀌었으면 화면을 띄울 이유가 없다(금고만 바꾸는 PR 이 고장 난 화면 탐침 때문에 교착에 빠지는 것도 막는다).
    v.browserSkipped = opts.quick ? '빠른 점검' : (v.vault.productChanged.length === 0 ? '제품 코드 변경 없음' : null);
    if (!v.browserSkipped) {
      baseSrv = await server.start(baseSnap.dir, cfg.denyServePrefixes);
      headSrv = await server.start(headSnap.dir, cfg.denyServePrefixes);
      // 앱은 법정 전용 호스트 이름으로 연다(127.0.0.1 로 열면 앱이 개발용 지름길로 빠진다 — lib/chrome.js 참고).
      // 호스트 이름은 실행마다 새로 고른다(고정 이름은 제품 코드가 알아볼 수 있는 지문이 된다). 기준·작업 커밋은 같은 호스트를 쓴다.
      const siteHost = siteHostLib.pickSiteHost(cfg);
      v.tool.siteHost = siteHost; // 증거 칸에만 남긴다 — 판정번호 계산에는 넣지 않는다
      const base = { dir: baseSnap.dir, url: siteHostLib.siteUrlFor(siteHost, baseSrv.port), sha: v.base.sha, server: baseSrv };
      const head = { dir: headSnap.dir, url: siteHostLib.siteUrlFor(siteHost, headSrv.port), sha: v.head.sha, server: headSrv };
      phase('화면 점검(앱 띄우기·표준 점검)');
      v.boot = await probeBoot({ base, head, config: cfg, outDir: path.join(outDir, 'evidence') });
      v.tool.chromeVersion = v.boot.boot ? v.boot.boot.chromeVersion : null;
      toolErrors.push(...v.boot.toolErrors);
      for (const r of v.boot.regressions) reject('되던 기능이 고장 남', r.detail);
      // 법정이 끝까지 확인하지 못한 점검(표준 점검이 새 화면에 맞지 않게 됨 · 이 변경이 새로 부르는 외부 파일을 법정이 막음). 고장은 아니지만 확인된 것도 아니다 — 판정은 최소 확인 부족이다.
      v.notChecked = (Array.isArray(v.boot.notChecked) ? v.boot.notChecked : []).map(n => ({ kind: String((n && n.kind) || ''), title: String((n && n.title) || '법정이 확인하지 못한 점검'), text: String((n && n.text) || '') }));
      for (const n of v.notChecked) warn(n.title, n.text);
      const already = new Set(v.notChecked.map(n => n.text)); // 탐침은 같은 문장을 insufficient 에도 넣어 준다 — 두 번 찍지 않는다
      for (const n of v.boot.insufficient) if (!already.has(n)) warn(/^표준 점검/.test(n) ? '표준 점검 사용 불가' : '앱 띄우기 비교가 흔들림', n);

      if (docOk) {
        const ctx = { claimsDir: path.join(headSnap.dir, path.dirname(v.claimsFile)), base, head, floors, config: cfg };
        // 주장 심사 시간 예산. 화면에서 돌려 보는 주장이 많으면 GitHub 의 시간 제한에 걸려 판정서 없이 끝난다 — 성실하게 시험을 낸 작업일수록 불리해진다.
        // 예산을 넘기면 남은 화면 주장은 돌리지 않고 "확인 못 함(시간 부족)"으로 내린다(글자 확인·확인 못 함·철회는 시간이 들지 않으므로 끝까지 본다). 판정서는 반드시 남긴다.
        phase('주장 심사(' + doc.claims.length + '건)');
        const budgetMs = Number.isFinite(cfg.claimBudgetMs) && cfg.claimBudgetMs > 0 ? cfg.claimBudgetMs : claimsLib.DEFAULT_CLAIM_BUDGET_MS;
        const deadline = Date.now() + budgetMs;
        for (const c of doc.claims) v.claims.push(await claimsLib.judgeClaim({ ...ctx, deadline, outDir: path.join(outDir, 'evidence', 'claim-' + c.id) }, c));
        const timeShort = v.claims.filter(c => c.timeShort);
        v.claimBudget = { budgetMs, timeShort: timeShort.map(c => c.id) };
        if (timeShort.length) warn('시간이 모자라 돌려 보지 못한 주장 ' + timeShort.length + '건', '주장 심사에 쓸 수 있는 시간(' + (budgetMs >= 60000 ? Math.round(budgetMs / 60000) + '분' : Math.round(budgetMs / 1000) + '초') + ')이 다 돼서 법정이 돌려 보지 못했다: ' + timeShort.slice(0, 8).map(c => c.id).join(', ') + (timeShort.length > 8 ? ' 외 ' + (timeShort.length - 8) + '건' : '') + '. 이 주장들은 된 것도 안 된 것도 아니다 — 확인 못 함이다. 주장을 여러 PR 로 나눠 내면 전부 돌려 볼 수 있다.');
        for (const c of v.claims) {
          if (c.outcome === OUT.BROKE) reject('되던 기능이 고장 남', c.id + ' ' + c.statement + ' — ' + (c.notes[0] || ''));
          if (c.outcome === OUT.NOT_WORKING) reject('됐다고 했지만 아직 안 됨', c.id + ' ' + c.statement + ' — ' + (c.notes[0] || (c.evidence && c.evidence.detail) || ''));
          if (c.measurableNotMeasured) reject('잴 수 있는데 재지 않음', c.id + ' ' + c.statement + ' — 이 종류(필요한 확인: ' + grade.label(c.floor) + ')는 법정이 PC 화면에서 직접 눌러 볼 수 있는데 “확인 못 함”으로 냈다. 시나리오를 내거나, 법정 도구로 정말 못 재는 것이면 정해진 사유(cannotBecause)를 적어야 한다.');
          if (c.outcome === OUT.UNSTABLE) warn('시험이 흔들림', c.id + ' — 같은 시험을 여러 번 돌렸더니 결과가 갈렸다. 확인된 것으로 세지 않는다.');
          if (c.outcome === OUT.CANNOT_JUDGE) toolErrors.push('주장 ' + c.id + ' 심사 중 도구 오류');
        }

        // 철회·종류 변경·삭제·이사된 주장: 커밋 이력에 남은 옛 판(법정이 직접 돌려 보던 주장)을 작업 커밋에 다시 돌린다.
        // 법정이 "안 된다"고 본 주장을 철회하거나 "확인 못 함"으로 바꾸거나 다른 폴더로 옮겨서 "확인 부족(배포 결정 가능)"으로 바꾸는 길을 막는다.
        phase('철회·변경된 옛 주장 다시 돌리기');
        const hist = claimHistory(repo, v.base.sha, v.head.sha);
        if (!hist.ok) toolErrors.push('주장 파일의 커밋 이력을 읽지 못했다 — 철회·삭제된 주장을 확인할 수 없다: ' + (hist.error || ''));
        if (hist.truncated) warn('커밋이 너무 많음', '주장 파일을 바꾼 커밋이 너무 많아 최근 것만 봤다. 오래된 주장 판은 확인하지 못했다.');
        const headById = new Map(doc.claims.map(c => [c.id, c]));
        const reqIds = new Set(doc.requirements.map(r => r.id));
        for (const [id, versions] of hist.byId) {
          const now = headById.get(id) || null;
          const old = strongerOldVersion(versions, now);
          if (!old) {
            if (!now) reject('말없이 삭제된 주장', '주장 ' + id + ' 가 커밋 ' + versions[0].rev.slice(0, 7) + ' (' + versions[0].path + ') 에는 있었는데 마지막 판에서 사라졌다. 거두려면 지우지 말고 철회(withdrawn)로 표시하고 사유를 적어야 한다.');
            continue;
          }
          const nowText = !now ? '삭제됨' : (now.kind === 'withdrawn' ? '철회' : (now.kind === 'unverified' ? '확인 못 함으로 바뀜' : '글자 확인으로 바뀜'));
          const safe = id.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 40);
          const h = await rehearClaim(repo, old, ctx, path.join(tmp, 'history', safe), path.join(outDir, 'evidence', 'history-' + safe));
          h.from = old.rev.slice(0, 7); h.path = old.path; h.now = nowText; h.historical = true;
          h.req = [now && now.req, old.claim.req].find(r => typeof r === 'string' && reqIds.has(r)) || null;
          v.reheard.push(h);
          // 철회한 주장이 지시 번호를 안 적었으면 옛 판의 지시 번호로 잇는다(그 지시가 "확인 못 함(작업자가 철회함)"으로 남게).
          const judgedNow = v.claims.find(c => c.id === id);
          if (judgedNow && !judgedNow.req && h.req) judgedNow.req = h.req;
          const what = '주장 ' + id + ' (' + h.statement.slice(0, 80) + ') — 커밋 ' + h.from + ' 의 판은 법정이 직접 돌려 보는 주장이었는데 지금은 ' + nowText + '. 법정이 그때의 시험을 작업 커밋에 다시 돌린 결과: ' + h.outcome + (h.notes[0] ? ' (' + h.notes[0].slice(0, 160) + ')' : '');
          if (h.outcome === OUT.CANNOT_JUDGE) toolErrors.push('옛 주장 ' + id + ' 을 다시 돌리는 중 도구 오류');
          // 법정은 정직한 정정(재 보니 못 재는 것이었다)과 안 되는 주장을 감추는 것을 구분할 수 없다. 그래서 둘 다 돌려보내되, 빠져나갈 길을 함께 적는다.
          else if (!REHEARD_OK.includes(h.outcome)) reject(now ? '안 되는 주장을 철회·종류 변경으로 바꿈' : '말없이 삭제된 주장', what + '. 주장을 거두거나 바꿔도 이 PR 안에서는 그 시험이 통과하기 전에는 풀리지 않는다. 그 시험을 통과시키거나, 처음부터 확인 못 함으로 적은 새 PR 로 다시 내야 합니다(새 PR 본문에 이 PR 번호를 적습니다).');
          else if (!now) warn('말없이 삭제된 주장', what + '. 다시 돌려 보니 문제는 없었지만, 주장은 지우지 말고 철회(withdrawn)로 표시해야 한다.');
          else warn('철회·종류 변경된 주장을 다시 돌려 봄', what + '.');
        }

        v.rollup = claimsLib.rollup(doc, v.claims, v.reheard);
        const touched = new Set(doc.claims.flatMap(c => c.touches || []));
        const unclaimed = [...productSet].filter(p => !touched.has(p));
        v.coverage = { productFiles: productSet.size, claimed: productSet.size - unclaimed.length, unclaimed };
        if (unclaimed.length) warn('주장 없는 변경 ' + unclaimed.length + '곳', '바꿨지만 어떤 주장도 걸려 있지 않은 제품 파일: ' + unclaimed.slice(0, 8).join(', ') + ' — 이 파일들의 변경은 아무도 확인하지 않은 채 나간다.');
      }
    }
  } catch (e) {
    if (!toolErrors.length) toolErrors.push('법정 실행 중 오류: ' + String((e && e.message) || e));
  } finally {
    if (baseSrv) await baseSrv.close(); if (headSrv) await headSrv.close();
  }

  // 8) 전체 판정
  const rejects = v.findings.filter(f => f.severity === 'reject');
  // "고칠 게 없었음"은 위반은 아니지만 확인된 것도 아니다(작업자가 말한 결함이 고치기 전에도 없었다 = 이 변경이 무엇을 했는지 확인된 바 없다). 통과로 세지 않는다.
  const lacking = v.rollup ? sortLacking(v.rollup.reqs.filter(r => !OK_BUCKETS.includes(r.bucket)), floors) : [];
  const unclaimed = v.coverage ? v.coverage.unclaimed : [];
  const notChecked = (Array.isArray(v.notChecked) ? v.notChecked : []).concat(Array.isArray(v.baseShaky) ? v.baseShaky : []);
  for (const t of toolErrors) v.findings.push({ severity: 'warn', title: '도구 오류', text: t });
  if (rejects.length) {
    // 돌려보낼 사유가 이미 있으면 도구 오류가 같이 있어도 돌려보냄이다. 도구 오류를 앞세우면 "법정 도구 고장, 하실 일 없음"만 보여서 작업자가 고쳐야 할 것이 가려진다.
    const broke = rejects.filter(f => /고장/.test(f.title)).length;
    v.verdict = '돌려보냄';
    v.headline = (broke ? '되던 기능 ' + broke + '개가 고장 났습니다' + (rejects.length > broke ? ' (그 밖의 사유 ' + (rejects.length - broke) + '건)' : '') : rejects[0].title + (rejects.length > 1 ? ' 외 ' + (rejects.length - 1) + '건' : ''))
      + (toolErrors.length ? ' · 그 밖에 법정 도구 오류 ' + toolErrors.length + '건으로 나머지 점검은 끝내지 못함' : '');
    v.todo = '없음. 작업자가 고쳐서 다시 심사받아야 합니다. 지금은 “1”을 눌러 배포할 상태가 아닙니다.';
  } else if (toolErrors.length) {
    v.verdict = '심사 못 함'; v.headline = toolErrors[0]; v.todo = '없음. 법정 도구를 고친 뒤 다시 심사합니다. 통과가 아니므로 배포를 결정하실 단계가 아닙니다.';
  } else if (opts.quick) {
    v.verdict = '심사 전'; v.headline = '빠른 점검에서는 막을 이유가 없었습니다(화면 점검은 하지 않음) — 이 문구는 판정이 아니며 보고에 옮겨 적을 수 없습니다'; v.todo = '없음. 심사는 GitHub 에 올린 뒤 법정이 합니다.';
  } else if (v.vault && v.vault.needsDecision) {
    v.verdict = '확인 부족'; v.headline = '채점 기준(금고) 변경입니다 — 상민님 결심이 있어야 합니다';
    v.todo = '내용을 보시고 승인하시려면 “금고 변경 승인” 또는 “헌법 개정 승인”이라고 말씀해 주십시오. “1”·“진행”으로는 승인되지 않습니다.';
  } else if (v.retireNeedsDecision) {
    // 결심 사항은 두 가지다: 제품 함수를 돌리던 검사를 사유를 적어 폐기·수정하겠다는 신청 / 제품 코드는 그대로 두고 시험지의 단언만 사유 없이 지우거나 바꾼 것.
    // 뒤의 것을 앞의 문장으로 찍으면 사실이 아닌 첫 줄이 된다(신청한 적도 없고, 글자만 보던 검사일 수도 있다) — 따로 말한다.
    const weakened = Math.min(v.testOnlyWeakened || 0, v.retireNeedsDecision), execN = v.retireNeedsDecision - weakened;
    const parts = [];
    if (execN) parts.push('제품 함수를 실제로 돌리던 기존 검사 ' + execN + '개를 폐기하겠다는 신청이 있습니다');
    if (weakened) parts.push('제품 코드는 그대로인데 시험지의 단언 ' + weakened + '줄이 사유 없이 사라지거나 바뀌었습니다(시험지만 약하게 만드는 변경)');
    v.verdict = '확인 부족'; v.headline = parts.join(' · ') + ' — 상민님 결심이 있어야 합니다';
    v.todo = '“알아 두실 것”의 ' + (execN ? '폐기 사유' : '사라지거나 바뀐 단언') + '를 보시고 승인하시려면 “금고 변경 승인”이라고 말씀해 주십시오. “1”·“진행”으로는 승인되지 않습니다.';
  } else if (lacking.length || unclaimed.length || v.envSensitive.length || notChecked.length) {
    // 주장이 안 걸린 제품 파일 변경, 접속 환경에 따라 갈리는 코드, 법정이 끝까지 확인하지 못한 점검이 있으면 지시 항목이 전부 확인됐어도 "통과"가 아니다.
    v.verdict = '확인 부족';
    const heads = [], items = [];
    if (lacking.length) {
      heads.push('작업자가 적어 낸 지시 항목 ' + v.rollup.total + '건 중 ' + lacking.length + '건은 필요한 수준까지 확인하지 못했습니다');
      items.push(lacking.slice(0, 3).map(lackingText).join(' / ') + (lacking.length > 3 ? ' 외 ' + (lacking.length - 3) + '건' : ''));
      // 법정 도구 한계(닫힌 목록의 사유)로 못 잰 것은 따로 센다 — "안 잰 것"과 "못 재는 것"을 구분해서 보시게 한다.
      const limited = v.claims.filter(c => c.toolLimit && !c.duplicateOf);
      if (limited.length) { const by = {}; for (const c of limited) by[c.toolLimit] = (by[c.toolLimit] || 0) + 1; items.push('법정 도구 한계로 못 잰 것 ' + limited.length + '건(' + Object.keys(by).map(k => (claimsLib.CANNOT_BECAUSE_SHORT[k] || k) + ' ' + by[k]).join(' · ') + ') — 이 사유는 작업자가 적은 것이며 법정이 맞는지 확인한 것은 아닙니다'); }
      // 시간이 모자라 돌려 보지 못한 주장도 따로 센다 — 된 것도 안 된 것도 아니라는 점을 보시게 한다.
      const late = v.claims.filter(c => c.timeShort);
      if (late.length) items.push('시간이 모자라 법정이 돌려 보지 못한 주장 ' + late.length + '건(주장을 나눠 내면 전부 돌려 볼 수 있습니다)');
    }
    if (notChecked.length) {
      const by = {}; for (const n of notChecked) by[n.title] = (by[n.title] || 0) + 1;
      const plain = n => (n.kind === 'EXTERNAL_BLOCKED' ? '이 변경이 새로 쓰는 외부 파일을 법정이 막고 있어서, 앱을 띄울 때 난 새 오류가 실제 서비스에서도 나는지 확인하지 못했습니다'
        : (n.kind === 'STD_SCENARIO_STALE' ? '화면이 바뀌어 법정의 표준 점검을 끝까지 해 보지 못했습니다(표준 점검을 새 화면에 맞게 고쳐야 합니다)' : n.text.split(' — ')[0].slice(0, 140)));
      const shortTitle = k => (k.length > 90 ? k.slice(0, 89) + '…' : k); // 제목에는 막힌 외부 주소가 들어간다 — 첫 줄이 주소로 뒤덮이지 않게 자른다(전체 주소는 “알아 두실 것”에 있다)
      heads.push('법정이 끝까지 확인하지 못한 점검이 ' + notChecked.length + '건 있습니다(' + Object.keys(by).map(k => shortTitle(k) + ' ' + by[k]).join(' · ') + ')');
      items.push('법정이 확인하지 못한 점검 ' + notChecked.length + '건 — ' + [...new Set(notChecked.map(plain))].slice(0, 2).join(' / ') + '. 고장이라는 뜻은 아니지만 확인된 것도 아닙니다(자세한 내용은 “알아 두실 것”)');
    }
    if (unclaimed.length) { heads.push('바꿨는데 아무 주장도 걸지 않은 파일이 ' + unclaimed.length + '개 있습니다'); items.push('주장 없이 바뀐 파일: ' + unclaimed.slice(0, 3).join(', ') + (unclaimed.length > 3 ? ' 외 ' + (unclaimed.length - 3) + '개' : '')); }
    if (v.envSensitive.length) { heads.push('접속 환경(주소·기기·언어·시간대)에 따라 다르게 동작할 수 있는 코드가 ' + v.envSensitive.length + '곳 추가됐습니다'); items.push('법정 화면에서 된 것이 실제 폰에서도 되는지는 법정이 보증하지 못합니다(' + [...new Set(v.envSensitive.map(e => e.file))].slice(0, 3).join(', ') + ')'); }
    v.headline = heads.join(' · ');
    v.todo = '배포를 결정하실 수 있습니다. 다만 확인 못 한 채 나가는 것이 있습니다: ' + items.join(' / ');
  } else if (!v.rollup) {
    // 제품 코드가 안 바뀐 변경(문서 등). 주장 심사 대상이 아니다.
    v.verdict = '통과'; v.headline = '제품 코드 변경이 없고, 기존 검사도 깨지지 않았습니다'; v.todo = '병합하셔도 됩니다(제품 코드 변경 없음).';
  } else {
    // 법정이 보증하는 것은 "작업자가 낸 시험의 행동이 고치기 전엔 안 되고 고친 뒤엔 된다"까지다. 그 시험이 지시 문장과 같은 것을 재는지는 법정이 모른다.
    // 그래서 첫 줄은 보증 범위만 말하고, “1”을 누르시기 전에 보시는 둘째 줄에 법정이 실제로 해 본 것을 싣는다(지어낸 주장에 무관한 시험을 붙이는 길 — 독립 검수 속이기 1).
    v.verdict = '통과';
    v.headline = '작업자가 적어 낸 지시 항목 ' + v.rollup.total + '건에 걸린 시험이 전부 고치기 전엔 안 되고 고친 뒤엔 되며, 고장 난 것이 없습니다 — 시험이 지시와 같은 것을 재는지는 법정이 알 수 없습니다';
    const did = didPairs(v.claims);
    v.todo = '“1”이라고 하시면 배포합니다.' + (did.length ? ' 그 전에 법정이 실제로 해 본 것이 지시하신 것과 같은지 봐 주십시오: ' + did.join(' / ') : '');
  }
  delete v.progress; // 미리 써 두는 판정서에만 쓰는 칸이다
  v.tool.finishedAt = new Date().toISOString(); v.tool.durationMs = Date.now() - t0;
  v.verdictId = verdictIdOf(v);
  try {
    fs.writeFileSync(path.join(outDir, 'verdict.json'), JSON.stringify(v, null, 2), 'utf8');
    fs.writeFileSync(path.join(outDir, 'REPORT.md'), report.render(v), 'utf8');
  } catch (e) {
    try { writeInterim('판정서를 쓰는 중 오류: ' + String((e && e.message) || e).slice(0, 200)); } catch (_) { /* 쓸 수 없는 폴더면 남길 방법이 없다 */ }
    throw e;
  } finally {
    RUNS.delete(run); // 여기부터는 프로세스가 끝나도 미리 써 둔 판정서로 되돌리지 않는다
    // 법정은 자기가 만든 임시 폴더만 지운다. 공용 임시 폴더를 이름(court-*)으로 훑어 지우지 않는다 — 동시에 도는 다른 법정의 스냅샷을 지우면 그 법정이 가짜 결과를 낸다(자가시험 초기판이 실제로 낸 사고).
    // 판정서를 밖(--out)에 썼으면 임시 폴더를 통째로, 임시 폴더 안에 썼으면 판정서 폴더만 남기고 치운다(run.dirs).
    for (const d of run.dirs) { try { fs.rmSync(d, { recursive: true, force: true }); } catch (_) { /* 임시 폴더 정리 실패는 판정에 영향 없음 */ } }
  }
  v.outDir = outDir;
  return v;
}

module.exports = { judge, parseArgs, EXIT, detectWhere, claimHistory, strongerOldVersion, sortLacking, lackingText, verdictIdOf, titleKey, sameTitle, titleLines, retitledChecks, removedKind, basePassedOnHead, cleanupRuns, ENV_HARD, ENV_SOFT, EXIT_CALL, FAKE_TEST_OUTPUT, INTERIM_HEADLINE };

if (require.main === module) {
  let args; try { args = parseArgs(process.argv.slice(2)); } catch (e) { console.error(e.message); process.exit(2); }
  judge(args).then(v => {
    if (args.json) console.log(JSON.stringify(v, null, 2));
    else { for (const l of report.firstLines(v)) console.log(l); console.log('판정서: ' + path.join(v.outDir, 'REPORT.md')); }
    process.exit(EXIT[v.verdict] === undefined ? 2 : EXIT[v.verdict]);
  }).catch(e => { console.error('법정 실행 실패: ' + (e && e.stack || e)); process.exit(2); });
}
