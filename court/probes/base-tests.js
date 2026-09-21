'use strict';
// 법정(court) — 기준 시험지 채점(L2 부품만 돌려 봄).
// "기준 커밋(base)의 시험지로 작업 커밋(head)의 제품을 채점한다."
//  - 작업자가 테스트 파일을 어떻게 고쳤든 판정에는 쓰지 않는다 → 있던 기준을 고쳐서 통과시키는 길이 구조적으로 막힌다.
//  - 테스트 파일 수정 자체는 막지 않는다 → 라벨 하나 바꿔도 글자 핀이 깨지는 이 저장소에서 정상 작업이 교착에 빠지지 않는다.
//  - 기준 커밋에서 통과하던 검사가 작업 커밋에서 깨지면, 주장 파일의 retire 에 사유가 적혀 있어야 한다. 말없이 깨지면 돌려보낸다.
//  - 시험지는 제품 코드를 같은 프로세스에서 돌린다. 그래서 채점은 화면에 찍힌 글자가 아니라 감시 기록(test-preload.js)으로 한다:
//    시험지가 직접 찍은 결과 줄만 세고, 시험지가 아닌 코드가 결과 줄을 찍었거나 프로세스를 끝냈으면 위조(forgery)로 돌려준다.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');

const PRELOAD = path.join(__dirname, 'test-preload.js');
const RUN_TIMEOUT_MS = 180000;

function copyDir(src, dst) { fs.cpSync(src, dst, { recursive: true, force: true }); }

// head 제품 트리 위에 base 의 시험지만 덮어 쓴 폴더를 만든다.
function makeOverlay(headDir, baseDir, testFiles, destDir) {
  copyDir(headDir, destDir);
  for (const rel of testFiles) {
    const from = path.join(baseDir, rel), to = path.join(destDir, rel);
    if (!fs.existsSync(from)) continue;
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(from, to);
  }
  return destDir;
}

function parseTitles(output, runner) {
  const pass = new RegExp(runner.pass), fail = new RegExp(runner.fail);
  const passed = [], failed = [];
  for (const line of output.split(/\r?\n/)) {
    let m = fail.exec(line); if (m) { failed.push(m[1].trim()); continue; }
    m = pass.exec(line); if (m) passed.push(m[1].trim());
  }
  return { passed, failed };
}

function realOrSame(p) { try { return fs.realpathSync(p); } catch (_) { return p; } }

// 감시 기록을 읽는다. 확인값이 다르거나 끝까지 못 쓴 기록은 없는 것으로 본다.
function readWatch(file, nonce) {
  let j = null;
  try { j = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (_) { return null; }
  if (!j || j.nonce !== nonce || j.finished !== true || !Array.isArray(j.lines) || !Array.isArray(j.exits)) return null;
  return j;
}

// PR 의 제품 코드가 테스트 안에서 실행되므로 자식 프로세스 + 권한 제한(지정 폴더 밖 쓰기·프로세스 실행 금지)으로 돌린다.
// watch = { sheets: 시험지 파일(트리 기준 경로) 목록, resultDir: 감시 기록을 받을 폴더 }. 기록 파일 이름과 확인값은 실행마다 새로 만든다.
function runOne(treeDir, runner, nodeModules, scratchTmp, watch) {
  const script = path.join(treeDir, runner.file);
  if (!fs.existsSync(script)) return { ran: false, reason: runner.file + ' 없음' };
  const w = watch || {};
  const resultDir = w.resultDir || fs.mkdtempSync(path.join(path.dirname(scratchTmp), 'watch-'));
  const nonce = crypto.randomBytes(16).toString('hex');
  const outFile = path.join(resultDir, crypto.randomBytes(12).toString('hex') + '.json');
  const sheetFiles = [];
  for (const rel of (w.sheets && w.sheets.length ? w.sheets : [runner.file])) { const abs = path.join(treeDir, rel); sheetFiles.push(abs); const real = realOrSame(abs); if (real !== abs) sheetFiles.push(real); }
  const allowed = process.allowedNodeEnvironmentFlags;
  const perm = allowed.has('--permission') ? '--permission' : (allowed.has('--experimental-permission') ? '--experimental-permission' : null);
  const flags = [];
  if (perm) {
    flags.push(perm, '--allow-fs-read=' + treeDir, '--allow-fs-read=' + scratchTmp, '--allow-fs-write=' + scratchTmp, '--allow-fs-read=' + PRELOAD, '--allow-fs-write=' + resultDir);
    if (nodeModules) flags.push('--allow-fs-read=' + nodeModules);
  }
  flags.push('--require', PRELOAD);
  const env = { PATH: process.env.PATH || '', TMPDIR: scratchTmp, TEMP: scratchTmp, TMP: scratchTmp, TZ: 'Asia/Seoul' };
  env.COURT_TEST_PRELOAD = JSON.stringify({ out: outFile, nonce, sheets: sheetFiles, pass: runner.pass, fail: runner.fail });
  if (nodeModules) env.NODE_PATH = nodeModules;
  if (process.platform === 'win32') { env.SystemRoot = process.env.SystemRoot || ''; env.USERPROFILE = scratchTmp; }
  const r = spawnSync(process.execPath, [...flags, script], { cwd: treeDir, encoding: 'utf8', env, timeout: RUN_TIMEOUT_MS, maxBuffer: 128 * 1024 * 1024 });
  if (r.error) return { ran: false, timedOut: r.error.code === 'ETIMEDOUT', reason: String(r.error.message || r.error) };
  const printed = parseTitles((r.stdout || '') + '\n' + (r.stderr || ''), runner);
  const rec = readWatch(outFile, nonce);
  const tail = ((r.stderr || '') + (r.stdout || '')).slice(-400);
  const death = deathInfo(r.stderr, treeDir);
  if (!rec) return { ran: true, exit: r.status, isolated: !!perm, watched: false, passed: [], failed: [], printed, foreignLines: [], foreignExits: [], tail, death };
  const own = rec.lines.filter(l => !l.who);
  return {
    ran: true, exit: r.status, isolated: !!perm, watched: true,
    passed: own.filter(l => l.k === 'p').map(l => l.t), failed: own.filter(l => l.k === 'f').map(l => l.t), // 시험지가 직접 찍은 결과 줄만 채점에 쓴다
    printed, recorded: rec.lines.map(l => l.t),
    foreignLines: rec.lines.filter(l => l.who).map(l => ({ title: l.t, who: l.who })),
    foreignExits: rec.exits.filter(e => e.who).map(e => ({ code: e.code, who: e.who })),
    tail, death,
  };
}

// 시험 프로세스가 처리하지 못한 오류로 죽었을 때, 남긴 글자에서 "오류 첫 줄"과 "죽은 자리"(트리 기준 경로:줄)를 뽑는다.
// 오류 첫 줄 = 바로 다음 줄이 호출 위치("    at …")인 첫 줄. 죽은 자리 = 그 트리 안의 파일을 가리키는 첫 호출 위치.
function deathInfo(stderr, treeDir) {
  const lines = String(stderr || '').split(/\r?\n/);
  let line = null, where = null;
  for (let i = 0; i < lines.length - 1 && line === null; i++) if (lines[i].trim() && !/^\s+at /.test(lines[i]) && /^\s+at /.test(lines[i + 1])) line = lines[i].trim();
  if (line === null) { const m = lines.find(l => /^(?:Uncaught\s+)?[A-Za-z_$][\w$.]*(?:Error|Exception)\b/.test(l.trim())); line = m ? m.trim() : null; }
  const root = path.resolve(treeDir).replace(/\\/g, '/').toLowerCase() + '/';
  for (const l of lines) {
    const m = /^\s+at .*?\(?((?:[A-Za-z]:)?[^():]+):(\d+):\d+\)?\s*$/.exec(l);
    if (!m) continue;
    const file = m[1].replace(/^file:\/+/, '').replace(/\\/g, '/');
    if (file.toLowerCase().startsWith(root)) { where = file.slice(root.length) + ':' + m[2]; break; }
  }
  // 오류 문구에 든 임시 폴더 경로는 떼어 낸다(실행마다 바뀌는 글자가 판정서에 실리면 같은 판정이 다른 판정으로 읽힌다).
  if (line) {
    const parts = path.resolve(treeDir).split(/[\\/]+/).filter(Boolean).map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    line = line.replace(new RegExp((path.resolve(treeDir).startsWith('/') ? '[\\\\/]+' : '') + parts.join('[\\\\/]+') + '[\\\\/]*', 'gi'), '');
  }
  return { line: line ? line.slice(0, 200) : null, where, denied: /ERR_ACCESS_DENIED/.test(String(stderr || '')) };
}

function countBag(list) { const m = new Map(); for (const t of list) m.set(t, (m.get(t) || 0) + 1); return m; }

// 작업 커밋 실행에서만 나타난 위조 신호를 모은다. 기준 커밋 실행에도 똑같이 있던 신호는 이번 변경이 만든 것이 아니므로 세지 않는다.
function findForgery(runnerFile, onBase, onHead) {
  const out = [];
  const add = reason => out.push({ file: runnerFile, reason });
  if (!onHead.watched) { add('시험이 끝까지 가서 남겨야 하는 감시 기록이 작업 커밋 실행에서만 없다 — 시험 도중에 프로세스를 강제로 끝냈거나 기록을 막은 것으로 본다'); return out; }
  const baseExit = new Set(onBase.foreignExits.map(e => e.who));
  for (const e of onHead.foreignExits) if (!baseExit.has(e.who)) add('시험지가 아닌 코드(' + e.who + ')가 시험 프로세스를 끝냈다(종료 코드 ' + (e.code === null ? '없음' : e.code) + ') — 남은 검사가 돌지 못한다');
  const baseForeign = new Set(onBase.foreignLines.map(l => l.who + ' :: ' + l.title));
  const foreign = onHead.foreignLines.filter(l => !baseForeign.has(l.who + ' :: ' + l.title));
  if (foreign.length) add('시험지가 아닌 코드(' + [...new Set(foreign.map(l => l.who))].slice(0, 3).join(', ') + ')가 시험 결과처럼 보이는 줄 ' + foreign.length + '개를 찍었다(예: “' + foreign[0].title.slice(0, 60) + '”) — 채점에서 뺐다');
  const allBase = countBag(onBase.printed.passed.concat(onBase.printed.failed)), allHead = countBag(onHead.printed.passed.concat(onHead.printed.failed));
  const dup = [...allHead].filter(([t, n]) => allBase.has(t) && n > allBase.get(t));
  if (dup.length) add('같은 검사 제목이 기준 커밋 실행보다 더 많이 찍혔다(' + dup.length + '개, 예: “' + dup[0][0].slice(0, 60) + '” 기준 ' + allBase.get(dup[0][0]) + '회 → 작업 ' + dup[0][1] + '회)');
  const untapped = (run) => { const rec = countBag(run.recorded || []); let n = 0; for (const [t, c] of countBag(run.printed.passed.concat(run.printed.failed))) n += Math.max(0, c - (rec.get(t) || 0)); return n; };
  const uh = untapped(onHead), ub = untapped(onBase);
  if (uh > ub) add('감시를 거치지 않고 출력에 곧바로 쓰인 결과 줄이 ' + uh + '개 있다(기준 커밋 실행 ' + ub + '개)');
  return out;
}

// 깨진 검사가 "글자 핀"(코드·문서에 특정 글자가 있는지만 보는 검사)인지 "실행형"(제품 함수를 실제로 돌리는 검사)인지.
// 기본값은 실행형이다(안전한 쪽). 본문에서 부르는 것이 글자 찾기(includes·test·match·indexOf·search)와 파일 읽기·글자 다듬기뿐일 때만 글자 핀으로 본다.
// 실행형 검사의 폐기는 상민님 결심 사항이므로, 헷갈리면 결심을 받는 쪽으로 기운다.
const TEXT_FIND_CALLS = ['includes', 'test', 'match', 'matchAll', 'indexOf', 'lastIndexOf', 'search', 'startsWith', 'endsWith'];
const TEXT_HELPER_CALLS = ['check', 'assert', 'ok', 'equal', 'notEqual', 'strictEqual', 'notStrictEqual', 'fail',
  'readFileSync', 'existsSync', 'readdirSync', 'statSync', 'join', 'resolve', 'basename', 'dirname', 'extname',
  'slice', 'substring', 'substr', 'split', 'trim', 'trimStart', 'trimEnd', 'replace', 'replaceAll', 'toLowerCase', 'toUpperCase', 'normalize', 'repeat', 'padStart', 'padEnd', 'charAt', 'at', 'concat',
  'String', 'Number', 'Boolean', 'RegExp', 'Array', 'Set', 'Map', 'isArray', 'from', 'keys', 'values', 'entries', 'has', 'get', 'add', 'push', 'sort', 'reverse', 'flat',
  'filter', 'map', 'forEach', 'some', 'every', 'find', 'findIndex', 'reduce', 'parse', 'stringify', 'toString', 'Error', 'max', 'min', 'abs', 'floor', 'ceil', 'round', 'isFinite', 'isInteger', 'parseInt', 'parseFloat',
  'if', 'for', 'while', 'switch', 'catch', 'function', 'return', 'typeof'];
// 호출 모양이 아니어도 "제품을 돌린다"는 신호인 것들. 이름을 넘겨 부르게 하는 경우(map(함수이름) 등)도 실행형으로 본다.
const EXEC_SIGNALS = /\bfns\b|\bsandbox\b|\bvm\s*\.|new\s+Function|\bawait\b|\.(?:map|flatMap|filter|forEach|some|every|find|findIndex|reduce|sort)\s*\(\s*(?!Boolean\b|String\b|Number\b)[A-Za-z_$][\w$.]*\s*[,)]|\.replace(?:All)?\s*\([^()]*,\s*[A-Za-z_$][\w$.]*\s*\)/;

// 시험지가 제품 파일(상대 경로 require)에서 받아 둔 이름들. 본문이 이 이름을 쓰면 제품이 실행 중에 만든 값을 보는 검사다.
function productBindings(src) {
  const names = new Set();
  const re = /(?:(?:const|let|var)\s+)?(\{[^}]*\}|[A-Za-z_$][\w$]*)\s*=\s*require\(\s*(?:['"`]\.{1,2}\/|[A-Za-z_$])/g;
  for (let m = re.exec(src); m; m = re.exec(src)) {
    if (m[1][0] !== '{') { names.add(m[1]); continue; }
    for (const part of m[1].slice(1, -1).split(',')) { const nm = part.split(':').pop().trim(); if (/^[A-Za-z_$][\w$]*$/.test(nm)) names.add(nm); }
  }
  return names;
}

// 글자 상수·정규식 상수·주석 안의 글자는 "부르는 것"이 아니다. 걷어낸 뒤에 호출 이름을 센다.
function stripLiterals(src) {
  let out = '', i = 0;
  const n = src.length;
  let prevSignificant = '';
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (c === '/' && d === '/') { while (i < n && src[i] !== '\n') i++; continue; }
    if (c === '/' && d === '*') { i += 2; while (i < n && !(src[i] === '*' && src[i + 1] === '/')) i++; i += 2; continue; }
    if (c === '\'' || c === '"' || c === '`') {
      const q = c; i++;
      while (i < n && src[i] !== q) {
        if (src[i] === '\\') { i += 2; continue; }
        if (q === '`' && src[i] === '$' && src[i + 1] === '{') { // 템플릿 안의 ${ } 는 코드다 — 밖으로 꺼내 센다
          let depth = 1; i += 2; let inner = '';
          while (i < n && depth > 0) { if (src[i] === '{') depth++; else if (src[i] === '}') { depth--; if (!depth) break; } inner += src[i]; i++; }
          out += ' (' + stripLiterals(inner) + ') '; i++; continue;
        }
        if (q !== '`' && src[i] === '\n') break;
        i++;
      }
      i++; out += ' "" '; prevSignificant = '"'; continue;
    }
    if (c === '/' && (/[=(,:;!&|?{}[>+\-*%~^\n]|^$/.test(prevSignificant) || /\b(?:return|typeof|case|in|of|void|delete|throw|do|else)\s*$/.test(out))) { // 정규식 상수(나눗셈이 아닌 자리)
      i++; let inClass = false;
      while (i < n && src[i] !== '\n') { if (src[i] === '\\') { i += 2; continue; } if (src[i] === '[') inClass = true; else if (src[i] === ']') inClass = false; else if (src[i] === '/' && !inClass) break; i++; }
      i++; while (i < n && /[a-z]/i.test(src[i])) i++;
      out += ' /re/ '; prevSignificant = ')'; continue;
    }
    out += c; if (!/\s/.test(c)) prevSignificant = c; else if (c === '\n' && prevSignificant === '') prevSignificant = '\n';
    i++;
  }
  return out;
}

// 글자 상수를 걷어낸 코드에서 여는 괄호 수 − 닫는 괄호 수. 검사 본문은 check( 의 여는 괄호 뒤에서 시작하므로, 그 검사가 끝나면 −1 이 된다.
function parenDepth(code) { const s = stripLiterals(code); return (s.match(/\(/g) || []).length - (s.match(/\)/g) || []).length; }

// 검사 하나의 본문: 제목 바로 뒤부터 그 검사의 닫는 줄까지. "다음 check( 앞까지"로 자르면 검사 사이의 구획 출력 줄(console.log('[검증 3/8] …'))이
// 앞 검사에 딸려 들어가, 글자가 있는지만 보던 검사가 실행형으로 읽힌다(실측: 이 저장소의 게이트에서 2건 — 폐기 사유와 판정서가 서로 어긋났다).
// 닫는 줄 = 검사 줄과 같은 들여쓰기에서 } 나 ) 로 시작하는 줄. 거기까지 잘랐는데 괄호가 닫히지 않았으면(본문 안의 글자 상수에 그런 줄이 있는 경우 등) 안전한 쪽(다음 검사 앞까지)으로 되돌린다.
function blockFrom(rest, indent) {
  const lines = rest.split('\n');
  const upToNext = () => { const next = rest.search(/\n\s*(?:await\s+)?check\(/); return next < 0 ? rest.slice(0, 6000) : rest.slice(0, next); };
  if (parenDepth(lines[0]) === -1) return lines[0]; // 한 줄로 쓴 검사: 제목 줄에서 끝났다
  const out = [lines[0]];
  let closed = false;
  for (let k = 1, size = lines[0].length; k < lines.length && size < 6000 && !closed; k++) {
    if (/^\s*(?:await\s+)?check\(/.test(lines[k])) break;
    out.push(lines[k]); size += lines[k].length + 1;
    closed = lines[k].startsWith(indent) && /^[})]/.test(lines[k].slice(indent.length));
  }
  const block = out.join('\n');
  return closed && parenDepth(block) === -1 ? block : upToNext();
}

// 그 제목의 검사 본문들. check( 호출의 제목 자리에 적힌 것을 먼저 찾고, 없으면 글자 그대로 찾는다.
// 같은 제목의 검사가 여러 개 있을 수 있다(실제 시험지에 2쌍 있다). 첫 것만 보면 나머지가 어떤 검사인지 모른 채 분류하게 되므로 전부 돌려준다.
function checkBlocks(baseTestSource, title) {
  const esc = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const starts = []; // { at: 제목 바로 뒤, indent: 그 검사 줄의 들여쓰기 }
  const indentOf = i => /^[ \t]*/.exec(baseTestSource.slice(baseTestSource.lastIndexOf('\n', i) + 1, i))[0];
  const re = new RegExp('check\\(\\s*([\'"`])' + esc + '\\1', 'g');
  for (let m = re.exec(baseTestSource); m; m = re.exec(baseTestSource)) starts.push({ at: m.index + m[0].length, indent: indentOf(m.index) });
  if (!starts.length) for (let i = baseTestSource.indexOf(title); i >= 0; i = baseTestSource.indexOf(title, i + title.length)) starts.push({ at: i + title.length, indent: indentOf(i) });
  return starts.map(s => blockFrom(baseTestSource.slice(s.at), s.indent));
}
function checkBlock(baseTestSource, title) { const all = checkBlocks(baseTestSource, title); return all.length ? all[0] : null; }

// 같은 제목의 검사가 여러 개면 전부 본다. 하나라도 실행형이면 실행형이다(안전한 쪽).
function classifyCheck(baseTestSource, title) {
  const blocks = checkBlocks(baseTestSource, title);
  if (!blocks.length) return 'unknown';
  const bindings = productBindings(baseTestSource);
  return blocks.some(b => classifyBlock(b, bindings) === 'exec') ? 'exec' : 'text-pin';
}

function classifyBlock(block, bindings) {
  const code = stripLiterals(block);
  if (EXEC_SIGNALS.test(code)) return 'exec';
  for (const nm of bindings) if (new RegExp('(^|[^\\w$.])' + nm.replace(/\$/g, '\\$') + '\\b').test(code)) return 'exec';
  const called = new Set();
  const re = /([A-Za-z_$][\w$]*)\s*\(/g;
  for (let m = re.exec(code); m; m = re.exec(code)) called.add(m[1]);
  if (![...called].some(nm => TEXT_FIND_CALLS.includes(nm))) return 'exec';
  for (const nm of called) if (!TEXT_FIND_CALLS.includes(nm) && !TEXT_HELPER_CALLS.includes(nm)) return 'exec';
  return 'text-pin';
}

// 돌려주는 것(judge 가 읽는다):
//  newlyBroken      기준 커밋에서 통과하던 검사가 작업 커밋에서 실패 — [{ file, check, kind }]
//  killedByProduct  기준 커밋에서는 끝까지 돈 시험지가 작업 커밋에서만 도중에 죽음(돌려보냄 사유, 도구 오류가 아니다) — [{ file, error, where, vanished, detail }]
//  forgery          시험 결과를 꾸민 흔적 — [{ file, reason }]
//  toolErrors       법정 쪽 사정으로 채점을 못 함 — [문장]
//  stillPasses(file, title)  그 기준 검사가 작업 커밋에서도 통과했는가(true·false, 그 시험지를 못 돌렸으면 null). 판정서에는 실리지 않는다(함수).
function probeBaseTests(ctx) {
  const { baseDir, headDir, vault, nodeModules } = ctx;
  const out = { ran: false, runners: [], newlyBroken: [], killedByProduct: [], forgery: [], toolErrors: [], insufficient: [] };
  const headPassed = new Map(); // 시험지 파일 → 작업 커밋에서 통과한 검사 제목들
  Object.defineProperty(out, 'stillPasses', { enumerable: false, value: (file, title) => (headPassed.has(file) ? headPassed.get(file).has(title) : null) });
  // error 는 한 줄이다: "오류 첫 줄 (죽은 자리)". 죽은 자리는 저장소 기준 경로라서 실행마다 달라지지 않는다(임시 폴더 경로를 싣지 않는다).
  const killed = (file, line, where, vanished) => {
    const error = line + (where ? ' (' + where + ')' : '');
    out.killedByProduct.push({ file, error, where: where || null, vanished, detail: file + ' — 작업 커밋의 제품 코드가 기존 시험 실행을 죽였다: ' + error + (vanished ? ' — 기준 커밋에서 돌던 검사 ' + vanished + '개가 돌지 못했다' : '') });
  };
  const runners = (vault.baseTestRunners || []).filter(r => fs.existsSync(path.join(baseDir, r.file)));
  if (!runners.length) { out.insufficient.push('기준 커밋에 돌릴 시험지가 없다'); return out; }
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'court-basetests-'));
  const scratchTmp = path.join(work, 'tmp'); fs.mkdirSync(scratchTmp, { recursive: true });
  const resultDir = path.join(work, 'watch-' + crypto.randomBytes(8).toString('hex')); fs.mkdirSync(resultDir, { recursive: true });
  try {
    const testFiles = [];
    const scriptsDir = path.join(baseDir, 'scripts');
    const { matcher } = require('../vault-check');
    const isBaseTest = matcher(vault.baseTests);
    if (fs.existsSync(scriptsDir)) for (const n of fs.readdirSync(scriptsDir)) if (isBaseTest('scripts/' + n)) testFiles.push('scripts/' + n);
    const overlay = makeOverlay(headDir, baseDir, testFiles, path.join(work, 'overlay'));
    const watch = { sheets: testFiles, resultDir };
    for (const runner of runners) {
      const onBase = runOne(baseDir, runner, nodeModules, scratchTmp, watch);
      const onHead = runOne(overlay, runner, nodeModules, scratchTmp, watch);
      if (!onBase.ran) { out.toolErrors.push('기준 시험지 ' + runner.file + ' 실행 실패: ' + onBase.reason); continue; }
      if (!onBase.watched) { out.toolErrors.push('기준 시험지 ' + runner.file + ' 가 기준 커밋에서 감시 기록을 남기지 못했다(법정 도구 점검 필요): ' + onBase.tail.replace(/\s+/g, ' ').slice(0, 200)); continue; }
      if (onBase.passed.length + onBase.failed.length === 0) { out.toolErrors.push('기준 시험지 ' + runner.file + ' 가 기준 커밋에서 검사를 하나도 출력하지 않았다(의존성 없음으로 추정): ' + onBase.tail.replace(/\s+/g, ' ').slice(0, 200)); continue; }
      // 여기부터는 "기준 커밋에서는 끝까지 돈 시험지"다. 같은 시험지·같은 환경에서 작업 커밋만 못 돌았다면 달라진 것은 제품뿐이다.
      if (!onHead.ran) {
        if (onHead.timedOut) { killed(runner.file, '제한 시간(' + Math.round(RUN_TIMEOUT_MS / 1000) + '초) 안에 끝나지 않았다(기준 커밋에서는 끝났다)', null, onBase.passed.length + onBase.failed.length); out.ran = true; }
        else out.toolErrors.push('기준 시험지 ' + runner.file + ' 실행 실패: ' + onHead.reason);
        continue;
      }
      const forged = findForgery(runner.file, onBase, onHead);
      out.forgery.push(...forged);
      const okOnBase = new Set(onBase.passed);
      const src = fs.readFileSync(path.join(baseDir, runner.file), 'utf8');
      const broken = onHead.failed.filter(t => okOnBase.has(t));
      const vanished = onBase.passed.filter(t => !onHead.passed.includes(t) && !onHead.failed.includes(t));
      const runnerRec = { file: runner.file, isolated: onHead.isolated, watched: onHead.watched, base: { passed: onBase.passed.length, failed: onBase.failed.length }, head: { passed: onHead.passed.length, failed: onHead.failed.length }, vanished: vanished.length, forgery: forged.length };
      // 작업 커밋에서 통과한 기준 검사 제목들. judge 가 "제목만 바뀐 검사가 여전히 통과하는가"를 볼 때 쓴다. 수백 줄이라 판정서(JSON)에는 싣지 않는다(열거되지 않는 칸).
      Object.defineProperty(runnerRec, 'headPassedTitles', { enumerable: false, value: onHead.passed.slice() });
      out.runners.push(runnerRec);
      headPassed.set(runner.file, new Set(onHead.passed));
      for (const t of broken) out.newlyBroken.push({ file: runner.file, check: t, kind: classifyCheck(src, t) });
      // 위조 신호가 있으면 "출력되지 않은 검사"는 그 위조의 결과다 — 사유를 위조 쪽 하나로 모은다.
      if (vanished.length && !forged.length) {
        const known = new Set(onBase.passed.concat(onBase.failed));
        const renamed = onHead.passed.concat(onHead.failed).filter(t => !known.has(t)).length; // 기준 실행에는 없던 제목(실행 중에 만들어지는 제목이 달라진 경우)
        const d = onHead.death || {};
        if (d.denied) out.toolErrors.push('기준 시험지 ' + runner.file + ' 가 작업 커밋에서 법정의 격리 실행(지정 폴더 밖 쓰기·프로세스 실행 금지)에 막혀 죽었다 — 법정 환경의 한계다: ' + (d.line || onHead.tail.replace(/\s+/g, ' ').slice(0, 200)));
        else if (vanished.length > renamed) killed(runner.file, d.line || '오류 글자 없이 도중에 끝났다(종료 코드 ' + (onHead.exit === null ? '없음' : onHead.exit) + ')', d.where, vanished.length);
        else out.toolErrors.push('기준 시험지 ' + runner.file + ' 의 검사 제목 ' + vanished.length + '개가 작업 커밋 실행에서 다른 글자로 찍혔다 — 실행 중에 만들어지는 제목이라 기준 실행과 맞춰 볼 수 없다(법정 도구 점검 필요)');
      }
      out.ran = true;
    }
  } catch (e) {
    out.toolErrors.push('기준 시험지 채점 중 오류: ' + String((e && e.message) || e));
  } finally {
    try { fs.rmSync(work, { recursive: true, force: true }); } catch (_) { /* 임시 폴더 정리 실패는 무시 */ }
  }
  return out;
}

module.exports = { probeBaseTests, makeOverlay, parseTitles, classifyCheck, classifyBlock, checkBlocks, runOne, findForgery, deathInfo, PRELOAD };
