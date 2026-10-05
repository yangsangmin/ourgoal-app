#!/usr/bin/env node
/**
 * 숨김 게이트 — 정적판 (#TASK-ES-458 · W98 재발 방지)
 *
 * 무엇을 막나: 누르는 요소(처리기가 걸린 요소)가 !important 숨김 아래에 새로 갇히는 것.
 *   #TASK-ES-433·#TASK-ES-440 에서 살아 있는 기능 7개가 ui.css 의 4테마 `display:none !important` 규칙과
 *   인라인 `display:none !important` 칸에 갇혀 보이는 진입로가 0개였다. 그 뒤로 새로 생기는 것만 막는다(증가 금지 — module-guard 와 같은 래칫).
 *
 * 사용:
 *   node scripts/hidden-entry-guard.js                         — 검사(npm test 가 tests/hidden-entry-guard.test.js 를 거쳐 부른다)
 *   node scripts/hidden-entry-guard.js --list                  — 지금 숨은 처리기 요소와 숨긴 규칙을 모두 출력
 *   node scripts/hidden-entry-guard.js --update                — 더는 숨지 않는 항목을 허용 목록에서 지운다(줄이는 방향만)
 *   node scripts/hidden-entry-guard.js --allow "<key>" --reason "20자 이상 사유"
 *                                                              — 새 숨김을 허용 목록에 올린다(사유 필수 · 상민님 지시면 TASK 번호를 적는다)
 *   공통 선택: --root <저장소> --baseline <허용목록.json> --quiet --json
 *
 * 재는 것(파일을 읽기만 한다):
 *   1) 숨김 규칙: ui.css 의 규칙 중 선언에 `display: none !important` 또는 `visibility: hidden !important` 가 있는 것(@media print 제외)
 *      + index.html 마크업의 인라인 style 에 같은 선언이 있는 요소.
 *   2) 처리기 요소: index.html 마크업에서 onclick 속성이 있는 요소, 또는 id 가 있고 그 id 로 click 처리기를 거는 코드
 *      (getElementById('id') … .addEventListener / .onclick, 변수에 담아 거는 꼴 포함)가 index.html·js/**.js 에 있는 요소.
 *   3) 처리기 요소 자신이나 조상이 1) 에 맞으면 「숨은 처리기 요소」. 키는 `#id`, id 가 없으면 `#가까운조상id > 태그 "글자"`.
 * 한계(정직하게): 자바스크립트가 문자열로 그리는 마크업(예: 성소 엔진의 숨김 칸)과 실행 중에 붙는 클래스·속성으로만 맞는 규칙은
 *   이 정적판이 보지 못한다 — 그건 느린 브라우저판(docs/design/harness/hidden-entry-sweep.js, 수동)이 잰다.
 *   [data-theme]·[data-ux-mode] 처럼 html/body 에 실행 중 붙는 속성만으로 된 조각은 html·body 에 맞는 것으로 본다.
 *   :hover·:focus·::before 같은 상태·가상 요소 선택자는 「늘 숨김」이 아니라 건너뛴다.
 *
 * 허용 목록: docs/architecture/hidden-entry-baseline.json — { groups: [{ reason, keys: [...] }] }. 사유 없는 묶음은 실패.
 * 종료 코드: 0 통과 · 1 실패(허용 목록 밖의 새 숨은 처리기 요소, 또는 허용 목록 형식 위반) · 2 사용법/파일 오류
 */
'use strict';

const fs = require('fs');
const path = require('path');

const DEFAULT_BASELINE = path.join('docs', 'architecture', 'hidden-entry-baseline.json');
const MIN_REASON = 20;
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr', 'param']);
const HIDE_DECL = /(?:^|;|\s)(display\s*:\s*none\s*!\s*important|visibility\s*:\s*hidden\s*!\s*important)/i;
const STATE_PSEUDO = /::?(hover|focus|focus-visible|focus-within|active|visited|checked|disabled|enabled|empty|target|before|after|placeholder|selection|first-letter|first-line|-webkit-[\w-]+|-moz-[\w-]+|invalid|valid|placeholder-shown|indeterminate|fullscreen|backdrop)\b/i;

function parseArgs(argv) {
  const a = { root: path.join(__dirname, '..'), baseline: null, list: false, update: false, allow: null, reason: null, quiet: false, json: false };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--root') a.root = path.resolve(argv[++i]);
    else if (k === '--baseline') a.baseline = path.resolve(argv[++i]);
    else if (k === '--list') a.list = true;
    else if (k === '--update') a.update = true;
    else if (k === '--allow') a.allow = String(argv[++i] || '');
    else if (k === '--reason') a.reason = String(argv[++i] || '');
    else if (k === '--quiet') a.quiet = true;
    else if (k === '--json') a.json = true;
  }
  if (!a.baseline) a.baseline = path.join(a.root, DEFAULT_BASELINE);
  return a;
}

/* ---------- 마크업 ---------- */
function blankOut(src, re) { return src.replace(re, m => m.replace(/[^\n]/g, ' ')); }
function parseAttrs(s) {
  const out = {};
  const re = /([^\s=/>"']+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  let m;
  while ((m = re.exec(s))) out[m[1].toLowerCase()] = m[2] !== undefined ? m[2] : m[3] !== undefined ? m[3] : m[4] !== undefined ? m[4] : '';
  return out;
}
function parseMarkup(html) {
  let src = blankOut(html, /<!--[\s\S]*?-->/g);
  src = blankOut(src, /<script\b[^>]*>[\s\S]*?<\/script\s*>/gi);
  src = blankOut(src, /<style\b[^>]*>[\s\S]*?<\/style\s*>/gi);
  const root = { tag: '#root', attrs: {}, children: [], parent: null, text: '' };
  const all = [];
  const stack = [root];
  const re = /<\/([a-zA-Z][\w-]*)\s*>|<([a-zA-Z][\w-]*)((?:\s+[^\s=>"'/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/?)>/g;
  let m, last = 0, line = 1;
  const addText = (t) => {
    const s = t.replace(/\s+/g, ' ').trim();
    if (!s) return;
    for (const el of stack) if (el.text.length < 40) el.text = (el.text + ' ' + s).trim().slice(0, 40);
  };
  while ((m = re.exec(src))) {
    const between = src.slice(last, m.index);
    addText(between);
    line += (between.match(/\n/g) || []).length;
    last = re.lastIndex;
    if (m[1]) {
      const tag = m[1].toLowerCase();
      for (let i = stack.length - 1; i > 0; i--) if (stack[i].tag === tag) { stack.length = i; break; }
    } else {
      const tag = m[2].toLowerCase();
      const el = { tag, attrs: parseAttrs(m[3] || ''), children: [], parent: stack[stack.length - 1], text: '', line };
      el.id = el.attrs.id || null;
      el.classes = (el.attrs.class || '').split(/\s+/).filter(Boolean);
      el.parent.children.push(el);
      all.push(el);
      if (!VOID.has(tag) && !m[4]) stack.push(el);
    }
    line += (m[0].match(/\n/g) || []).length;
  }
  return { root, all };
}

/* ---------- CSS ---------- */
function parseCss(css) {
  const src = css.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '));
  const rules = [];
  const walk = (start, end, media) => {
    let i = start;
    while (i < end) {
      const open = src.indexOf('{', i);
      if (open < 0 || open >= end) break;
      const head = src.slice(i, open).trim();
      let depth = 1, j = open + 1;
      while (j < end && depth > 0) { if (src[j] === '{') depth++; else if (src[j] === '}') depth--; j++; }
      const body = src.slice(open + 1, j - 1);
      if (head.startsWith('@')) {
        if (/^@(media|supports|layer|container)\b/i.test(head) && !/^@media\s+print\b/i.test(head)) walk(open + 1, j - 1, head);
      } else if (HIDE_DECL.test(';' + body)) {
        const line = (src.slice(0, i).match(/\n/g) || []).length + 1 + (src.slice(i, open).match(/^\s*/)[0].match(/\n/g) || []).length;
        rules.push({ selectorText: head.replace(/\s+/g, ' '), media: media || null, line });
      }
      i = j;
    }
  };
  walk(0, src.length, null);
  return rules;
}
function splitTop(s, sep) {
  const out = []; let depth = 0, q = null, cur = '';
  for (const ch of s) {
    if (q) { cur += ch; if (ch === q) q = null; continue; }
    if (ch === '"' || ch === "'") { q = ch; cur += ch; continue; }
    if (ch === '(' || ch === '[') depth++;
    if (ch === ')' || ch === ']') depth--;
    if (ch === sep && depth === 0) { out.push(cur); cur = ''; continue; }
    cur += ch;
  }
  out.push(cur);
  return out.map(x => x.trim()).filter(Boolean);
}
// "a > b c" → [{compound, comb}] (comb = 다음 조각과의 결합자)
function tokenizeSelector(sel) {
  const parts = []; let cur = '', depth = 0, q = null;
  const push = (comb) => { if (cur.trim()) parts.push({ c: cur.trim(), comb }); cur = ''; };
  for (let i = 0; i < sel.length; i++) {
    const ch = sel[i];
    if (q) { cur += ch; if (ch === q) q = null; continue; }
    if (ch === '"' || ch === "'") { q = ch; cur += ch; continue; }
    if (ch === '(' || ch === '[') depth++;
    if (ch === ')' || ch === ']') depth--;
    if (depth === 0 && (ch === '>' || ch === '+' || ch === '~')) { push(ch); continue; }
    if (depth === 0 && /\s/.test(ch)) { if (cur.trim()) { let k = i; while (k < sel.length && /\s/.test(sel[k])) k++; if (!'>+~'.includes(sel[k])) push(' '); } continue; }
    cur += ch;
  }
  push(null);
  // 결합자는 앞 조각에 붙인다: parts[i].comb = parts[i] 와 parts[i+1] 사이
  for (let i = 0; i < parts.length; i++) if (parts[i].comb === null && i < parts.length - 1) parts[i].comb = ' ';
  return parts;
}
function parseCompound(c) {
  const out = { tag: null, ids: [], classes: [], attrs: [], nots: [], other: [] };
  const re = /^(\*|[a-zA-Z][\w-]*)|#([\w-]+)|\.([\w-]+)|\[([^\]]+)\]|:not\(([^)]*)\)|::?([\w-]+(?:\([^)]*\))?)/g;
  let m;
  while ((m = re.exec(c))) {
    if (m[1]) out.tag = m[1] === '*' ? null : m[1].toLowerCase();
    else if (m[2]) out.ids.push(m[2]);
    else if (m[3]) out.classes.push(m[3]);
    else if (m[4]) { const a = m[4].match(/^\s*([\w-]+)\s*(?:([~|^$*]?=)\s*["']?([^"']*)["']?\s*(?:i)?)?\s*$/); if (a) out.attrs.push({ name: a[1].toLowerCase(), op: a[2] || null, val: a[3] }); }
    else if (m[5] !== undefined) out.nots.push(m[5]);
    else if (m[6]) out.other.push(m[6]);
  }
  return out;
}
const RUNTIME_ROOT_ATTRS = /^(data-theme|data-ux-mode|data-high-contrast|data-[\w-]*)$/;
function compoundMatches(el, cp) {
  if (!el || el.tag === '#root') return false;
  const isRoot = el.tag === 'html' || el.tag === 'body';
  // html/body 에 실행 중 붙는 속성·클래스만으로 된 조각 → html·body 에 맞는 것으로 본다
  const onlyRuntimeRoot = !cp.tag && !cp.ids.length && cp.attrs.length && cp.attrs.every(a => RUNTIME_ROOT_ATTRS.test(a.name)) && !cp.classes.length;
  if (onlyRuntimeRoot) return isRoot;
  if (cp.tag && cp.tag !== el.tag) return false;
  if (isRoot && (cp.tag === 'html' || cp.tag === 'body')) return true; // html[data-theme=…] · body[data-ux-mode] 는 실행 중 상태
  for (const id of cp.ids) if (el.id !== id) return false;
  for (const c of cp.classes) if (!el.classes.includes(c)) return false;
  for (const a of cp.attrs) {
    if (!(a.name in el.attrs)) return false;
    const v = el.attrs[a.name];
    if (a.op === '=' && v !== a.val) return false;
    if (a.op === '~=' && !v.split(/\s+/).includes(a.val)) return false;
    if (a.op === '^=' && !v.startsWith(a.val)) return false;
    if (a.op === '$=' && !v.endsWith(a.val)) return false;
    if (a.op === '*=' && !v.includes(a.val)) return false;
  }
  for (const n of cp.nots) { const inner = parseCompound(n); if (compoundMatches(el, inner)) return false; }
  if (cp.other.some(o => /^:?(root)$/.test(o))) return isRoot && el.tag === 'html';
  return true;
}
function selectorMatches(el, parts, idx) {
  if (!compoundMatches(el, parts[idx].cp)) return false;
  if (idx === 0) return true;
  const comb = parts[idx - 1].comb;
  if (comb === '>') return selectorMatches(el.parent, parts, idx - 1);
  if (comb === '+' || comb === '~') {
    const sibs = el.parent ? el.parent.children : [];
    const k = sibs.indexOf(el);
    const cands = comb === '+' ? sibs.slice(Math.max(0, k - 1), k) : sibs.slice(0, k);
    return cands.some(s => selectorMatches(s, parts, idx - 1));
  }
  for (let p = el.parent; p; p = p.parent) if (selectorMatches(p, parts, idx - 1)) return true;
  return false;
}
function compileRules(rules) {
  const out = [];
  for (const r of rules) for (const sel of splitTop(r.selectorText, ',')) {
    if (STATE_PSEUDO.test(sel)) continue;
    const parts = tokenizeSelector(sel).map(p => ({ ...p, cp: parseCompound(p.c) }));
    if (!parts.length) continue;
    out.push({ sel, parts, line: r.line, media: r.media });
  }
  return out;
}

/* ---------- 처리기 ---------- */
function listJs(root) {
  const out = [];
  const walk = (d) => { let es = []; try { es = fs.readdirSync(d, { withFileTypes: true }); } catch (_) { return; } for (const e of es) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (e.name.endsWith('.js')) out.push(p); } };
  walk(path.join(root, 'js'));
  const ui = path.join(root, 'ui.js'); if (fs.existsSync(ui)) out.push(ui);
  return out;
}
function handlerIds(codes) {
  const ids = new Set();
  const direct = /getElementById\(\s*['"]([\w-]+)['"]\s*\)\s*(?:\?\.|\.)\s*(?:addEventListener\(\s*['"](?:click|pointerup|pointerdown|touchend|mousedown|mouseup)['"]|onclick\s*=)/g;
  const qs = /querySelector\(\s*['"]#([\w-]+)['"]\s*\)\s*(?:\?\.|\.)\s*(?:addEventListener\(\s*['"](?:click|pointerup|pointerdown|touchend|mousedown|mouseup)['"]|onclick\s*=)/g;
  const assign = /(?:var|let|const)\s+([\w$]+)\s*=\s*(?:document\.)?(?:getElementById\(\s*['"]([\w-]+)['"]\s*\)|querySelector\(\s*['"]#([\w-]+)['"]\s*\))/g;
  for (const code of codes) {
    let m;
    while ((m = direct.exec(code))) ids.add(m[1]);
    while ((m = qs.exec(code))) ids.add(m[1]);
    while ((m = assign.exec(code))) {
      const v = m[1].replace(/\$/g, '\\$'), id = m[2] || m[3];
      const tail = code.slice(m.index, m.index + 4000);
      if (new RegExp('\\b' + v + '\\s*(?:\\?\\.|\\.)\\s*(?:addEventListener\\(\\s*[\'"](?:click|pointerup|pointerdown|touchend|mousedown|mouseup)[\'"]|onclick\\s*=)').test(tail)) ids.add(id);
    }
  }
  return ids;
}

/* ---------- 측정 ---------- */
function keyOf(el) {
  if (el.id) return '#' + el.id;
  let anc = el.parent; while (anc && !anc.id) anc = anc.parent;
  return (anc && anc.id ? '#' + anc.id + ' > ' : '') + el.tag + ' "' + (el.text || (el.attrs.onclick || '').slice(0, 40)) + '"';
}
function measure(root) {
  const htmlPath = path.join(root, 'index.html'), cssPath = path.join(root, 'ui.css');
  const html = fs.readFileSync(htmlPath, 'utf8');
  const css = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, 'utf8') : '';
  const { all } = parseMarkup(html);
  const rules = compileRules(parseCss(css));
  const inlineScripts = (html.match(/<script\b(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script\s*>/gi) || []);
  const hIds = handlerIds(inlineScripts.concat(listJs(root).map(f => fs.readFileSync(f, 'utf8'))));
  // 요소별 숨김 사유(자기 자신만) — 조상은 아래에서 올라가며 모은다
  const own = new Map();
  for (const el of all) {
    const why = [];
    if (HIDE_DECL.test(';' + (el.attrs.style || ''))) why.push('inline style !important @index.html:' + el.line);
    for (const r of rules) if (selectorMatches(el, r.parts, r.parts.length - 1)) why.push(r.sel + ' @ui.css:' + r.line);
    if (why.length) own.set(el, why);
  }
  const hidden = new Map();
  for (const el of all) {
    const isHandler = ('onclick' in el.attrs) || (el.id && hIds.has(el.id));
    if (!isHandler) continue;
    const by = [];
    for (let p = el; p && p.tag !== '#root'; p = p.parent) if (own.has(p)) for (const w of own.get(p)) by.push((p === el ? '' : '(조상 ' + keyOf(p) + ') ') + w);
    if (!by.length) continue;
    const k = keyOf(el);
    if (!hidden.has(k)) hidden.set(k, { key: k, by: [] });
    for (const b of by) if (!hidden.get(k).by.includes(b)) hidden.get(k).by.push(b);
  }
  return { hidden: [...hidden.values()].sort((a, b) => a.key < b.key ? -1 : 1), counts: { elements: all.length, hideRules: rules.length, handlerIdsInCode: hIds.size } };
}

/* ---------- 허용 목록 ---------- */
function loadBaseline(file) {
  if (!file || !fs.existsSync(file)) return { groups: [] };
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
function baselineErrors(b) {
  const errs = []; const seen = new Set();
  if (!b || !Array.isArray(b.groups)) return ['허용 목록 groups 배열이 없다'];
  b.groups.forEach((g, i) => {
    if (!g || typeof g.reason !== 'string' || g.reason.trim().length < MIN_REASON) errs.push('묶음 ' + (i + 1) + ': 사유(reason) 가 ' + MIN_REASON + '자 미만');
    if (!Array.isArray(g.keys) || !g.keys.length) errs.push('묶음 ' + (i + 1) + ': keys 가 비었다');
    for (const k of g.keys || []) { if (seen.has(k)) errs.push('키 중복: ' + k); seen.add(k); }
  });
  return errs;
}
function check(root, baselineFile) {
  const m = measure(root);
  const b = loadBaseline(baselineFile);
  const errs = baselineErrors(b);
  const allowed = new Set((b.groups || []).flatMap(g => g.keys || []));
  const now = new Set(m.hidden.map(h => h.key));
  const added = m.hidden.filter(h => !allowed.has(h.key));
  const gone = [...allowed].filter(k => !now.has(k));
  return { ok: !errs.length && !added.length, errors: errs, added, gone, measured: m };
}

function main() {
  const a = parseArgs(process.argv.slice(2));
  if (!fs.existsSync(path.join(a.root, 'index.html'))) { console.error('[숨김 게이트] index.html 이 없다: ' + a.root); process.exit(2); }
  if (a.list) { const m = measure(a.root); console.log(JSON.stringify(m, null, 1)); return; }
  if (a.allow) {
    if (!a.reason || a.reason.trim().length < MIN_REASON) { console.error('[숨김 게이트] --allow 에는 --reason "' + MIN_REASON + '자 이상 사유" 가 필요하다'); process.exit(2); }
    const b = loadBaseline(a.baseline);
    b.groups = b.groups || [];
    b.groups.push({ reason: a.reason.trim(), keys: [a.allow], addedAt: new Date().toISOString().slice(0, 10) });
    fs.writeFileSync(a.baseline, JSON.stringify(b, null, 1) + '\n', 'utf8');
    console.log('[숨김 게이트] 허용 목록에 올림: ' + a.allow);
    return;
  }
  const r = check(a.root, a.baseline);
  if (a.update) {
    const b = loadBaseline(a.baseline);
    const gone = new Set(r.gone);
    b.groups = (b.groups || []).map(g => ({ ...g, keys: g.keys.filter(k => !gone.has(k)) })).filter(g => g.keys.length);
    fs.writeFileSync(a.baseline, JSON.stringify(b, null, 1) + '\n', 'utf8');
    console.log('[숨김 게이트] 허용 목록에서 지움 ' + r.gone.length + '개(더는 숨지 않음)');
    return;
  }
  if (a.json) { console.log(JSON.stringify({ ok: r.ok, errors: r.errors, added: r.added, gone: r.gone, counts: r.measured.counts, hiddenCount: r.measured.hidden.length }, null, 1)); process.exit(r.ok ? 0 : 1); }
  if (!a.quiet || !r.ok) {
    console.log('[숨김 게이트] 숨은 처리기 요소 ' + r.measured.hidden.length + '개 · 허용 목록 밖 ' + r.added.length + '개');
    for (const e of r.errors) console.log('  ✖ 허용 목록: ' + e);
    for (const h of r.added) console.log('  ✖ 새로 숨은 처리기 요소 ' + h.key + ' ← ' + h.by.slice(0, 3).join(' | '));
    if (r.added.length) console.log('    → 보이는 진입로를 두거나 숨김 선택자를 좁히세요. 정말 숨겨야 하면(상민님 결정 등) node scripts/hidden-entry-guard.js --allow "<키>" --reason "사유"');
    if (r.gone.length) console.log('  ℹ 더는 숨지 않는 허용 항목 ' + r.gone.length + '개 — node scripts/hidden-entry-guard.js --update 로 지울 수 있다');
  }
  if (r.ok) console.log('✓ 숨김 게이트 통과');
  process.exit(r.ok ? 0 : 1);
}

module.exports = { measure, check, parseCss, parseMarkup, compileRules, selectorMatches, handlerIds, baselineErrors };
if (require.main === module) main();
