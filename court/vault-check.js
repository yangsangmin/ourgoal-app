'use strict';
// 법정(court) — 검증기 금고 검사.
// 막는 것: ① 작업(제품 코드)과 채점 기준(금고)을 같은 변경 묶음에서 함께 고치기 ② 테스트 파일을 통째로 지우기
//          ③ 작업과 함께 새로 만든 검증기의 결과를 증거로 쓰기(자가채점).
// 테스트 파일(baseTests)은 고칠 수 있다. 라벨 하나 바꿔도 글자 핀이 깨지는 저장소라, 고치는 것 자체를 막으면 정상 작업이 교착에 빠진다(과거 제품 PR 의 41% 가 걸림 — 실측).
// 대신 법정은 "기준 커밋의 시험지로 작업 커밋의 제품을 채점"한다(probes/base-tests.js). 여기서의 단언 줄 비교는 참고 정보일 뿐이다.
// 금고 목록은 "심사받는 쪽"이 아니라 "법정 쪽"(이 파일 옆의 vault.json)에서 읽는다.
const fs = require('node:fs');
const path = require('node:path');
const git = require('./lib/git');

function globToRegExp(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') { re += '.*'; i++; if (glob[i + 1] === '/') i++; }
      else re += '[^/]*';
    } else if ('\\^$+?.()|{}[]'.includes(c)) re += '\\' + c;
    else re += c;
  }
  return new RegExp('^' + re + '$');
}

function matcher(globs) {
  const res = (globs || []).map(globToRegExp);
  return p => res.some(r => r.test(p));
}

function loadVault(file) { return JSON.parse(fs.readFileSync(file || path.join(__dirname, 'vault.json'), 'utf8')); }

const ASSERTION_RE = /\bassert\b|\bassert\.|^check\(|\bexpect\(|process\.exit\(\s*1\s*\)|throw new /;
const CHECK_TITLE_RE = /\bcheck\(\s*(['"`])((?:[^\\]|\\.)*?)\1/;
// 검사 제목 속의 번호 표기("[검증 3/4]" = 몇 번째/전체 몇 개). 검사를 하나 더하기만 해도 다른 검사들의 이 숫자가 바뀐다.
const TITLE_NUMBERING_RE = /\[([^[\]\d]{0,12})\d{1,4}\s*\/\s*\d{1,4}\]/g;
// 제목만 있고 같은 줄에 단언이 없는 줄: check('제목', () => {   /   check('제목', async function () {   /   check('제목',
const TITLE_ONLY_TAIL_RE = /^\s*,?\s*(?:async\s+)?(?:(?:\(\s*[\w$]*\s*\)|[A-Za-z_$][\w$]*)\s*=>\s*\{?|function\s*[\w$]*\s*\(\s*[\w$]*\s*\)\s*\{?)?\s*$/;

// 번호 표기는 check('…') 의 제목 글자 안에서만 같은 것으로 본다. 단언 본문의 숫자는 건드리지 않는다(단언을 약하게 고친 것을 놓치지 않기 위해).
function normalizeNumbering(line) {
  const m = CHECK_TITLE_RE.exec(line);
  if (!m) return line;
  const end = m.index + m[0].length - 1, start = end - m[2].length;
  return line.slice(0, start) + line.slice(start, end).replace(TITLE_NUMBERING_RE, '[$1#/#]') + line.slice(end);
}

function assertionKey(raw) { return normalizeNumbering(raw.replace(/\s+/g, ' ').trim()); }

// 그 줄이 "검사 제목 줄일 뿐"인가(같은 줄에 단언이 없다). 제목 글자만 바뀐 것인지 judge 가 따져 볼 수 있게 표시해 준다.
function isTitleOnlyLine(line) {
  const m = CHECK_TITLE_RE.exec(line);
  if (!m || !/^(?:await\s+)?check\($/.test(line.slice(0, m.index + 6).trim())) return false;
  return TITLE_ONLY_TAIL_RE.test(line.slice(m.index + m[0].length));
}

// 단언 줄 다중집합. 위치 이동·줄바꿈 정리·제목의 번호 표기는 무시하고, "있던 단언이 사라졌는가"만 본다.
function assertionLines(source) {
  const bag = new Map();
  if (typeof source !== 'string') return bag;
  for (const raw of source.split('\n')) {
    const line = assertionKey(raw);
    if (!line || line.startsWith('//')) continue;
    if (ASSERTION_RE.test(line)) bag.set(line, (bag.get(line) || 0) + 1);
  }
  return bag;
}

// 단언 줄마다 그 줄이 속한 검사 제목(가장 가까운 앞의 check('...'))을 함께 센다. removed 에 check 을 달아 주기 위한 것이다.
// 제목은 기준 커밋에 적힌 글자 그대로 둔다(기준 시험지 채점 결과·retire 의 제목과 글자로 맞춰 보기 때문이다).
function assertionOwners(source) {
  const bag = new Map(); // 정규화한 줄 → { count, owners: Map<제목, 횟수>, shown: 처음 본 원문 }
  if (typeof source !== 'string') return bag;
  let current = null;
  for (const raw of source.split('\n')) {
    const cm = CHECK_TITLE_RE.exec(raw); if (cm) current = cm[2].trim();
    const line = assertionKey(raw);
    if (!line || line.startsWith('//')) continue;
    if (!ASSERTION_RE.test(line)) continue;
    const e = bag.get(line) || { count: 0, owners: new Map(), shown: raw.replace(/\s+/g, ' ').trim() };
    e.count++; if (current) e.owners.set(current, (e.owners.get(current) || 0) + 1);
    bag.set(line, e);
  }
  return bag;
}

function removedAssertions(baseSrc, headSrc) {
  const a = assertionOwners(baseSrc), b = assertionLines(headSrc);
  const removed = [];
  for (const [line, e] of a) {
    const m = b.get(line) || 0;
    if (m >= e.count) continue;
    const titles = [...e.owners.keys()];
    // check: 여러 검사에 걸친 줄이면 제목을 특정할 수 없다 → null(파일 단위로 본다)
    // titleOnly: 사라진 것이 제목 줄뿐이다(그 줄에 단언이 없다). 검사 내용이 그대로인지는 기준 시험지 채점 결과로 judge 가 가린다.
    removed.push({ line: e.shown.slice(0, 200), count: e.count - m, check: titles.length === 1 ? titles[0] : null, titleOnly: isTitleOnlyLine(e.shown) });
  }
  return removed;
}

function jsonKeyChanged(baseSrc, headSrc, keys) {
  let a, b;
  try { a = baseSrc ? JSON.parse(baseSrc) : {}; } catch (_) { return keys.slice(); }
  try { b = headSrc ? JSON.parse(headSrc) : {}; } catch (_) { return keys.slice(); }
  return keys.filter(k => JSON.stringify(a[k] === undefined ? null : a[k]) !== JSON.stringify(b[k] === undefined ? null : b[k]));
}

// frozenJsonKeys 로 지키는 파일(package.json·vercel.json)에서, 동결 칸 밖의 값이 바뀌었는가.
// 동결 칸은 그대로여도 rewrites·dependencies 같은 다른 칸이 바뀌면 배포에 나가는 변경이므로 제품으로 본다.
function nonFrozenJsonChanged(baseSrc, headSrc, frozenKeys) {
  let a, b;
  try { a = baseSrc ? JSON.parse(baseSrc) : {}; b = headSrc ? JSON.parse(headSrc) : {}; }
  catch (_) { return true; } // 해석할 수 없으면 안전측으로 제품
  const strip = o => { const c = {}; for (const k of Object.keys(o || {})) if (!frozenKeys.includes(k)) c[k] = o[k]; return c; };
  return JSON.stringify(strip(a)) !== JSON.stringify(strip(b));
}

function checkVault(opts) {
  const { repo, base, head } = opts;
  const vault = opts.vault || loadVault();
  // 분류는 뒤집혀 있다: frozen·baseTests·neutral 이 아닌 모든 변경은 제품이다(주장 없이는 통과하지 못한다).
  const isFrozen = matcher(vault.frozen), isAppendOnly = matcher(vault.baseTests), isProduct = matcher(vault.product), isNeutral = matcher(vault.neutral), isVerifierLike = matcher(vault.verifierLike);
  const files = git.changedFiles(repo, base, head);
  const frozenChanged = [], productChanged = [], appendOnlyChanged = [], newVerifiers = [], neutral = [];
  for (const f of files) {
    const paths = [f.path].concat(f.oldPath ? [f.oldPath] : []);
    const frozenKeys = vault.frozenJsonKeys && vault.frozenJsonKeys[f.path];
    if (frozenKeys) {
      const baseSrc = git.fileAt(repo, base, f.path), headSrc = git.fileAt(repo, head, f.path);
      const changed = jsonKeyChanged(baseSrc, headSrc, frozenKeys);
      if (changed.length) frozenChanged.push(f.path + ' (' + changed.join(', ') + ')');
      else if (nonFrozenJsonChanged(baseSrc, headSrc, frozenKeys)) productChanged.push(f.path); // 동결 칸 밖(rewrites·dependencies 등)이 바뀌면 제품
      else neutral.push(f.path);
      continue;
    }
    if (paths.some(isFrozen)) frozenChanged.push(f.path);
    else if (paths.some(isAppendOnly)) appendOnlyChanged.push(f);
    else if (paths.some(isProduct)) productChanged.push(f.path); // 명시적 제품(docs/sql·icons·*.html 등)은 neutral 보다 우선
    else if (paths.every(isNeutral)) neutral.push(f.path); // 이동을 포함해 양쪽 경로가 모두 배포 안 되는 파일일 때만 neutral
    else productChanged.push(f.path); // 그 밖의 모든 변경(새 파일·미분류 경로 포함)은 제품(deny-by-default)
    if (f.status === 'A' && isVerifierLike(f.path)) newVerifiers.push(f.path);
  }
  const violations = [];
  if (frozenChanged.length && productChanged.length) {
    violations.push({
      id: 'VAULT_MIXED', severity: 'block', files: frozenChanged,
      message: '작업(제품 코드 ' + productChanged.length + '개 파일)과 채점 기준(금고 ' + frozenChanged.length + '개 파일)을 한 묶음에서 함께 바꿨다. 출제와 응시를 같은 손이 했다는 뜻이므로 반려한다. 금고 변경은 금고만 담은 별도 PR + 상민님 결심으로만 한다.',
    });
  } else if (frozenChanged.length) {
    violations.push({
      id: 'VAULT_CHANGED', severity: 'decision', files: frozenChanged,
      message: '채점 기준(금고) 변경이다. 제품 코드는 섞이지 않았다. 규범 변경(승인선 5)이므로 상민님 결심이 있어야 병합할 수 있다.',
    });
  }
  for (const f of appendOnlyChanged) {
    if (f.status === 'D') { violations.push({ id: 'TEST_FILE_DELETED', severity: 'block', files: [f.path], message: '테스트 파일을 통째로 지웠다.' }); continue; }
    const removed = removedAssertions(git.fileAt(repo, base, f.oldPath || f.path), git.fileAt(repo, head, f.path));
    if (removed.length) {
      violations.push({
        id: 'ASSERTION_CHANGED', severity: 'info', files: [f.path], removed: removed.slice(0, 20), removedCount: removed.reduce((n, r) => n + r.count, 0),
        message: '테스트 파일에서 기존 단언 ' + removed.reduce((n, r) => n + r.count, 0) + '줄이 사라지거나 바뀌었다. 판정에는 영향이 없다 — 법정은 기준 커밋의 시험지로 채점한다.',
      });
    }
  }
  const selfGrading = productChanged.length ? newVerifiers : [];
  if (selfGrading.length) {
    violations.push({
      id: 'SELF_GRADING_VERIFIER', severity: 'info', files: selfGrading,
      message: '작업과 함께 새로 만든 검증 스크립트다. 자기가 낸 시험이므로 그 결과(예: "N/N ALL PASS")는 증거로 채택하지 않는다.',
    });
  }
  return {
    base, head, violations,
    blocked: violations.some(v => v.severity === 'block'),
    needsDecision: violations.some(v => v.severity === 'decision'),
    inadmissibleVerifiers: selfGrading,
    counts: { total: files.length, frozen: frozenChanged.length, product: productChanged.length, appendOnly: appendOnlyChanged.length, neutral: neutral.length, other: neutral.length },
    productChanged, frozenChanged, neutral,
  };
}

module.exports = { checkVault, loadVault, globToRegExp, matcher, assertionLines, assertionOwners, removedAssertions, normalizeNumbering, isTitleOnlyLine, jsonKeyChanged, nonFrozenJsonChanged };

if (require.main === module) {
  const [repo, base, head] = process.argv.slice(2);
  if (!repo || !base || !head) { console.error('사용: node court/vault-check.js <repo> <base> <head>'); process.exit(2); }
  const r = checkVault({ repo, base, head });
  console.log(JSON.stringify(r, null, 2));
  process.exit(r.blocked ? 1 : 0);
}
