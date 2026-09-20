'use strict';
// 법정(court) — 모듈 로드 탐침(L2 실행 확인).
// js/*.js 를 하나씩 격리된 vm 에서 실제로 실행해 본다. "문법은 맞지만 로드하자마자 죽는" 모듈을 잡는다.
// 절대 기준이 아니라 base 대비 회귀만 반려한다(브라우저 API 가 없어 양쪽 다 죽는 모듈은 '탐침 불충분'으로 남긴다).
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

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

// base 에서 멀쩡하던 모듈이 head 에서 죽거나, 등록하던 전역이 사라지면 회귀다.
function compare(baseRes, headRes) {
  const regressions = [], insufficient = [], fixed = [];
  for (const [rel, h] of Object.entries(headRes)) {
    const b = baseRes[rel];
    if (!b) { if (!h.ok) insufficient.push({ file: rel, note: '새 파일인데 탐침 환경에서 로드 실패: ' + h.error }); continue; }
    if (b.ok && !h.ok) regressions.push({ file: rel, kind: 'LOAD_THROWS', detail: h.error });
    else if (!b.ok && !h.ok) insufficient.push({ file: rel, note: '양쪽 모두 로드 실패(브라우저 전용 API 로 추정): ' + h.error });
    else if (!b.ok && h.ok) fixed.push({ file: rel });
    if (b.ok && h.ok) {
      const lost = b.globals.filter(g => !h.globals.includes(g));
      if (lost.length) regressions.push({ file: rel, kind: 'GLOBAL_LOST', detail: '전역 등록이 사라짐: ' + lost.join(', ') });
    }
    if (b.ok && !h.ok && b.globals.length) regressions[regressions.length - 1].detail += ' → 이 모듈이 등록하던 전역(' + b.globals.join(', ') + ')이 앱에 없게 된다';
  }
  return { regressions, insufficient, fixed, counts: { head: Object.keys(headRes).length, headOk: Object.values(headRes).filter(x => x.ok).length, base: Object.keys(baseRes).length, baseOk: Object.values(baseRes).filter(x => x.ok).length } };
}

module.exports = { probeModules, compare, loadOne, listModules };

if (require.main === module) {
  const [baseDir, headDir] = process.argv.slice(2);
  if (!baseDir || !headDir) { console.error('사용: node court/probes/module-load.js <base 스냅샷 폴더> <head 스냅샷 폴더>'); process.exit(2); }
  const r = compare(probeModules(baseDir), probeModules(headDir));
  r.readErrors = listModules.errors;
  console.log(JSON.stringify(r, null, 2));
  process.exit(r.regressions.length ? 1 : 0);
}
