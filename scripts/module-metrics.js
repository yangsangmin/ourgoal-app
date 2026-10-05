#!/usr/bin/env node
/**
 * 모듈화 진척 지표 (#TASK-ES-356 · 노션 CORE-08)
 *
 * 사용: node scripts/module-metrics.js [--root <저장소 경로>] [--out <파일.json>] [--pretty] [--card]
 *   --card 는 상태창 카드 한 장(summary: 노션 청사진 6절 건강 지표 행)만 낸다.
 *   - 표준 출력에 JSON 한 개를 낸다(형식: docs/architecture/MODULE-BLUEPRINT.md 「진척 지표 출력 형식」).
 *   - module-guard.js 가 같은 measure() 를 불러 기준선(docs/architecture/module-baseline.json)과 견준다.
 *
 * 재는 것(① ~ ⑤ 는 래칫 대상, 나머지는 참고):
 *   ① inlineScriptLines   index.html 안 src 없는 <script> 블록의 본문 줄 수
 *   ② indexFunctionDecls  index.html 인라인 스크립트 안 `function 이름(` 수(이름 붙은 함수 식 포함)
 *   ③ windowAssignments   index.html·ui.js·js/**.js 에서 `window.이름 =` / `window['이름'] =` 직접 대입 수(주석만 있는 줄 제외)
 *   ④ oversizeJsFiles     js/** 에서 800줄을 넘는 .js 파일 수와 각 줄 수(법정 court/lib/new-debt.js 와 같은 셈)
 *   ⑤ crossTabRefs        js/tabs/<A>/ 파일이 js/tabs/<B>/ 의 심볼(Ourgoal<B>…·B 가 정의한 전역)·경로(tabs/B/)·
 *                         레지스트리 블록 id(getBlock('B' …)를 직접 참조하는 수(주석만 있는 줄 제외)
 *   참고: 모듈 수·평균 줄 수·계층별 파일 수·IIFE 별칭 전역 대입(global./win. =) 수
 *
 * 이 스크립트는 파일을 읽기만 한다(쓰기는 --out 을 준 경우 그 파일 하나).
 */
'use strict';

const fs = require('fs');
const path = require('path');

const MAX_LINES = 800; // 헌법 제3조 제9항 · court/lib/new-debt.js MAX_LINES 와 같다
const LAYERS = ['core', 'services', 'ui', 'tabs', 'app'];
const SKIP_DIRS = new Set(['node_modules', '.git']);

// wc -l 과 같은 셈(끝 줄바꿈 하나는 줄을 늘리지 않는다) — court/lib/new-debt.js countLines 와 같다
function countLines(text) {
  if (text === null || text === undefined) return null;
  const s = String(text).replace(/\r\n/g, '\n');
  if (!s.length) return 0;
  const n = s.split('\n').length;
  return s.endsWith('\n') ? n - 1 : n;
}

function toPosix(p) {
  return p.split(path.sep).join('/');
}

function readText(file) {
  return fs.readFileSync(file, 'utf8');
}

// dir 아래 .js 파일(상대 경로, posix) 목록 — 정렬
function listJs(root, rel) {
  const out = [];
  const base = path.join(root, rel);
  if (!fs.existsSync(base)) return out;
  (function walk(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      if (SKIP_DIRS.has(ent.name)) continue;
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(full);
      else if (ent.isFile() && ent.name.endsWith('.js')) out.push(toPosix(path.relative(root, full)));
    }
  })(base);
  return out.sort();
}

// 주석만 있는 줄(//, /*, *, */ 로 시작)을 빈 줄로 바꾼다. 줄 수·줄 번호는 그대로 둔다.
// 문자열 안 // 이나 코드 뒤 꼬리 주석은 지우지 않는다(정규식 리터럴을 오인해 코드를 삼키지 않기 위한 보수적 선택).
function blankCommentOnlyLines(text) {
  const lines = String(text).replace(/\r\n/g, '\n').split('\n');
  let inBlock = false;
  return lines.map(line => {
    const t = line.trim();
    if (inBlock) {
      if (t.includes('*/')) inBlock = false;
      return '';
    }
    if (t.startsWith('//')) return '';
    if (t.startsWith('/*')) {
      if (!t.includes('*/')) inBlock = true;
      return '';
    }
    if (t.startsWith('*')) return '';
    return line;
  }).join('\n');
}

// index.html 안 src 없는 <script> 블록들: [{ startLine, lines, body }]
function inlineScripts(html) {
  const out = [];
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    const attrs = m[1] || '';
    if (/\bsrc\s*=/.test(attrs)) continue;
    if (/type\s*=\s*["']?(application\/ld\+json|text\/template|text\/html)/i.test(attrs)) continue;
    const body = m[2];
    const startLine = html.slice(0, m.index).split('\n').length;
    // 본문 줄 수: 여는 태그 뒤 줄바꿈과 닫는 태그 앞 들여쓰기 줄은 빼고 센다
    const trimmed = body.replace(/^[ \t]*\r?\n/, '').replace(/\r?\n[ \t]*$/, '');
    out.push({ startLine, lines: trimmed.length ? countLines(trimmed + '\n') : 0, body });
  }
  return out;
}

// index.html 에서 인라인 스크립트 본문만 남기고 나머지 줄은 비운다(줄 번호는 index.html 그대로)
function maskToInlineScripts(html) {
  const text = String(html).replace(/\r\n/g, '\n');
  const lines = text.split('\n').map(() => '');
  for (const s of inlineScripts(text)) {
    s.body.split('\n').forEach((l, k) => { lines[s.startLine - 1 + k] = l; });
  }
  return lines.join('\n');
}

function countRe(text, re) {
  const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  return (String(text).match(g) || []).length;
}

const RE_FUNCTION_DECL = /\bfunction\s*\*?\s*[A-Za-z_$][\w$]*\s*\(/;
// window.이름 = (==, === 제외) · window['이름'] =
const RE_WINDOW_ASSIGN = /\bwindow\s*(?:\.\s*[A-Za-z_$][\w$]*|\[\s*['"][^'"]+['"]\s*\])\s*=(?![=>])/;
// IIFE 별칭: global.X = / win.X = / root.X = (참고 지표)
const RE_ALIAS_ASSIGN = /\b(?:global|globalThis|win|root)\s*\.\s*[A-Za-z_$][\w$]*\s*=(?![=>])/;

function capital(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// #TASK-ES-502: 「없으면 만들어 두는」 방어 초기화는 그 탭의 정의가 아니다 — 다른 곳(index.html 인라인 등)이 정의·주인인 전역을
// 그 탭이 쓰기 전에 비어 있으면 채우는 것뿐이다. 두 꼴만 뺀다(같은 줄, 같은 이름):
//   ① if(!window.X) window.X = …   (global·globalThis 도 같다, 공백 무관)
//   ② window.X = window.X || …
// 무조건 대입(window.X = function…·window.X = X)은 계속 그 탭의 정의로 센다.
function isGuardedInit(text, at, len, name) {
  const lineStart = text.lastIndexOf('\n', at - 1) + 1;
  let lineEnd = text.indexOf('\n', at);
  if (lineEnd < 0) lineEnd = text.length;
  const before = text.slice(lineStart, at);
  const after = text.slice(at + len, lineEnd);
  const n = escapeRe(name);
  const G = '(?:global|window|globalThis)\\s*\\.\\s*';
  if (new RegExp('\\bif\\s*\\(\\s*!\\s*' + G + n + '\\s*\\)\\s*$').test(before)) return true;
  if (new RegExp('^\\s*' + G + n + '\\s*\\|\\|').test(after)) return true;
  return false;
}

// 탭 B 가 정의한 전역 심볼(global.X = / window.X = / var Ourgoal… =)
function tabDefinedSymbols(texts) {
  const names = new Set();
  for (const t of texts) {
    let m;
    const re = /\b(?:global|window|globalThis)\s*\.\s*([A-Za-z_$][\w$]*)\s*=(?![=>])/g;
    while ((m = re.exec(t))) {
      if (isGuardedInit(t, m.index, m[0].length, m[1])) continue;
      names.add(m[1]);
    }
  }
  return names;
}

// ⑤ 탭 간 직접 참조: [{ from, to, file, line, text }]
// index.html 인라인 스크립트가 window·global·globalThis 에 다는 이름(조건부 방어 초기화 포함 — 인라인이 주인이면 어느 꼴이든 주인이다)
function inlineWindowSymbols(root) {
  const names = new Set();
  const indexPath = path.join(root, 'index.html');
  if (!fs.existsSync(indexPath)) return names;
  const t = blankCommentOnlyLines(maskToInlineScripts(readText(indexPath)));
  const re = /\b(?:global|window|globalThis)\s*\.\s*([A-Za-z_$][\w$]*)\s*=(?![=>])/g;
  let m;
  while ((m = re.exec(t))) names.add(m[1]);
  return names;
}

function crossTabRefs(root) {
  const tabsDir = path.join(root, 'js', 'tabs');
  if (!fs.existsSync(tabsDir)) return [];
  const tabs = fs.readdirSync(tabsDir, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name).sort();
  const filesByTab = {};
  const textByFile = {};
  for (const tab of tabs) {
    filesByTab[tab] = listJs(root, 'js/tabs/' + tab);
    for (const f of filesByTab[tab]) textByFile[f] = blankCommentOnlyLines(readText(path.join(root, f)));
  }
  // #TASK-ES-507: index.html 인라인 스크립트가 window 에 다는 이름은 인라인(미분화 덩어리)이 주인이다 — 세포가 그 값을 바꿔 써도(예: 불러옴 표시)
  // 그 탭의 정의가 아니다. 그런 이름을 다른 탭이 읽는 것은 탭 간 참조가 아니라 인라인 공용 상태 읽기다(통로 L 과 같은 주인).
  const inlineOwned = inlineWindowSymbols(root);
  const patternsByTab = {};
  for (const tab of tabs) {
    const syms = Array.from(tabDefinedSymbols(filesByTab[tab].map(f => textByFile[f]))).filter(s => !inlineOwned.has(s));
    const parts = [
      '\\bOurgoal' + escapeRe(capital(tab)) + '[A-Z][\\w$]*',
      '\\btabs\\/' + escapeRe(tab) + '\\/',
      '\\b(?:getBlock|mount|unmount|listSubBlocks|registerSubBlock|registerMegaBlock)\\(\\s*[\'"]' + escapeRe(tab) + '[\'"]'
    ];
    syms.forEach(s => parts.push('\\b' + escapeRe(s) + '\\b'));
    patternsByTab[tab] = new RegExp('(?:' + parts.join('|') + ')', 'g');
  }
  const hits = [];
  for (const from of tabs) {
    for (const f of filesByTab[from]) {
      const lines = textByFile[f].split('\n');
      lines.forEach((line, i) => {
        for (const to of tabs) {
          if (to === from) continue;
          const re = patternsByTab[to];
          re.lastIndex = 0;
          const found = line.match(re);
          if (found) found.forEach(() => hits.push({ from, to, file: f, line: i + 1, text: line.trim().slice(0, 140) }));
        }
      });
    }
  }
  return hits;
}

// 같은 일을 하는 중복 세포 — 군(family)마다 "자기 구현"의 정의 서명(정규식). 노션 청사진 6절 「중복 세포」와 같은 항목.
// 정의 서명만 센다(호출은 세지 않는다). 군을 더하면 MODULE-BLUEPRINT.md 「건강 지표」 표에도 더한다.
const DUP_FAMILIES = [
  { key: 'toast', label: '토스트 연결 통로(index.html 정본 밖에서 각자 만든 toast 함수)', re: /\bfunction\s+(toast|showToast)\s*\(|\b(toastFn)\s*=\s*function\b/, excludeIndex: true },
  { key: 'modalBridge', label: '모달 연결 통로(index.html openModal 밖에서 각자 만든 openModal 함수)', re: /\bfunction\s+(openModal)\s*\(/, excludeIndex: true },
  { key: 'recap', label: '리캡 창 구현', re: /\bfunction\s+(\w*Recap\w*Modal)\s*\(|\b(\w*Recap\w*Modal)\s*:\s*function\b/ },
  { key: 'timer', label: '타이머·스톱워치 화면 구현', re: /\bfunction\s+(render\w*(?:Timer|Stopwatch)\w*|update\w*Timer\w*Display|handle\w*Stopwatch\w*Toggle)\s*\(/ },
  { key: 'selfOverlay', label: '공용 모달 대신 직접 만든 전체 화면 덮개', re: /(position\s*:\s*fixed\s*;\s*(?:inset\s*:\s*0|top\s*:\s*0\s*;\s*left\s*:\s*0\s*;\s*right\s*:\s*0\s*;\s*bottom\s*:\s*0))|(\.style\.inset\s*=\s*['"]0['"])|(className\s*=\s*['"][^'"]*(?:backdrop|overlay)[^'"]*['"])/ },
  { key: 'nativeConfirm', label: '브라우저 기본 확인창 confirm() 호출(바텀시트 확인창 openBottomSheetConfirm 대신)', re: /(?:^|[^.\w$])(confirm)\(|\bwindow\.(confirm)\(/ }
];

function duplicateFamilies(root, jsFiles) {
  const out = {};
  const sources = [];
  const indexPath = path.join(root, 'index.html');
  if (fs.existsSync(indexPath)) sources.push({ file: 'index.html', text: blankCommentOnlyLines(maskToInlineScripts(readText(indexPath))) });
  for (const f of jsFiles) sources.push({ file: f, text: blankCommentOnlyLines(readText(path.join(root, f))) });
  for (const fam of DUP_FAMILIES) {
    const sites = [];
    for (const src of sources) {
      if (fam.excludeIndex && src.file === 'index.html') continue;
      src.text.split('\n').forEach((line, i) => {
        const g = new RegExp(fam.re.source, 'g');
        let m;
        while ((m = g.exec(line))) {
          const name = m.slice(1).find(Boolean) || m[0];
          sites.push({ file: src.file, line: i + 1, name: String(name).trim().slice(0, 60) });
        }
      });
    }
    out[fam.key] = { label: fam.label, count: sites.length, sites };
  }
  return out;
}

// 실제로 그리는 작은 세포: js/tabs/*/sub-*.js 중 자기 코드에서 DOM 을 쓰는 것(innerHTML·textContent 대입·createElement·insertAdjacentHTML·appendChild)
// 나머지는 index.html 전역 렌더 함수에 위임하는 껍데기다(노션 청사진 4절 「위임 껍데기」).
function drawingSmallCells(root) {
  const subs = listJs(root, 'js/tabs').filter(f => /\/sub-[^/]+\.js$/.test(f));
  const re = /\.innerHTML\s*=|\.textContent\s*=|createElement\(|insertAdjacentHTML\(|appendChild\(/;
  const drew = subs.filter(f => re.test(blankCommentOnlyLines(readText(path.join(root, f)))));
  return { drew: drew.length, total: subs.length, cells: drew };
}

// 데이터 중복 저장: 원장 설계서(#660 docs/specs/LEDGER-DESIGN-2026-10-04.md) 1절 지도표의 "중복 저장 = 예" 행 수.
// 설계서가 없거나 표 형식이 바뀌면 null(측정불가).
function dataDuplicates(root) {
  const file = path.join(root, 'docs', 'specs', 'LEDGER-DESIGN-2026-10-04.md');
  if (!fs.existsSync(file)) return { count: null, source: null };
  const src = readText(file);
  const start = src.indexOf('## 1. 현재 지도');
  const end = src.indexOf('### 1-1.');
  if (start < 0 || end < 0) return { count: null, source: 'docs/specs/LEDGER-DESIGN-2026-10-04.md' };
  const rows = src.slice(start, end).split('\n').filter(l => /^\| M\d{2} \|/.test(l));
  const ids = rows.map(r => r.split(/(?<!\\)\|/).slice(1, -1).map(x => x.trim())).filter(c => c[6] === '예').map(c => c[0]);
  return { count: ids.length, items: rows.length, ids, source: 'docs/specs/LEDGER-DESIGN-2026-10-04.md 1절 지도표' };
}

function layerOf(rel) {
  const m = /^js\/([^/]+)\//.exec(rel);
  if (m && LAYERS.includes(m[1])) return m[1];
  return 'legacy';
}

/**
 * 저장소 root 를 재서 지표 객체를 돌려준다.
 * @param {string} root
 */
function measure(root) {
  const indexPath = path.join(root, 'index.html');
  const html = fs.existsSync(indexPath) ? readText(indexPath) : '';
  const scripts = inlineScripts(html);
  const inlineBody = scripts.map(s => s.body).join('\n');

  const jsFiles = listJs(root, 'js');
  const productFiles = [];
  if (fs.existsSync(indexPath)) productFiles.push('index.html');
  if (fs.existsSync(path.join(root, 'ui.js'))) productFiles.push('ui.js');
  productFiles.push(...jsFiles);

  const windowByFile = {};
  const aliasByFile = {};
  let windowTotal = 0;
  let aliasTotal = 0;
  for (const f of productFiles) {
    const raw = f === 'index.html' ? inlineBody : readText(path.join(root, f));
    const code = blankCommentOnlyLines(raw);
    const w = countRe(code, RE_WINDOW_ASSIGN);
    const a = countRe(code, RE_ALIAS_ASSIGN);
    if (w) windowByFile[f] = w;
    if (a) aliasByFile[f] = a;
    windowTotal += w;
    aliasTotal += a;
  }

  const sizes = {};
  for (const f of jsFiles) sizes[f] = countLines(readText(path.join(root, f)));
  const oversize = {};
  Object.keys(sizes).filter(f => sizes[f] > MAX_LINES).sort((a, b) => sizes[b] - sizes[a]).forEach(f => { oversize[f] = sizes[f]; });

  const cross = crossTabRefs(root);

  const layerCounts = {};
  const moduleFiles = jsFiles.filter(f => layerOf(f) !== 'legacy');
  for (const f of jsFiles) {
    const l = layerOf(f);
    layerCounts[l] = (layerCounts[l] || 0) + 1;
  }
  const moduleLines = moduleFiles.reduce((s, f) => s + sizes[f], 0);
  const allLines = jsFiles.reduce((s, f) => s + sizes[f], 0);

  const dups = duplicateFamilies(root, jsFiles);
  const drawing = drawingSmallCells(root);
  const dataDup = dataDuplicates(root);

  return {
    schema: 'ourgoal.module-metrics/1',
    // 노션 [청사진] 아워골 세포 골격 v0.1 6절 「건강 지표」와 같은 항목 — 시각화 페이지 숫자는 이 칸으로 갱신한다
    health: {
      undifferentiatedLines: scripts.reduce((s, b) => s + b.lines, 0),
      globalLinks: windowTotal,
      oversizeCells: Object.keys(oversize).length,
      drawingSmallCells: drawing,
      duplicateCells: Object.keys(dups).reduce((o, k) => { o[k] = dups[k].count; return o; }, {}),
      dataDuplicates: dataDup.count
    },
    ratchet: {
      inlineScriptLines: scripts.reduce((s, b) => s + b.lines, 0),
      indexFunctionDecls: countRe(blankCommentOnlyLines(inlineBody), RE_FUNCTION_DECL),
      windowAssignments: windowTotal,
      oversizeJsFiles: { count: Object.keys(oversize).length, files: oversize },
      crossTabRefs: cross.length
    },
    info: {
      indexHtmlLines: countLines(html),
      inlineScriptBlocks: scripts.map(s => ({ startLine: s.startLine, lines: s.lines })),
      windowAssignmentsByFile: windowByFile,
      aliasGlobalAssignments: aliasTotal,
      aliasGlobalAssignmentsByFile: aliasByFile,
      crossTabRefList: cross.slice(0, 50),
      jsFiles: jsFiles.length,
      jsLines: allLines,
      moduleCount: moduleFiles.length,
      moduleAvgLines: moduleFiles.length ? Math.round(moduleLines / moduleFiles.length) : 0,
      jsAvgLines: jsFiles.length ? Math.round(allLines / jsFiles.length) : 0,
      layerFileCounts: layerCounts,
      duplicateCellSites: dups,
      dataDuplicateItems: dataDup,
      maxLines: MAX_LINES
    }
  };
}

/**
 * 상태창용 요약(양비스 상태창 카드 한 장) — 형식은 MODULE-BLUEPRINT.md 「진척 지표 출력 형식」
 * @param {object} m measure() 결과
 * @param {object} [goal] 6개월 목표값
 */
function summarize(m) {
  const h = m.health;
  const d = h.duplicateCells;
  // 상태창 카드 한 장: rows 는 노션 청사진 6절 표와 같은 순서·이름. goal 은 6개월 목표, dir 은 좋아지는 방향.
  return {
    card: 'ourgoal-cell-health',
    title: '아워골 세포 건강',
    rows: [
      { key: 'undifferentiatedLines', label: '미분화 덩어리(index.html 스크립트 줄)', value: h.undifferentiatedLines, goal: 0, dir: 'down' },
      { key: 'globalLinks', label: '전역 직접 연결', value: h.globalLinks, goal: '기관 한 통로', dir: 'down' },
      { key: 'oversizeCells', label: '800줄 넘는 세포', value: h.oversizeCells, goal: 0, dir: 'down' },
      { key: 'drawingSmallCells', label: '실제로 그리는 작은 세포', value: h.drawingSmallCells.drew + '/' + h.drawingSmallCells.total, goal: '전부', dir: 'up' },
      { key: 'duplicateCells', label: '같은 일을 하는 중복 세포', value: '토스트 ' + d.toast + '·리캡 ' + d.recap + '·타이머 ' + d.timer, goal: '1벌씩', dir: 'down' },
      { key: 'dataDuplicates', label: '데이터 중복 저장', value: h.dataDuplicates === null ? '측정불가' : h.dataDuplicates + '항목', goal: 0, dir: 'down' }
    ],
    ratchet: {
      inlineScriptLines: m.ratchet.inlineScriptLines,
      indexFunctionDecls: m.ratchet.indexFunctionDecls,
      windowAssignments: m.ratchet.windowAssignments,
      oversizeJsFiles: m.ratchet.oversizeJsFiles.count,
      crossTabRefs: m.ratchet.crossTabRefs
    },
    cells: { moduleCount: m.info.moduleCount, moduleAvgLines: m.info.moduleAvgLines }
  };
}

function parseArgs(argv) {
  const args = { root: path.join(__dirname, '..'), out: null, pretty: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--root') args.root = path.resolve(argv[++i]);
    else if (argv[i] === '--out') args.out = path.resolve(argv[++i]);
    else if (argv[i] === '--pretty') args.pretty = true;
    else if (argv[i] === '--card') args.card = true;
  }
  return args;
}

if (require.main === module) {
  const args = parseArgs(process.argv.slice(2));
  const m = measure(args.root);
  const doc = Object.assign({ measuredAt: new Date().toISOString().slice(0, 10) }, m, { summary: summarize(m) });
  const text = JSON.stringify(doc, null, 2) + '\n';
  if (args.out) fs.writeFileSync(args.out, text, 'utf8');
  if (args.card) process.stdout.write(JSON.stringify(Object.assign({ measuredAt: doc.measuredAt }, doc.summary), null, 2) + '\n');
  else process.stdout.write(args.pretty ? text : JSON.stringify(doc) + '\n');
}

module.exports = { measure, summarize, countLines, blankCommentOnlyLines, inlineScripts, maskToInlineScripts, listJs, crossTabRefs, tabDefinedSymbols, inlineWindowSymbols, MAX_LINES };
