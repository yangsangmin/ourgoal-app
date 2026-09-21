'use strict';
// 법정(court) — 기준 시험지 실행 감시(자식 프로세스에 --require 로 먼저 들어간다).
// 기준 시험지는 작업 커밋의 제품 코드를 같은 프로세스 안에서 돌린다. 그래서 화면에 찍힌 글자만 믿으면 "누가 찍었는지"를 알 수 없다.
// 이 파일은 제품 코드보다 먼저 실행되어 세 가지를 따로 적어 둔다. 채점은 이 기록으로 한다(표준출력 글자는 대조용일 뿐이다).
//  ① 시험 결과 줄(통과·실패)을 실제로 찍은 코드가 어느 파일인가  ② 프로세스를 끝낸 코드가 어느 파일인가  ③ 끝까지 가서 기록을 남겼는가
// 기록 파일의 이름과 확인값은 법정이 실행마다 새로 정해 넘기고, 이 파일이 읽자마자 환경에서 지운다.
// 의존성 없음. 나중에 실행되는 코드가 내장 함수를 바꿔 끼워도 흔들리지 않도록 필요한 함수는 시작할 때 따로 잡아 둔다.
(function () {
  const raw = process.env.COURT_TEST_PRELOAD;
  delete process.env.COURT_TEST_PRELOAD;
  if (!raw) return;
  let cfg = null;
  try { cfg = JSON.parse(raw); } catch (_) { return; }
  if (!cfg || typeof cfg.out !== 'string' || typeof cfg.nonce !== 'string') return;

  const fs = require('node:fs');
  const path = require('node:path');
  const url = require('node:url');
  const call = Function.prototype.call;
  const uncurry = fn => call.bind(fn);
  const writeFileSync = fs.writeFileSync;
  const fileURLToPath = url.fileURLToPath;
  const resolvePath = path.resolve;
  const captureStackTrace = Error.captureStackTrace;
  const jsonString = JSON.stringify; // 글자(원시값)에만 쓴다 — 객체에 쓰면 toJSON 끼워 넣기에 흔들린다
  const reExec = uncurry(RegExp.prototype.exec);
  const sIndexOf = uncurry(String.prototype.indexOf);
  const sSlice = uncurry(String.prototype.slice);
  const sTrim = uncurry(String.prototype.trim);
  const sLower = uncurry(String.prototype.toLowerCase);
  const sStartsWith = uncurry(String.prototype.startsWith);
  const bufToString = uncurry(Buffer.prototype.toString);
  const bufFrom = Buffer.from;
  const origExit = process.exit;
  const apply = Reflect.apply;
  const WIN = process.platform === 'win32';
  const SELF = __filename;

  const VM_TAG = 'court-vm\u0000'; // vm 으로 지어낸 코드에 붙이는, 시험지 경로와 절대 겹칠 수 없는 표식(널 문자 포함)
  const norm = p => { let s = ''; try { s = resolvePath(String(p)); } catch (_) { s = String(p); } return WIN ? sLower(s) : s; };
  const baseName = p => { const s = String(p); let i = s.length - 1; while (i >= 0 && s[i] !== '/' && s[i] !== '\\') i--; return sSlice(s, i + 1); };
  const sheets = Object.create(null);
  for (let i = 0; i < (cfg.sheets || []).length; i++) sheets[norm(cfg.sheets[i])] = true;
  const selfKey = norm(SELF);
  const cwdKey = norm(process.cwd());
  let passRe = null, failRe = null;
  try { passRe = new RegExp(cfg.pass); failRe = new RegExp(cfg.fail); } catch (_) { passRe = null; failRe = null; }

  // 호출 위치 정보(CallSite)의 조회 함수도 시작할 때 잡아 둔다.
  let siteFile = null, siteNative = null, siteEvalOrigin = null;
  (function () {
    const prev = Error.prepareStackTrace;
    try {
      Error.prepareStackTrace = (_, s) => s;
      const h = {}; captureStackTrace(h);
      const proto = h.stack && h.stack[0] ? Object.getPrototypeOf(h.stack[0]) : null;
      if (proto) { siteFile = uncurry(proto.getFileName); siteNative = uncurry(proto.isNative); siteEvalOrigin = uncurry(proto.getEvalOrigin); }
    } catch (_) { siteFile = null; }
    finally { Error.prepareStackTrace = prev; }
  })();

  // 지금 이 호출을 "실제로 한" 파일. 돌려주는 값: { sheet: 시험지가 직접 했는가, who: 시험지가 아니면 그 파일(저장소 기준 경로) }
  // 법정 내부·Node 내부를 건너뛴 첫 호출자를 본다. 알아낼 수 없으면 시험지가 한 것으로 치지 않는다.
  function author(skipFn) {
    const prevPrep = Error.prepareStackTrace, prevLimit = Error.stackTraceLimit;
    let sites = null;
    try {
      Error.stackTraceLimit = 80;
      Error.prepareStackTrace = (_, s) => s;
      const h = {}; captureStackTrace(h, skipFn);
      sites = h.stack;
    } catch (_) { sites = null; }
    try { Error.prepareStackTrace = prevPrep; Error.stackTraceLimit = prevLimit; } catch (_) { /* 되돌리지 못해도 기록은 남긴다 */ }
    if (!sites || !siteFile || typeof sites.length !== 'number') return { sheet: false, who: '(호출 위치를 알 수 없음)' };
    for (let i = 0; i < sites.length; i++) {
      let f = null, native = false;
      try { f = siteFile(sites[i]); native = !!siteNative(sites[i]); } catch (_) { return { sheet: false, who: '(호출 위치를 알 수 없음)' }; }
      if (native) continue;
      if (typeof f !== 'string' || !f) { let o = ''; try { o = String(siteEvalOrigin(sites[i]) || ''); } catch (_) { o = ''; } return { sheet: false, who: '(실행 중에 만든 코드' + (o ? ': ' + sSlice(o, 0, 80) : '') + ')' }; }
      if (sStartsWith(f, 'node:')) continue;
      if (sStartsWith(f, VM_TAG)) return { sheet: false, who: '(vm 으로 지어낸 코드: ' + baseName(sSlice(f, VM_TAG.length)) + ')' };
      if (sStartsWith(f, 'file:')) { try { f = fileURLToPath(f); } catch (_) { /* 그대로 둔다 */ } }
      const key = norm(f);
      if (key === selfKey) continue;
      if (sheets[key]) return { sheet: true, who: null };
      const rel = sStartsWith(key, cwdKey) ? sSlice(key, cwdKey.length + 1) : key;
      let shown = '';
      for (let j = 0; j < rel.length; j++) shown += rel[j] === '\\' ? '/' : rel[j];
      return { sheet: false, who: shown };
    }
    return { sheet: false, who: '(호출자 없음)' };
  }

  const lines = []; // { k: 'p'|'f', t: 제목, who: 시험지가 아니면 찍은 파일 }
  const exits = []; // { code, who }
  const pending = { 1: { text: '', who: null }, 2: { text: '', who: null } };

  function takeLine(text, who) {
    if (!passRe || !failRe) return;
    let m = reExec(failRe, text), k = 'f';
    if (!m) { m = reExec(passRe, text); k = 'p'; }
    if (!m || typeof m[1] !== 'string') return;
    lines[lines.length] = { k, t: sTrim(m[1]), who };
  }

  function feed(fd, chunk, skipFn) {
    let text = '';
    try { text = typeof chunk === 'string' ? chunk : bufToString(bufFrom(chunk), 'utf8'); } catch (_) { return; }
    if (!text) return;
    const a = author(skipFn);
    const st = pending[fd];
    if (!a.sheet && !st.who) st.who = a.who; // 한 줄을 여러 번에 나눠 찍었을 때, 한 조각이라도 시험지 밖에서 나왔으면 그 줄은 시험지가 찍은 것이 아니다
    let buf = st.text + text, from = 0;
    for (;;) {
      const nl = sIndexOf(buf, '\n', from);
      if (nl < 0) break;
      let line = sSlice(buf, from, nl);
      if (line.length && line[line.length - 1] === '\r') line = sSlice(line, 0, line.length - 1);
      takeLine(line, st.who);
      st.who = a.sheet ? null : a.who;
      from = nl + 1;
    }
    st.text = sSlice(buf, from);
    if (!st.text) st.who = null;
  }

  function tap(stream, fd) {
    if (!stream || typeof stream.write !== 'function') return;
    const orig = stream.write;
    const courtWrite = function (chunk) { try { feed(fd, chunk, courtWrite); } catch (_) { /* 감시 실패가 시험 실행을 막지는 않는다 */ } return apply(orig, this, arguments); };
    stream.write = courtWrite;
  }
  tap(process.stdout, 1);
  tap(process.stderr, 2);

  const courtExit = function (code) {
    try { const a = author(courtExit); exits[exits.length] = { code: code === undefined ? null : Number(code), who: a.sheet ? null : a.who }; } catch (_) { exits[exits.length] = { code: null, who: '(호출 위치를 알 수 없음)' }; }
    return apply(origExit, process, arguments);
  };
  process.exit = courtExit;

  // 스택의 파일 이름은 vm 으로 지어낼 수 있다: 제품 코드가 vm.runInThisContext(코드, {filename: '.../smoke-test.js'}) 로
  // 시험지 행세를 하는 프레임을 만들어 결과 줄·종료를 시험지가 한 것처럼 보이게 할 수 있다(검수 v4).
  // 그래서 vm 이 만드는 코드에는 시험지와 겹칠 수 없는 이름을 강제로 붙인다. filename 은 스택 표시일 뿐 동작에 쓰이지 않으므로 정상 시험지에는 영향이 없다.
  (function () {
    let vm = null; try { vm = require('node:vm'); } catch (_) { return; }
    const brand = opts => { const o = (opts && typeof opts === 'object') ? opts : {}; const f = typeof o.filename === 'string' ? o.filename : 'anonymous'; return Object.assign({}, o, { filename: sStartsWith(f, VM_TAG) ? f : VM_TAG + f }); };
    const wrapLast = (obj, name) => { const orig = obj[name]; if (typeof orig !== 'function') return; obj[name] = function () { const a = arguments; if (a.length >= 2) { const n = a.length; const args = []; for (let i = 0; i < n; i++) args[i] = a[i]; args[n - 1] = brand(args[n - 1]); return apply(orig, this, args); } return apply(orig, this, a); }; };
    wrapLast(vm, 'runInThisContext');
    wrapLast(vm, 'runInContext');
    wrapLast(vm, 'runInNewContext');
    wrapLast(vm, 'compileFunction');
    const OrigScript = vm.Script;
    if (typeof OrigScript === 'function') {
      function CourtScript(code, options) { return Reflect.construct(OrigScript, [code, brand(options)], new.target || CourtScript); }
      CourtScript.prototype = OrigScript.prototype;
      try { Object.setPrototypeOf(CourtScript, OrigScript); } catch (_) { /* 정적 멤버 상속 실패는 무시 */ }
      try { vm.Script = CourtScript; } catch (_) { /* 교체 실패는 무시 */ }
    }
  })();

  let written = false;
  process.on('exit', function (code) {
    if (written) return; written = true;
    try {
      for (const fd of [1, 2]) if (pending[fd].text) takeLine(pending[fd].text, pending[fd].who);
      const q = v => (v === null || v === undefined ? 'null' : jsonString(String(v)));
      let L = '';
      for (let i = 0; i < lines.length; i++) L += (i ? ',' : '') + '{"k":' + q(lines[i].k) + ',"t":' + q(lines[i].t) + ',"who":' + q(lines[i].who) + '}';
      let E = '';
      for (let i = 0; i < exits.length; i++) E += (i ? ',' : '') + '{"code":' + (typeof exits[i].code === 'number' && exits[i].code === exits[i].code ? String(exits[i].code) : 'null') + ',"who":' + q(exits[i].who) + '}';
      const body = '{"nonce":' + q(cfg.nonce) + ',"finished":true,"exitCode":' + (typeof code === 'number' ? String(code) : 'null') + ',"exits":[' + E + '],"lines":[' + L + ']}';
      writeFileSync(cfg.out, body, 'utf8');
    } catch (_) { /* 기록을 못 남기면 법정은 "기록 없음"으로 본다(통과가 아니다) */ }
  });
})();
