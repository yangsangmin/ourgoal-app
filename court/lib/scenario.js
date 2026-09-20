'use strict';
// 법정(court) — 시나리오 실행기.
// 시나리오는 "닫힌 어휘"의 JSON 이다. 임의 JS 실행이 없으므로 핸들러 직접 호출·스타일 주입 같은 연출이 불가능하다.
//  - 클릭은 실제 마우스 입력(Input.dispatchMouseEvent)이고, 누르기 전에 그 자리가 실제로 눌리는 자리인지 확인한다.
//  - 선택자는 보이는 요소 정확히 1개에만 걸려야 한다(아무 버튼이나 누르고 통과하는 길을 막는다).
//  - 사전 상태 주입은 금고의 fixture 이름으로만, 이동은 허용 경로로만 한다(결과 화면을 연출하는 길을 막는다).
//  - 행동 "전에도 이미 참"이던 확인은 공허 확인으로 표시한다(항상 참인 단언으로 통과하는 길을 막는다).
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { launch, sleep } = require('./chrome');

const DO_KINDS = ['goto', 'waitFor', 'click', 'type', 'select', 'fill', 'check', 'key', 'back', 'setViewport', 'setOffline', 'seedLocalStorage', 'wait'];
const EXPECT_KINDS = ['visible', 'notVisible', 'exists', 'notExists', 'textContains', 'textEquals', 'count', 'attr', 'hasClass', 'notHasClass', 'style', 'rect', 'noHorizontalOverflow', 'noExceptions', 'urlContains', 'stillInApp', 'neverVisible'];
const ACTION_KINDS = ['click', 'type', 'select', 'fill', 'check', 'key', 'back']; // 사용자가 실제로 하는 행동
const WEAK_EXPECTS = ['noExceptions', 'stillInApp', 'exists', 'neverVisible']; // 이것만으로는 "동작을 확인했다"고 볼 수 없다(회귀 감시용)
const BANNED_EXPECT_SELECTORS = /^\s*(html|body|\*|:root|#app|main)\s*$/i;
const ALLOWED_KEYS = {
  goto: ['do', 'path', 'settleMs'], waitFor: ['do', 'selector', 'timeoutMs'], click: ['do', 'selector', 'position'],
  type: ['do', 'selector', 'text', 'clear'], select: ['do', 'selector', 'value'], fill: ['do', 'selector', 'value'], check: ['do', 'selector', 'on'],
  key: ['do', 'key'], back: ['do'], setViewport: ['do', 'width', 'height'],
  setOffline: ['do', 'offline'], seedLocalStorage: ['do', 'fixture'], wait: ['do', 'ms'],
  visible: ['expect', 'selector', 'timeoutMs'], notVisible: ['expect', 'selector', 'timeoutMs'],
  exists: ['expect', 'selector', 'timeoutMs'], notExists: ['expect', 'selector', 'timeoutMs'],
  textContains: ['expect', 'selector', 'text', 'timeoutMs'], textEquals: ['expect', 'selector', 'text', 'timeoutMs'],
  count: ['expect', 'selector', 'equals', 'min', 'max', 'timeoutMs'], attr: ['expect', 'selector', 'name', 'equals', 'timeoutMs'],
  hasClass: ['expect', 'selector', 'className', 'timeoutMs'], notHasClass: ['expect', 'selector', 'className', 'timeoutMs'],
  style: ['expect', 'selector', 'prop', 'equals', 'timeoutMs'], rect: ['expect', 'selector', 'minWidth', 'minHeight', 'timeoutMs'],
  neverVisible: ['expect', 'selector', 'text', 'forMs'],
  noHorizontalOverflow: ['expect'], noExceptions: ['expect'], urlContains: ['expect', 'text', 'timeoutMs'], stillInApp: ['expect'],
};
const KEYS = { Enter: { key: 'Enter', code: 'Enter', keyCode: 13 }, Escape: { key: 'Escape', code: 'Escape', keyCode: 27 }, Tab: { key: 'Tab', code: 'Tab', keyCode: 9 }, Backspace: { key: 'Backspace', code: 'Backspace', keyCode: 8 } };
const POSITIONS = { center: [0.5, 0.5], top: [0.5, 0.06], bottom: [0.5, 0.94], left: [0.06, 0.5], right: [0.94, 0.5] }; // 요소 안에서 누를 자리(배경 탭으로 닫기 같은 실제 사용 경로용)
const MAX_STEPS = 60, MAX_WAIT_MS = 3000, DEFAULT_EXPECT_TIMEOUT = 4000, MAX_EXPECT_TIMEOUT = 20000, SCENARIO_TIMEOUT_MS = 180000;
const DEFAULT_CONFIG_FILE = path.join(__dirname, '..', 'config.json');

function loadConfig(file) {
  const j = JSON.parse(fs.readFileSync(file || DEFAULT_CONFIG_FILE, 'utf8'));
  return { ...j, allowedPaths: j.allowedPaths || ['/', '/index.html'], fixturesDir: path.resolve(path.dirname(file || DEFAULT_CONFIG_FILE), j.fixturesDir || 'fixtures'), allowHosts: j.allowHosts || [], denyServePrefixes: j.denyServePrefixes || [] };
}

function stepKind(step) {
  if (!step || typeof step !== 'object' || Array.isArray(step)) return null;
  const has = ['do', 'expect', 'capture'].filter(k => Object.prototype.hasOwnProperty.call(step, k));
  if (has.length !== 1) return null;
  return has[0];
}

// 구조 오류(errors)는 실행 불가, 품질 약점(weaknesses)은 "공허한 시나리오"로 증거 불채택 사유가 된다.
function validateScenario(s, config) {
  const cfg = config || loadConfig();
  const errors = [], weaknesses = [];
  if (!s || typeof s !== 'object') return { errors: ['시나리오가 객체가 아니다'], weaknesses };
  if (typeof s.id !== 'string' || !/^[a-z0-9][a-z0-9-]{2,63}$/.test(s.id)) errors.push('id 는 영소문자·숫자·하이픈 3~64자');
  if (typeof s.title !== 'string' || !s.title.trim()) errors.push('title 누락');
  for (const k of Object.keys(s)) if (!['id', 'title', 'viewport', 'steps'].includes(k)) errors.push('허용되지 않은 최상위 키: ' + k);
  if (!Array.isArray(s.steps) || s.steps.length < 1 || s.steps.length > MAX_STEPS) { errors.push('steps 는 1~' + MAX_STEPS + '개 배열'); return { errors, weaknesses }; }
  let sawGoto = false, lastActionIdx = -1, strongExpectAfterAction = false, strongExpects = 0, actions = 0;
  s.steps.forEach((st, i) => {
    const kind = stepKind(st);
    const at = '단계 ' + (i + 1) + ': ';
    if (!kind) { errors.push(at + 'do·expect·capture 중 정확히 하나가 있어야 한다'); return; }
    if (kind === 'capture') {
      if (typeof st.capture !== 'string' || !/^[a-z0-9][a-z0-9-]{0,40}$/.test(st.capture)) errors.push(at + 'capture 이름은 영소문자·숫자·하이픈');
      for (const k of Object.keys(st)) if (k !== 'capture') errors.push(at + '허용되지 않은 키 ' + k);
      return;
    }
    const name = st[kind];
    const list = kind === 'do' ? DO_KINDS : EXPECT_KINDS;
    if (!list.includes(name)) { errors.push(at + '허용되지 않은 ' + kind + ': ' + String(name) + ' (임의 코드 실행은 어휘에 없다)'); return; }
    for (const k of Object.keys(st)) if (!ALLOWED_KEYS[name].includes(k)) errors.push(at + name + ' 에 허용되지 않은 키 ' + k);
    if (ALLOWED_KEYS[name].includes('selector') && (typeof st.selector !== 'string' || !st.selector.trim())) errors.push(at + 'selector 누락');
    if (kind === 'expect' && typeof st.selector === 'string' && BANNED_EXPECT_SELECTORS.test(st.selector)) errors.push(at + '확인 대상으로 쓸 수 없는 선택자(' + st.selector.trim() + ') — 항상 참이 되는 대상이다');
    if (name === 'goto') {
      sawGoto = true;
      if (typeof st.path !== 'string' || !cfg.allowedPaths.includes(st.path)) errors.push(at + 'goto.path 는 허용 경로(' + cfg.allowedPaths.join(', ') + ') 중 하나여야 한다 — 쿼리·해시·임의 페이지로 이동할 수 없다');
    }
    if (name === 'seedLocalStorage') {
      if (sawGoto) errors.push(at + 'seedLocalStorage 는 첫 goto 앞에만 둘 수 있다');
      if (typeof st.fixture !== 'string' || !/^[a-z0-9][a-z0-9-]{1,40}$/.test(st.fixture)) errors.push(at + 'fixture 는 금고(court/fixtures)의 이름이어야 한다 — 값을 직접 적어 넣을 수 없다');
      else if (!fs.existsSync(path.join(cfg.fixturesDir, st.fixture + '.json'))) errors.push(at + '금고에 없는 fixture: ' + st.fixture);
    }
    if (name === 'type' && typeof st.text !== 'string') errors.push(at + 'text 누락');
    if (name === 'type' && st.clear !== undefined && typeof st.clear !== 'boolean') errors.push(at + 'clear 는 true/false');
    if ((name === 'select' || name === 'fill') && typeof st.value !== 'string') errors.push(at + 'value(문자열) 누락');
    if (name === 'check' && typeof st.on !== 'boolean') errors.push(at + 'on 은 true/false');
    if (name === 'click' && st.position !== undefined && !POSITIONS[st.position]) errors.push(at + 'position 은 ' + Object.keys(POSITIONS).join('·') + ' 중 하나');
    if (name === 'key' && !KEYS[st.key]) errors.push(at + 'key 는 ' + Object.keys(KEYS).join('·') + ' 중 하나');
    if (name === 'wait' && !(Number.isFinite(st.ms) && st.ms >= 0 && st.ms <= MAX_WAIT_MS)) errors.push(at + 'wait.ms 는 0~' + MAX_WAIT_MS);
    if (name === 'setViewport' && !(Number.isInteger(st.width) && Number.isInteger(st.height) && st.width >= 240 && st.height >= 320)) errors.push(at + 'setViewport 의 width·height 는 정수');
    if (name === 'setOffline' && typeof st.offline !== 'boolean') errors.push(at + 'offline 은 true/false');
    if (name === 'neverVisible' && st.text !== undefined && typeof st.text !== 'string') errors.push(at + 'neverVisible.text 는 문자열');
    if (name === 'neverVisible' && st.forMs !== undefined && !(Number.isFinite(st.forMs) && st.forMs >= 300 && st.forMs <= 6000)) errors.push(at + 'neverVisible.forMs 는 300~6000');
    if (['textContains', 'textEquals', 'urlContains'].includes(name) && typeof st.text !== 'string') errors.push(at + 'text 누락');
    if (name === 'count' && ![st.equals, st.min, st.max].some(Number.isInteger)) errors.push(at + 'count 는 equals·min·max 중 하나가 정수');
    if (name === 'attr' && (typeof st.name !== 'string' || typeof st.equals !== 'string')) errors.push(at + 'attr 는 name·equals 문자열');
    if (['hasClass', 'notHasClass'].includes(name) && typeof st.className !== 'string') errors.push(at + 'className 누락');
    if (name === 'style' && (typeof st.prop !== 'string' || typeof st.equals !== 'string')) errors.push(at + 'style 은 prop·equals 문자열');
    if (name === 'rect' && ![st.minWidth, st.minHeight].some(Number.isFinite)) errors.push(at + 'rect 는 minWidth·minHeight 중 하나');
    if (st.timeoutMs !== undefined && !(Number.isFinite(st.timeoutMs) && st.timeoutMs >= 0 && st.timeoutMs <= MAX_EXPECT_TIMEOUT)) errors.push(at + 'timeoutMs 는 0~' + MAX_EXPECT_TIMEOUT);
    if (kind === 'do' && ACTION_KINDS.includes(name)) { actions++; lastActionIdx = i; strongExpectAfterAction = false; }
    if (kind === 'expect' && !WEAK_EXPECTS.includes(name)) { strongExpects++; if (lastActionIdx >= 0) strongExpectAfterAction = true; }
  });
  if (!sawGoto) errors.push('goto 가 없다');
  if (actions === 0) weaknesses.push('W3 사용자 행동(click·type·key·back)이 하나도 없다');
  if (strongExpects === 0) weaknesses.push('W2 화면 상태를 확인하는 expect 가 없다(noExceptions·stillInApp·exists·neverVisible 만으로는 동작 확인이 아니다)');
  else if (actions > 0 && !strongExpectAfterAction) weaknesses.push('W1 마지막 행동 뒤에 화면 상태를 확인하는 expect 가 없다');
  return { errors, weaknesses };
}

function isHollow(weaknesses) { return weaknesses.some(w => /^W[123] /.test(w)); }

// 같은 확인을 제목만 바꿔 여러 개로 쪼개는 부풀리기를 막기 위한 정규화 해시(id·title·capture 이름 제외).
function scenarioFingerprint(s) {
  const steps = (s.steps || []).filter(st => stepKind(st) !== 'capture').map(st => { const o = {}; for (const k of Object.keys(st).sort()) if (k !== 'timeoutMs' && k !== 'settleMs') o[k] = st[k]; return o; });
  return crypto.createHash('sha256').update(JSON.stringify({ viewport: s.viewport || null, steps })).digest('hex').slice(0, 16);
}

// 페이지 안에서 도는 조회 전용 헬퍼. 선택자·문자열은 JSON.stringify 로만 끼워 넣는다.
const H = '(function(){function qa(s){try{return Array.prototype.slice.call(document.querySelectorAll(s));}catch(e){return [];}}' +
  'function vis(el){if(!el)return false;var rs=el.getClientRects();if(!rs.length)return false;var cs=getComputedStyle(el);' +
  'if(cs.display==="none"||cs.visibility==="hidden"||cs.visibility==="collapse"||parseFloat(cs.opacity)<0.01)return false;' +
  'var b=el.getBoundingClientRect();return b.width>0&&b.height>0;}' +
  'function txt(el){return (el.innerText||el.textContent||"").replace(/\\s+/g," ").trim();}' +
  'return {qa:qa,vis:vis,txt:txt};})()';
const J = v => JSON.stringify(v);

function expectExpr(st) {
  const s = J(st.selector || '');
  switch (st.expect) {
    case 'visible': return `(function(){var h=${H};var n=h.qa(${s}).filter(h.vis).length;return {ok:n>0,detail:"보이는 요소 "+n+"개"};})()`;
    case 'notVisible': return `(function(){var h=${H};var n=h.qa(${s}).filter(h.vis).length;return {ok:n===0,detail:"보이는 요소 "+n+"개"};})()`;
    case 'exists': return `(function(){var h=${H};var n=h.qa(${s}).length;return {ok:n>0,detail:"요소 "+n+"개"};})()`;
    case 'notExists': return `(function(){var h=${H};var n=h.qa(${s}).length;return {ok:n===0,detail:"요소 "+n+"개"};})()`;
    case 'textContains': return `(function(){var h=${H};var els=h.qa(${s}).filter(h.vis);var t=els.map(h.txt);return {ok:t.some(function(x){return x.indexOf(${J(st.text)})>=0;}),detail:"보이는 글자: "+JSON.stringify(t.map(function(x){return x.slice(0,80);}).slice(0,3))};})()`;
    case 'textEquals': return `(function(){var h=${H};var els=h.qa(${s}).filter(h.vis);var t=els.map(h.txt);return {ok:t.some(function(x){return x===${J(st.text)};}),detail:"보이는 글자: "+JSON.stringify(t.map(function(x){return x.slice(0,80);}).slice(0,3))};})()`;
    case 'count': return `(function(){var h=${H};var n=h.qa(${s}).filter(h.vis).length;var ok=true;` +
      (Number.isInteger(st.equals) ? `ok=ok&&n===${st.equals};` : '') + (Number.isInteger(st.min) ? `ok=ok&&n>=${st.min};` : '') + (Number.isInteger(st.max) ? `ok=ok&&n<=${st.max};` : '') +
      `return {ok:ok,detail:"보이는 요소 "+n+"개"};})()`;
    case 'attr': return `(function(){var h=${H};var el=h.qa(${s})[0];var v=el?el.getAttribute(${J(st.name)}):null;return {ok:v===${J(st.equals)},detail:${J(st.name)}+"="+JSON.stringify(v)};})()`;
    case 'hasClass': return `(function(){var h=${H};var el=h.qa(${s})[0];var ok=!!el&&el.classList.contains(${J(st.className)});return {ok:ok,detail:el?"class="+JSON.stringify(String(el.getAttribute("class")||"")):"요소 없음"};})()`;
    case 'notHasClass': return `(function(){var h=${H};var el=h.qa(${s})[0];var ok=!!el&&!el.classList.contains(${J(st.className)});return {ok:ok,detail:el?"class="+JSON.stringify(String(el.getAttribute("class")||"")):"요소 없음"};})()`;
    case 'style': return `(function(){var h=${H};var el=h.qa(${s}).filter(h.vis)[0]||h.qa(${s})[0];var v=el?getComputedStyle(el).getPropertyValue(${J(st.prop)}).trim():null;return {ok:v===${J(st.equals)},detail:${J(st.prop)}+"="+JSON.stringify(v)};})()`;
    case 'rect': return `(function(){var h=${H};var els=h.qa(${s}).filter(h.vis);if(!els.length)return {ok:false,detail:"보이는 요소 없음"};var worst=null;var ok=els.every(function(el){var b=el.getBoundingClientRect();var good=` +
      `${Number.isFinite(st.minWidth) ? 'b.width>=' + st.minWidth : 'true'}&&${Number.isFinite(st.minHeight) ? 'b.height>=' + st.minHeight : 'true'};if(!good&&!worst)worst=Math.round(b.width)+"x"+Math.round(b.height);return good;});` +
      `var f=els[0].getBoundingClientRect();return {ok:ok,detail:ok?("첫 요소 "+Math.round(f.width)+"x"+Math.round(f.height)+"px, 대상 "+els.length+"개"):("미달 요소 "+worst+"px")};})()`;
    case 'noHorizontalOverflow': return '(function(){var d=document.documentElement;var sw=Math.max(d.scrollWidth,document.body?document.body.scrollWidth:0);return {ok:sw<=d.clientWidth+1,detail:"scrollWidth="+sw+" clientWidth="+d.clientWidth};})()';
    case 'urlContains': return `(function(){return {ok:location.href.indexOf(${J(st.text)})>=0,detail:location.pathname+location.hash};})()`;
    default: return null;
  }
}

async function runScenario(opts) {
  const { scenario, siteUrl, outDir, siteRev, chromePath } = opts;
  const cfg = opts.config || loadConfig();
  const { errors, weaknesses } = validateScenario(scenario, cfg);
  const result = {
    id: scenario && scenario.id, title: scenario && scenario.title, fingerprint: scenario && scenario.steps ? scenarioFingerprint(scenario) : null,
    siteRev: siteRev || null, passed: false, invalid: errors.length > 0, errors, weaknesses, hollow: isHollow(weaknesses),
    failedStep: null, failKind: null, // failKind: 'expect'(확인이 거짓) | 'action'(행동·이동·대기 단계가 안 됨) | 'tool'(도구 오류)
    steps: [], bootExceptions: [], exceptions: [], consoleErrors: [], dialogs: [], captures: [], fixtures: [],
    nonVacuousExpects: 0, vacuousExpects: 0,
    viewport: null, chromeVersion: null, startedAt: new Date().toISOString(), finishedAt: null, toolError: null,
  };
  if (result.invalid) { result.failKind = 'tool'; result.finishedAt = new Date().toISOString(); return result; }
  if (outDir) fs.mkdirSync(outDir, { recursive: true });
  const vp = { width: (scenario.viewport && scenario.viewport.width) || 375, height: (scenario.viewport && scenario.viewport.height) || 812 };
  result.viewport = vp;
  let browser = null;
  const deadline = Date.now() + SCENARIO_TIMEOUT_MS;
  let firstActionSeen = false;
  try {
    browser = await launch({ viewport: vp, allowHosts: cfg.allowHosts, chromePath, siteOrigin: siteUrl, locale: cfg.locale });
    result.chromeVersion = browser.version;
    const page = browser.page;
    // 기준·작업 커밋은 포트만 다른 주소로 뜬다. 오류의 스크립트 경로를 비교하려면 주소 부분을 떼어 낸다.
    const relUrl = u => { const s = String(u || ''); return s.startsWith(siteUrl) ? s.slice(siteUrl.length) : s.replace(/^https?:\/\/[^/]+/, ''); };
    const ev = async expr => {
      const r = await page.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: false });
      if (r.exceptionDetails) throw new Error('조회식 오류: ' + (r.exceptionDetails.text || ''));
      return r.result ? r.result.value : undefined;
    };
    page.on('Runtime.exceptionThrown', p => {
      const d = p.exceptionDetails || {};
      const text = d.exception && d.exception.description ? d.exception.description.split('\n')[0] : (d.text || 'exception');
      const rec = { text, url: relUrl(d.url), line: (d.lineNumber || 0) + 1 };
      (firstActionSeen ? result.exceptions : result.bootExceptions).push(rec);
    });
    page.on('Log.entryAdded', p => { const e = p.entry || {}; if (e.level === 'error') result.consoleErrors.push({ text: String(e.text || '').slice(0, 300), url: relUrl(e.url) }); });
    page.on('Page.javascriptDialogOpening', p => { result.dialogs.push({ type: p.type, message: String(p.message || '').slice(0, 200) }); page.send('Page.handleJavaScriptDialog', { accept: true }).catch(() => {}); });
    await page.send('Page.enable'); await page.send('Runtime.enable'); await page.send('Log.enable'); await page.send('Network.enable');
    await page.send('Network.setBypassServiceWorker', { bypass: true });
    await page.send('Emulation.setDeviceMetricsOverride', { width: vp.width, height: vp.height, deviceScaleFactor: 2, mobile: true });
    // 로컬(Windows·KST)과 CI(ubuntu·UTC)에서 "오늘"과 글자 표기가 갈리지 않게 시간대·언어를 고정한다.
    try { await page.send('Emulation.setTimezoneOverride', { timezoneId: cfg.timezone || 'Asia/Seoul' }); } catch (_) { /* 구형 Chrome */ }
    try { await page.send('Emulation.setLocaleOverride', { locale: cfg.locale || 'ko-KR' }); } catch (_) { /* 구형 Chrome */ }
    // 외부 통신은 전부 막되, 앱이 CDN 에서 받는 라이브러리는 금고의 고정 사본으로 대신 응답한다(없으면 앱의 저장 경로가 죽어 실서비스와 갈라진다).
    const stubs = (cfg.stubs || []).map(st => {
      const body = fs.readFileSync(path.resolve(path.dirname(DEFAULT_CONFIG_FILE), st.file));
      if (st.sha256 && st.sha256 !== crypto.createHash('sha256').update(body).digest('hex')) throw new Error('금고 사본의 해시가 설정과 다르다: ' + st.file);
      const re = new RegExp('^' + st.urlPattern.split('*').map(part => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$');
      return { file: st.file, urlPattern: st.urlPattern, re, contentType: st.contentType || 'application/javascript', body: body.toString('base64') };
    });
    if (stubs.length) {
      page.on('Fetch.requestPaused', p => {
        const st = stubs.find(x => x.re.test(p.request.url));
        if (st) page.send('Fetch.fulfillRequest', { requestId: p.requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: st.contentType }, { name: 'Access-Control-Allow-Origin', value: '*' }], body: st.body }).catch(() => {});
        else page.send('Fetch.continueRequest', { requestId: p.requestId }).catch(() => {});
      });
      await page.send('Fetch.enable', { patterns: stubs.map(x => ({ urlPattern: x.urlPattern })) });
      result.stubs = stubs.map(x => x.file);
    }

    // 의미 구분(허위 통과 방지):
    //  - notVisible·notExists·notHasClass = "곧 사라진다"(사라질 때까지 기다림). 닫힘 확인용.
    //  - neverVisible = "나타나면 안 된다"(관찰 시간 내내 한 번이라도 보이면 실패). 뜨면 안 되는 안내·오류 확인용.
    const holdNever = async st => {
      const forMs = st.forMs === undefined ? 1800 : st.forMs;
      const end = Math.min(Date.now() + forMs, deadline);
      let checks = 0;
      do {
        const r = await ev(expectExpr(typeof st.text === 'string' ? { expect: 'textContains', selector: st.selector, text: st.text } : { expect: 'visible', selector: st.selector }));
        checks++;
        if (r && r.ok) return { ok: false, detail: '관찰 ' + forMs + 'ms 중 나타남(' + r.detail + ', ' + checks + '번째 확인)' };
        await sleep(100);
      } while (Date.now() < end);
      return { ok: true, detail: forMs + 'ms 동안 ' + checks + '회 확인, 한 번도 안 보임' };
    };
    const evalOnce = async st => {
      if (st.expect === 'noExceptions') return { ok: result.exceptions.length === 0, detail: '행동 이후 미처리 예외 ' + result.exceptions.length + '건' + (result.exceptions[0] ? ': ' + result.exceptions[0].text : '') };
      if (st.expect === 'stillInApp') { const href = await ev('location.href'); return { ok: typeof href === 'string' && href.startsWith(siteUrl), detail: String(href).replace(siteUrl, '') }; }
      return ev(expectExpr(st));
    };
    const pollExpect = async st => {
      if (st.expect === 'neverVisible') return holdNever(st);
      const timeout = st.timeoutMs === undefined ? DEFAULT_EXPECT_TIMEOUT : st.timeoutMs;
      const end = Math.min(Date.now() + timeout, deadline);
      let last = { ok: false, detail: '' };
      do {
        last = await evalOnce(st);
        if (last && last.ok) return last;
        if (st.expect === 'noExceptions') return last;
        await sleep(120);
      } while (Date.now() < end);
      return last || { ok: false, detail: '조회 실패' };
    };
    // 행동 직전에, 그 행동 뒤에 올 확인들을 한 번씩 미리 본다. 이미 참이면 그 행동이 만든 결과가 아니다(공허 확인).
    const preTrue = new Map();
    const precheckFollowing = async i => {
      for (let j = i + 1; j < scenario.steps.length; j++) {
        const nx = scenario.steps[j], k = stepKind(nx);
        if (k === 'do' && ACTION_KINDS.includes(nx.do)) break;
        if (k === 'expect' && !WEAK_EXPECTS.includes(nx.expect)) {
          let r = null; try { r = await evalOnce(nx); } catch (_) { r = null; }
          preTrue.set(j, !!(r && r.ok));
        }
      }
    };
    let lastActionDetail = null, passedSinceAction = [];

    for (let i = 0; i < scenario.steps.length; i++) {
      const st = scenario.steps[i];
      const kind = stepKind(st);
      const rec = { i: i + 1, kind, name: st[kind], ok: false, detail: '' };
      result.steps.push(rec);
      const fail = (failKind, detail) => { rec.detail = detail; result.failedStep = i + 1; result.failKind = failKind; };
      if (Date.now() > deadline) { fail('tool', '시나리오 제한 시간 초과'); break; }
      if (kind === 'capture') {
        const shot = await page.send('Page.captureScreenshot', { format: 'png' });
        const buf = Buffer.from(shot.data, 'base64');
        const file = scenario.id + '--' + st.capture + '.png';
        if (outDir) fs.writeFileSync(path.join(outDir, file), buf);
        const sha256 = crypto.createHash('sha256').update(buf).digest('hex');
        const caption = '한 행동: ' + (lastActionDetail || '없음(첫 화면)') + ' / 확인한 것: ' + (passedSinceAction.length ? passedSinceAction.join(' · ') : '확인한 것 없음');
        result.captures.push({ name: st.capture, file, sha256, bytes: buf.length, afterStep: i + 1, at: new Date().toISOString(), caption });
        rec.ok = true; rec.detail = file + ' sha256=' + sha256.slice(0, 16);
        continue;
      }
      if (kind === 'expect') {
        const r = await pollExpect(st);
        rec.ok = !!(r && r.ok); rec.detail = (st.selector ? st.selector + ' → ' : '') + ((r && r.detail) || '');
        if (!WEAK_EXPECTS.includes(st.expect)) {
          rec.vacuous = !firstActionSeen || preTrue.get(i) === true; // 행동 전 확인(전제조건)이거나, 행동 전에도 이미 참이던 확인
          if (rec.ok) { if (rec.vacuous) result.vacuousExpects++; else result.nonVacuousExpects++; }
        }
        if (!rec.ok) { result.failedStep = i + 1; result.failKind = 'expect'; break; }
        passedSinceAction.push(st.expect + (st.selector ? '(' + st.selector + ')' : '') + (rec.vacuous ? '[행동 전에도 참]' : ''));
        continue;
      }
      // do
      if (ACTION_KINDS.includes(st.do)) { await precheckFollowing(i); firstActionSeen = true; passedSinceAction = []; }
      if (st.do === 'seedLocalStorage') {
        const entries = JSON.parse(fs.readFileSync(path.join(cfg.fixturesDir, st.fixture + '.json'), 'utf8')).localStorage || {};
        const src = '(function(){try{var d=' + J(entries) + ';for(var k in d){if(localStorage.getItem(k)===null){localStorage.setItem(k,typeof d[k]==="string"?d[k]:JSON.stringify(d[k]));}}}catch(e){}})()';
        await page.send('Page.addScriptToEvaluateOnNewDocument', { source: src });
        result.fixtures.push(st.fixture);
        rec.ok = true; rec.detail = '금고 fixture: ' + st.fixture;
      } else if (st.do === 'goto') {
        const loaded = new Promise(res => { let done = false; page.on('Page.loadEventFired', () => { if (!done) { done = true; res(true); } }); setTimeout(() => { if (!done) { done = true; res(false); } }, 20000); });
        const nav = await page.send('Page.navigate', { url: siteUrl + st.path });
        if (nav.errorText) { fail('action', '이동 실패: ' + nav.errorText); break; }
        const ok = await loaded;
        await sleep(Number.isFinite(st.settleMs) ? Math.min(st.settleMs, 8000) : 1200);
        rec.ok = ok; rec.detail = st.path + (ok ? '' : ' (load 이벤트 20초 내 미발생)');
        if (!ok) { result.failedStep = i + 1; result.failKind = 'action'; break; }
      } else if (st.do === 'waitFor') {
        const r = await pollExpect({ expect: 'visible', selector: st.selector, timeoutMs: st.timeoutMs === undefined ? 15000 : st.timeoutMs });
        rec.ok = !!r.ok; rec.detail = st.selector + ' → ' + r.detail;
        if (!rec.ok) { result.failedStep = i + 1; result.failKind = 'action'; break; }
      } else if (st.do === 'select' || st.do === 'fill') {
        // 선택 상자·날짜·시간·슬라이더는 마우스 좌표로 값을 고를 수 없다. 법정이 정해 둔 방식(값 지정 + input·change 알림)으로만 넣는다. 작업자가 코드를 끼워 넣을 자리는 없다.
        const s = J(st.selector);
        const r = await ev(`(function(){var h=${H};var els=h.qa(${s}).filter(h.vis);if(els.length!==1)return {ok:false,why:els.length===0?"보이는 대상 없음":("모호한 선택자: 보이는 요소 "+els.length+"개")};var el=els[0];` +
          `if(el.disabled)return {ok:false,why:"비활성(disabled) 상태"};var tag=el.tagName.toLowerCase();` +
          (st.do === 'select'
            ? `if(tag!=="select")return {ok:false,why:"select 요소가 아니다("+tag+")"};var has=Array.prototype.some.call(el.options,function(o){return o.value===${J(st.value)};});if(!has)return {ok:false,why:"그 값의 선택지가 없다"};el.value=${J(st.value)};`
            : `if(tag!=="input"||["date","time","datetime-local","month","week","range","number","color"].indexOf(el.type)<0)return {ok:false,why:"fill 은 날짜·시간·슬라이더·숫자·색상 입력에만 쓴다("+tag+"/"+el.type+")"};var set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set;set.call(el,${J(st.value)});if(el.value!==${J(st.value)}&&el.type!=="range"&&el.type!=="number")return {ok:false,why:"값이 받아들여지지 않았다(형식 확인): "+el.value};`) +
          `el.dispatchEvent(new Event("input",{bubbles:true}));el.dispatchEvent(new Event("change",{bubbles:true}));return {ok:true,who:tag+(el.id?"#"+el.id:""),now:el.value};})()`);
        if (!r || !r.ok) { fail('action', st.selector + ' → ' + ((r && r.why) || '실패')); break; }
        await sleep(250);
        rec.ok = true; rec.detail = (st.do === 'select' ? '선택 ' : '값 입력 ') + r.who + ' = "' + r.now + '"'; lastActionDetail = rec.detail;
      } else if (st.do === 'click' || st.do === 'type' || st.do === 'check') {
        const s = J(st.selector);
        if (st.do === 'check') {
          const cur = await ev(`(function(){var h=${H};var els=h.qa(${s}).filter(h.vis);return els.length===1?{ok:true,checked:!!els[0].checked}:{ok:false,n:els.length};})()`);
          if (cur && cur.ok && cur.checked === st.on) { rec.ok = true; rec.detail = '이미 ' + (st.on ? '체크됨' : '해제됨') + ' — 누르지 않음'; continue; }
        }
        const pre = await ev(`(function(){var h=${H};var all=h.qa(${s});var els=all.filter(h.vis);if(els.length!==1)return {ok:false,why:els.length===0?("보이는 대상 없음(일치 "+all.length+"개)"):("모호한 선택자: 보이는 요소 "+els.length+"개에 걸린다 — 정확히 1개여야 한다")};els[0].scrollIntoView({block:"center",inline:"center",behavior:"instant"});return {ok:true};})()`);
        if (!pre || !pre.ok) { fail('action', st.selector + ' → ' + ((pre && pre.why) || '대상 없음')); break; }
        await sleep(80);
        const pos = POSITIONS[st.position] || POSITIONS.center;
        // 화면 전환 애니메이션 중에는 사람도 누를 수 없다. 누를 수 있게 될 때까지 잠깐(최대 2.5초) 기다렸다가, 그래도 가려져 있으면 실패로 본다.
        const hitExpr = `(function(){var h=${H};var el=h.qa(${s}).filter(h.vis)[0];if(!el)return {ok:false,why:"스크롤 뒤 대상 사라짐"};var b=el.getBoundingClientRect();var x=b.left+b.width*${pos[0]},y=b.top+b.height*${pos[1]};` +
          `var top=document.elementFromPoint(x,y);var okHit=!!top&&(top===el||el.contains(top));var dis=!!el.disabled||el.getAttribute("aria-disabled")==="true";` +
          `return {ok:okHit&&!dis,x:x,y:y,why:dis?"비활성(disabled) 상태":(okHit?"":"그 자리를 다른 요소가 덮고 있다: "+(top?(top.tagName.toLowerCase()+(top.id?"#"+top.id:"")):"없음")),` +
          `who:el.tagName.toLowerCase()+(el.id?"#"+el.id:"")+" \\""+h.txt(el).slice(0,30)+"\\"",size:Math.round(b.width)+"x"+Math.round(b.height)};})()`;
        let hit = null;
        for (const until = Date.now() + 2500; ;) { hit = await ev(hitExpr); if ((hit && hit.ok) || Date.now() > until) break; await sleep(150); }
        if (!hit || !hit.ok) { fail('action', st.selector + ' → 누를 수 없음: ' + ((hit && hit.why) || '')); break; }
        await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: hit.x, y: hit.y });
        await page.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: hit.x, y: hit.y, button: 'left', clickCount: 1 });
        await page.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: hit.x, y: hit.y, button: 'left', clickCount: 1 });
        if (st.do === 'type') {
          await sleep(60);
          // clear: 이미 있던 글자를 전부 선택한 뒤 입력한다(목표 제목 고쳐 쓰기 같은 실제 사용 경로).
          if (st.clear) await ev(`(function(){var h=${H};var el=h.qa(${s}).filter(h.vis)[0];if(el&&el.select)el.select();})()`);
          await page.send('Input.insertText', { text: st.text });
        }
        await sleep(250);
        rec.ok = true;
        rec.detail = (st.do === 'type' ? '입력 ' : (st.do === 'check' ? (st.on ? '체크 ' : '체크 해제 ') : '클릭 ')) + hit.who + ' ' + hit.size + 'px' + (st.position && st.position !== 'center' ? ' [' + st.position + ']' : '');
        lastActionDetail = rec.detail;
      } else if (st.do === 'key') {
        const k = KEYS[st.key];
        await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: k.key, code: k.code, windowsVirtualKeyCode: k.keyCode });
        await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: k.key, code: k.code, windowsVirtualKeyCode: k.keyCode });
        await sleep(200); rec.ok = true; rec.detail = st.key + ' 키'; lastActionDetail = rec.detail;
      } else if (st.do === 'back') {
        // 브라우저·PWA·안드로이드 뒤로가기와 같은 경로(세션 히스토리 한 칸 뒤로). 앱 함수를 부르지 않는다.
        const hist = await page.send('Page.getNavigationHistory');
        if (hist.currentIndex > 0) await page.send('Page.navigateToHistoryEntry', { entryId: hist.entries[hist.currentIndex - 1].id });
        await sleep(700);
        rec.ok = true; rec.detail = '뒤로가기(히스토리 ' + hist.currentIndex + ' → ' + Math.max(hist.currentIndex - 1, 0) + (hist.currentIndex > 0 ? ')' : ', 더 뒤로 갈 곳 없음)');
        lastActionDetail = rec.detail;
      } else if (st.do === 'setViewport') {
        await page.send('Emulation.setDeviceMetricsOverride', { width: st.width, height: st.height, deviceScaleFactor: 2, mobile: true });
        await sleep(300); rec.ok = true; rec.detail = st.width + 'x' + st.height;
      } else if (st.do === 'setOffline') {
        await page.send('Network.emulateNetworkConditions', { offline: st.offline, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
        rec.ok = true; rec.detail = st.offline ? '오프라인' : '온라인';
      } else if (st.do === 'wait') { await sleep(st.ms); rec.ok = true; rec.detail = st.ms + 'ms'; }
    }
    result.passed = result.failedStep === null && result.steps.length === scenario.steps.length && result.steps.every(s => s.ok);
  } catch (e) {
    result.toolError = String((e && e.message) || e);
    result.failKind = 'tool';
    result.passed = false;
  } finally {
    if (browser) { try { await browser.close(); } catch (_) { /* 종료 실패는 판정에 영향 없음 */ } }
    result.finishedAt = new Date().toISOString();
  }
  // 실행 결과로 본 공허 판정: 통과했더라도 "행동이 만든 변화"를 확인한 단언이 하나도 없으면 증거가 아니다.
  result.provesBehavior = result.passed && !result.hollow && result.nonVacuousExpects > 0;
  return result;
}

module.exports = { validateScenario, isHollow, runScenario, scenarioFingerprint, loadConfig, stepKind, DO_KINDS, EXPECT_KINDS, ACTION_KINDS, WEAK_EXPECTS };
