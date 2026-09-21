'use strict';
// 법정(court) — 모듈 로드 탐침(L2 실행 확인).
// js/*.js 를 하나씩 격리된 vm 에서 실제로 실행해 본다. "문법은 맞지만 로드하자마자 죽는" 모듈을 잡는다.
// 절대 기준이 아니라 base 대비 회귀만 반려한다(브라우저 API 가 없어 양쪽 다 죽는 모듈은 '탐침 불충분'으로 남긴다).
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const { stripHtmlComments } = require('../lib/strip');

function makeSandbox() {
  const noop = function () {};
  const el = () => ({
    style: {}, dataset: {}, classList: { add: noop, remove: noop, toggle: noop, contains: () => false },
    addEventListener: noop, removeEventListener: noop, appendChild: noop, removeChild: noop, setAttribute: noop, getAttribute: () => null,
    querySelector: () => null, querySelectorAll: () => [], getBoundingClientRect: () => ({ left: 0, top: 0, width: 0, height: 0 }),
    getContext: () => null, insertAdjacentHTML: noop, remove: noop, focus: noop, click: noop, children: [], childNodes: [], innerHTML: '', textContent: '',
  });
  const store = new Map();
  const storage = { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => { store.set(k, String(v)); }, removeItem: k => { store.delete(k); }, clear: () => store.clear(), key: () => null, length: 0 };
  const document = Object.assign(el(), {
    readyState: 'loading', body: el(), head: el(), documentElement: el(), cookie: '',
    getElementById: () => null, createElement: () => el(), createElementNS: () => el(), createTextNode: () => el(), createDocumentFragment: () => el(),
  });
  const win = {
    document, localStorage: storage, sessionStorage: storage, console: { log: noop, info: noop, warn: noop, error: noop, debug: noop },
    navigator: { userAgent: 'court-probe', language: 'ko-KR', onLine: true, serviceWorker: undefined, vibrate: noop },
    location: { href: 'http://127.0.0.1/', origin: 'http://127.0.0.1', pathname: '/', search: '', hash: '', hostname: '127.0.0.1', protocol: 'http:' },
    history: { pushState: noop, replaceState: noop, back: noop, length: 1, state: null },
    addEventListener: noop, removeEventListener: noop, dispatchEvent: () => true,
    setTimeout: () => 0, clearTimeout: noop, setInterval: () => 0, clearInterval: noop, requestAnimationFrame: () => 0, cancelAnimationFrame: noop,
    matchMedia: () => ({ matches: false, addEventListener: noop, removeEventListener: noop, addListener: noop, removeListener: noop }),
    getComputedStyle: () => ({ getPropertyValue: () => '' }), fetch: () => new Promise(noop), alert: noop, confirm: () => false, prompt: () => null,
    CustomEvent: function CustomEvent() {}, Event: function Event() {}, MutationObserver: function () { return { observe: noop, disconnect: noop }; },
    IntersectionObserver: function () { return { observe: noop, disconnect: noop, unobserve: noop }; }, ResizeObserver: function () { return { observe: noop, disconnect: noop }; },
    Image: function () { return el(); }, Audio: function () { return el(); }, URL: { createObjectURL: () => '', revokeObjectURL: noop }, innerWidth: 375, innerHeight: 812, devicePixelRatio: 2,
  };
  win.window = win; win.self = win; win.globalThis = win; win.top = win; win.parent = win;
  return win;
}

function loadOne(file) {
  const code = fs.readFileSync(file, 'utf8');
  const sandbox = makeSandbox();
  const before = new Set(Object.keys(sandbox));
  vm.createContext(sandbox);
  let error = null;
  try { vm.runInContext(code, sandbox, { filename: path.basename(file), timeout: 3000 }); }
  catch (e) { error = (e && e.name ? e.name : 'Error') + ': ' + (e && e.message ? e.message : String(e)); }
  const globals = Object.keys(sandbox).filter(k => !before.has(k)).sort();
  return { ok: error === null, error, globals };
}

function listModules(siteDir, dirs) {
  const out = [];
  for (const d of dirs || ['js']) {
    const abs = path.join(siteDir, d);
    let names = [];
    try { names = fs.readdirSync(abs); } catch (e) { names = []; listModules.errors.push(d + ': ' + ((e && e.code) || (e && e.message) || 'read error')); }
    for (const n of names.sort()) if (n.endsWith('.js')) out.push(d + '/' + n);
  }
  return out;
}

listModules.errors = [];

function probeModules(siteDir, dirs) {
  const res = {};
  for (const rel of listModules(siteDir, dirs)) res[rel] = loadOne(path.join(siteDir, rel));
  return res;
}

// index.html 이 script 태그로 실제로 부르는 저장소 안 파일들(주석 속 글자·설명문은 부르는 것이 아니다). 앞의 ./ · / 와 뒤의 ?v=… 는 떼고 비교한다.
function scriptSrcs(indexHtml) {
  const out = new Set();
  if (typeof indexHtml !== 'string') return out;
  const re = /<script\b[^>]*?\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/gi;
  const html = stripHtmlComments(indexHtml);
  for (let m = re.exec(html); m; m = re.exec(html)) {
    const src = (m[1] !== undefined ? m[1] : (m[2] !== undefined ? m[2] : m[3])).trim();
    if (/^[a-z][a-z0-9+.-]*:|^\/\//i.test(src)) continue; // 외부 주소
    out.add(src.split(/[?#]/)[0].replace(/^(?:\.?\/)+/, ''));
  }
  return out;
}

// base 에서 멀쩡하던 모듈이 head 에서 죽거나, 등록하던 전역이 앱에서 사라지면 회귀다.
function compare(baseRes, headRes, headIndexHtml) {
  const regressions = [], insufficient = [], fixed = [], moved = [];
  const loaded = scriptSrcs(headIndexHtml);
  // 전역은 파일 단위가 아니라 앱 전체로 본다: 그 전역을 작업 커밋의 다른 부품이 등록하면(파일 나누기·옮기기) 앱에서는 사라진 것이 아니다.
  const homes = new Map(); // 전역 이름 → 작업 커밋에서 그것을 등록하는 부품들
  for (const [rel, h] of Object.entries(headRes)) if (h.ok) for (const g of h.globals) { if (!homes.has(g)) homes.set(g, []); homes.get(g).push(rel); }
  for (const [rel, h] of Object.entries(headRes)) {
    const b = baseRes[rel];
    if (!b) { if (!h.ok) insufficient.push({ file: rel, note: '새 파일인데 탐침 환경에서 로드 실패: ' + h.error }); continue; }
    if (b.ok && !h.ok) regressions.push({ file: rel, kind: 'LOAD_THROWS', detail: h.error });
    else if (!b.ok && !h.ok) insufficient.push({ file: rel, note: '양쪽 모두 로드 실패(브라우저 전용 API 로 추정): ' + h.error });
    else if (!b.ok && h.ok) fixed.push({ file: rel });
    if (b.ok && h.ok) {
      const gone = b.globals.filter(g => !h.globals.includes(g));
      const lost = gone.filter(g => !homes.has(g));
      if (lost.length) regressions.push({ file: rel, kind: 'GLOBAL_LOST', detail: '전역 등록이 사라짐: ' + lost.join(', ') });
      for (const g of gone.filter(x => homes.has(x))) {
        const to = homes.get(g);
        moved.push({ file: rel, global: g, to });
        // 옮겨 간 파일을 첫 화면이 script 태그로 부르는지까지만 본다. 원래 파일은 부르는데 옮겨 간 파일은 안 부르면, 다른 방식으로 부르는지 탐침은 알 수 없다 → "못 봄"으로 남긴다.
        if (loaded.size && loaded.has(rel) && !to.some(f => loaded.has(f))) insufficient.push({ file: rel, note: '전역 ' + g + ' 의 등록 위치가 ' + to.join(', ') + ' 쪽으로 바뀌었는데 index.html 의 script 태그에서 그 파일을 찾지 못했다 — 다른 방식으로 부르는지는 탐침이 알 수 없다' });
      }
    }
    if (b.ok && !h.ok && b.globals.length) regressions[regressions.length - 1].detail += ' → 이 모듈이 등록하던 전역(' + b.globals.join(', ') + ')이 앱에 없게 된다';
  }
  // 기준 커밋에 있던 부품이 작업 커밋에서 통째로 사라진 경우. 첫 화면(index.html)이 script 태그로 아직 그 파일을 부르면 앱이 깨진다.
  const removed = [];
  for (const rel of Object.keys(baseRes)) {
    if (headRes[rel]) continue;
    const stillReferenced = loaded.has(rel);
    removed.push({ file: rel, stillReferenced });
    if (stillReferenced) regressions.push({ file: rel, kind: 'MODULE_REMOVED', detail: '부품 파일이 사라졌는데 index.html 은 아직 그 파일을 부른다(script 태그)' });
  }
  return { regressions, insufficient, fixed, removed, moved, counts: { head: Object.keys(headRes).length, headOk: Object.values(headRes).filter(x => x.ok).length, base: Object.keys(baseRes).length, baseOk: Object.values(baseRes).filter(x => x.ok).length } };
}

module.exports = { probeModules, compare, loadOne, listModules, scriptSrcs };

if (require.main === module) {
  const [baseDir, headDir] = process.argv.slice(2);
  if (!baseDir || !headDir) { console.error('사용: node court/probes/module-load.js <base 스냅샷 폴더> <head 스냅샷 폴더>'); process.exit(2); }
  let headIndexHtml = null;
  try { headIndexHtml = fs.readFileSync(path.join(headDir, 'index.html'), 'utf8'); } catch (_) { headIndexHtml = null; }
  const r = compare(probeModules(baseDir), probeModules(headDir), headIndexHtml);
  r.readErrors = listModules.errors;
  console.log(JSON.stringify(r, null, 2));
  process.exit(r.regressions.length ? 1 : 0);
}
