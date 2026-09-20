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

// 단언 줄 다중집합. 위치 이동·줄바꿈 정리는 무시하고, "있던 단언이 사라졌는가"만 본다.
function assertionLines(source) {
  const bag = new Map();
  if (typeof source !== 'string') return bag;
  for (const raw of source.split('\n')) {
    const line = raw.replace(/\s+/g, ' ').trim();
    if (!line || line.startsWith('//')) continue;
    if (/\bassert\b|\bassert\.|^check\(|\bexpect\(|process\.exit\(\s*1\s*\)|throw new /.test(line)) bag.set(line, (bag.get(line) || 0) + 1);
  }
  return bag;
}

function removedAssertions(baseSrc, headSrc) {
  const a = assertionLines(baseSrc), b = assertionLines(headSrc);
  const removed = [];
  for (const [line, n] of a) { const m = b.get(line) || 0; if (m < n) removed.push({ line: line.slice(0, 200), count: n - m }); }
  return removed;
}

function jsonKeyChanged(baseSrc, headSrc, keys) {
  let a, b;
  try { a = baseSrc ? JSON.parse(baseSrc) : {}; } catch (_) { return keys.slice(); }
  try { b = headSrc ? JSON.parse(headSrc) : {}; } catch (_) { return keys.slice(); }
  return keys.filter(k => JSON.stringify(a[k] === undefined ? null : a[k]) !== JSON.stringify(b[k] === undefined ? null : b[k]));
}

function checkVault(opts) {
  const { repo, base, head } = opts;
  const vault = opts.vault || loadVault();
  const isFrozen = matcher(vault.frozen), isAppendOnly = matcher(vault.baseTests), isProduct = matcher(vault.product), isVerifierLike = matcher(vault.verifierLike);
  const files = git.changedFiles(repo, base, head);
  const frozenChanged = [], productChanged = [], appendOnlyChanged = [], newVerifiers = [], other = [];
  for (const f of files) {
    const paths = [f.path].concat(f.oldPath ? [f.oldPath] : []);
    const frozenKeys = vault.frozenJsonKeys && vault.frozenJsonKeys[f.path];
    if (frozenKeys) {
      const changed = jsonKeyChanged(git.fileAt(repo, base, f.path), git.fileAt(repo, head, f.path), frozenKeys);
      if (changed.length) frozenChanged.push(f.path + ' (' + changed.join(', ') + ')'); else other.push(f.path);
      continue;
    }
    if (paths.some(isFrozen)) frozenChanged.push(f.path);
    else if (paths.some(isAppendOnly)) appendOnlyChanged.push(f);
    else if (paths.some(isProduct)) productChanged.push(f.path);
    else other.push(f.path);
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
    counts: { total: files.length, frozen: frozenChanged.length, product: productChanged.length, appendOnly: appendOnlyChanged.length, other: other.length },
    productChanged, frozenChanged,
  };
}

module.exports = { checkVault, loadVault, globToRegExp, matcher, assertionLines, removedAssertions, jsonKeyChanged };

if (require.main === module) {
  const [repo, base, head] = process.argv.slice(2);
  if (!repo || !base || !head) { console.error('사용: node court/vault-check.js <repo> <base> <head>'); process.exit(2); }
  const r = checkVault({ repo, base, head });
  console.log(JSON.stringify(r, null, 2));
  process.exit(r.blocked ? 1 : 0);
}
