'use strict';
// 법정(court) — 이번 변경이 "새로 만든" 정적 위반만 센다(헌법 제3조 제3항 800줄 상한 · GUARD_02 CSS 은폐 · anti_pattern_blacklist 금지 낱말).
// 기준 커밋(merge-base)에 이미 있던 부채는 이번 작업의 위반이 아니다. 저장소 전체를 훑어 기존 부채까지 세면 모든 PR 이 돌려보내진다
// (2026-10-04 v4 엔진 court/engine.js 가 그랬다 — js/·css/·index.html 전체를 스캔). 그래서 여기서는 두 커밋의 git 데이터만 읽는다.
// 이 모듈은 PR 코드를 실행하지 않는다. git show / git diff 의 글자만 본다(법정의 격리 원칙).
const git = require('./git');

const MAX_LINES = 800; // 헌법 제3조 제3항(소블록 .js 순수 로직 800줄 상한)
// CSS 는 대소문자를 가리지 않으므로(!IMPORTANT 도 같은 뜻) 대소문자 무시로 본다.
const CSS_CONCEAL = [
  { name: 'display:none !important', re: /display\s*:\s*none\s*!\s*important/i },
  { name: 'position:absolute; left:-9999px', re: /position\s*:\s*absolute\s*;\s*left\s*:\s*-9999px/i },
];
// AGENTS.md <anti_pattern_blacklist> 의 정규식 그대로(플래그 없음 = 대소문자 구분).
const BANNED = [
  /fake_/, /mock_streak/, /dummy_count/, /hard_coded_stat/,
  /force_pay/, /paywall_block/, /lock_feature/, /ad_force/,
  /burnout_care/, /give_up/, /rest_mode/, /skip_today/,
];
const LINE_LIMIT_FILE = /^js\/.+\.js$/;
const TEXT_PRODUCT = /\.(m?js|cjs|css|html?)$/i;

// 글자의 줄 수(wc -l 과 같게: 끝 줄바꿈 하나는 줄을 늘리지 않는다). 없는 파일은 null.
function countLines(text) {
  if (text === null || text === undefined) return null;
  const s = String(text).replace(/\r\n/g, '\n');
  if (!s.length) return 0;
  const n = s.split('\n').length;
  return s.endsWith('\n') ? n - 1 : n;
}

// 800줄 상한 위반인가. 기준 커밋에 없던 파일이 넘음 · 기준에서 800줄 이하였는데 넘음 · 이미 넘던 파일이 더 길어짐 — 이 셋만 위반이다.
// 이미 넘던 파일이 같거나 줄었으면 위반이 아니다(부채를 줄이는 작업을 막지 않는다).
function lineLimitViolation(baseLines, headLines, max) {
  const lim = max || MAX_LINES;
  if (headLines === null || headLines <= lim) return null;
  if (baseLines === null) return 'new-file';
  if (baseLines <= lim) return 'crossed';
  if (headLines > baseLines) return 'grew';
  return null;
}

// git diff -U0 원문에서 추가된 줄과 그 줄 번호(작업 커밋 기준)를 뽑는다. 지운 줄(-)은 보지 않는다.
function addedLinesWithNumbers(diffText) {
  const out = [];
  let next = null;
  for (const raw of String(diffText || '').split('\n')) {
    const h = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(raw);
    if (h) { next = Number(h[1]); continue; }
    if (next === null) continue;
    if (raw.startsWith('+')) { out.push({ n: next, text: raw.slice(1).replace(/\r$/, '') }); next++; }
    else if (raw.startsWith(' ')) next++;
  }
  return out;
}

// 추가된 줄 목록에서 CSS 은폐·금지 낱말을 찾는다. 돌려주는 값: [{ kind: 'css'|'banned', n, pattern, text }]
function scanAdded(lines) {
  const hits = [];
  for (const l of lines) {
    for (const c of CSS_CONCEAL) if (c.re.test(l.text)) hits.push({ kind: 'css', n: l.n, pattern: c.name, text: l.text.trim().slice(0, 140) });
    for (const b of BANNED) if (b.test(l.text)) hits.push({ kind: 'banned', n: l.n, pattern: String(b), text: l.text.trim().slice(0, 140) });
  }
  return hits;
}

// 글자 전체에서 정규식이 몇 번 나오는가(한 줄에 여러 번이면 여러 번).
function countMatches(text, re) {
  if (!re) return 0;
  const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  return (String(text || '').match(g) || []).length;
}

function diffOf(repo, base, head, f) {
  // 이름이 바뀐 파일은 옛 경로의 판과 맞대어 본다. 새 경로만 보면 옮긴 줄 전부가 "추가된 줄"이 되어 기존 부채가 새 위반으로 잡힌다.
  const args = f.oldPath && f.oldPath !== f.path
    ? ['diff', '-U0', '--no-color', base + ':' + f.oldPath, head + ':' + f.path]
    : ['diff', '-U0', '--no-color', base, head, '--', f.path];
  const r = git.tryGit(repo, args);
  if (!r.ok) throw new Error('diff 를 읽지 못했다: ' + f.path + ' — ' + r.out.slice(0, 160));
  return r.out;
}

// changed: git.changedFiles 결과. isProduct(path): 배포되는 제품 파일인가(법정의 금고 분류를 judge.js 가 넘긴다).
// 돌려주는 값: { violations: [{ kind: 'lines'|'css'|'banned', file, title, text }] }
function check({ repo, base, head, changed, isProduct }) {
  const violations = [];
  for (const f of changed || []) {
    if (f.status === 'D' || !isProduct(f.path)) continue;
    if (LINE_LIMIT_FILE.test(f.path)) {
      const headLines = countLines(git.fileAt(repo, head, f.path));
      const baseLines = countLines(git.fileAt(repo, base, f.oldPath || f.path));
      const why = lineLimitViolation(baseLines, headLines);
      if (why) {
        const how = why === 'new-file' ? '기준 커밋에 없던 파일이 ' + headLines + '줄이다'
          : why === 'crossed' ? '기준 커밋에서 ' + baseLines + '줄이던 파일이 ' + headLines + '줄이 됐다'
            : '이미 ' + MAX_LINES + '줄을 넘던 파일이 ' + baseLines + '줄에서 ' + headLines + '줄로 더 길어졌다';
        violations.push({ kind: 'lines', file: f.path, title: '800줄 상한을 새로 넘김', text: f.path + ' — ' + how + '(상한 ' + MAX_LINES + '줄, 헌법 제3조 제3항). 기준 커밋에 이미 있던 부채는 세지 않고, 이번 변경이 새로 만들거나 늘린 것만 센다. 하위 소블록으로 나눠야 한다' });
      }
    }
    if (TEXT_PRODUCT.test(f.path)) {
      // 추가된 줄에 패턴이 있어도, 파일 전체의 그 패턴 출현 횟수가 기준 커밋보다 늘지 않았으면 위반이 아니다.
      // 이미 은폐 줄이 있던 줄의 다른 부분(색 값·선택자·압축된 한 줄 CSS)만 고치면 그 줄이 +줄로 나오기 때문이다(독립 검토 2026-10-04).
      const headText = git.fileAt(repo, head, f.path) || '', baseText = git.fileAt(repo, base, f.oldPath || f.path) || '';
      const grew = h => { const re = (CSS_CONCEAL.find(c => c.name === h.pattern) || {}).re || BANNED.find(b => String(b) === h.pattern); return countMatches(headText, re) > countMatches(baseText, re); };
      const hits = scanAdded(addedLinesWithNumbers(diffOf(repo, base, head, f))).filter(grew);
      const css = hits.filter(h => h.kind === 'css'), banned = hits.filter(h => h.kind === 'banned');
      const fmt = list => list.slice(0, 3).map(h => f.path + ':' + h.n + ' [' + h.pattern + '] ' + h.text).join(' / ') + (list.length > 3 ? ' 외 ' + (list.length - 3) + '곳' : '');
      if (css.length) violations.push({ kind: 'css', file: f.path, title: 'CSS 은폐 줄이 새로 추가됨', text: fmt(css) + ' — 이번 변경이 추가한 줄에 화면 요소를 감추는 꼼수(GUARD_02)가 있다. 지운 줄과 기준 커밋에 이미 있던 줄은 세지 않고, 파일 안의 그 패턴 수가 기준 커밋보다 늘었을 때만 센다' });
      if (banned.length) violations.push({ kind: 'banned', file: f.path, title: '금지 낱말이 새로 추가됨', text: fmt(banned) + ' — 이번 변경이 추가한 줄에 헌법 금지 목록(anti_pattern_blacklist)의 낱말이 있다. 지운 줄과 기준 커밋에 이미 있던 줄은 세지 않고, 파일 안의 그 패턴 수가 기준 커밋보다 늘었을 때만 센다' });
    }
  }
  return { violations };
}

module.exports = { check, countLines, countMatches, lineLimitViolation, addedLinesWithNumbers, scanAdded, MAX_LINES, CSS_CONCEAL, BANNED };
