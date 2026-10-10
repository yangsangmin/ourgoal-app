'use strict';
// 생성기 「배선 철거 모드」(gen-inline-hard.js mode:"unwire") 단위 시험 — B1(docs/architecture/CELL-REGISTRY-DESIGN.md 5절). 작업자 측정, 판정 아님.
// 저장소 밖 임시 폴더에 작은 index.html 꾸러미를 만들어 생성기를 자식 프로세스로 돌리고(법정 recomputeSplit 과 같은 호출 꼴), 결과를 바이트 단위로 기대값과 맞댄다.
//  T1 기본: 지정 키트의 가져오기 줄·expose getter/setter 줄(빈 expose 문 전체)·window 대입 줄(한 줄 if·여러 줄 if 안 줄·빈 블록 전체)만 지운다. 새로 마지막이 된 속성의 쉼표만 뗀다.
//  T2 names 밖 보존: names 에 없는 이름(keepMe)·다른 키트의 이름(gamma)·함수 본문·상태 변수는 글자 그대로 남는다(T1 의 기대값에 포함).
//  T3 잔존 참조 정지: 철거할 이름을 함수 본문이 아직 쓰면 생성기가 멈추고 index.html 을 쓰지 않는다.
//  T4 정의문 보호: window.X = function(){…} 같은 정의문은 names 에 있어도 지우지 않고 멈춘다.
//  T5 없는 이름 정지: names 의 이름 중 지울 줄이 하나도 없으면 멈춘다.
//  T6 종류 끄기: imports:false 면 가져오기 줄은 남기고 나머지 두 종류만 지운다(그러면 잔존 참조가 없으므로 통과).
//  T7 실제 index.html: 작업 트리 index.html 에서 참조가 남지 않는 _settingsKit 이름을 골라 철거 → 지워진 줄이 세 종류뿐이고 그 밖의 줄은 순서대로 같다(쉼표 떼기 제외).
//  T8 기존 경로 무변화: A1 시범 PR(#TASK-ES-596, e8c34e42)의 기준 커밋 트리에 수정된 생성기를 그 설정(inline-hard-a1-596.json)으로 돌려 index.html·세포 2개가 그 커밋의 바이트와 같다(법정 재생성 대조와 같은 검사).
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node unwire-check-b1.js <APP_DIR(작업 트리)> <out.json>
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
const [APP_ARG, OUT] = process.argv.slice(2);
const APP = path.resolve(APP_ARG);
const GEN = path.join(APP, 'docs', 'design', 'harness', 'module-split', 'gen-inline-hard.js');
const A1_COMMIT = 'e8c34e4261aaaac44d84272aadc0da2304294830';
const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'unwire-b1-'));
const results = [];
const env = { ...process.env, MODULE_SPLIT_OUT: tmpRoot };

function runGen(dir, cfg) {
  const cfgFile = path.join(tmpRoot, 'cfg-' + Math.random().toString(16).slice(2) + '.json');
  fs.writeFileSync(cfgFile, JSON.stringify(cfg), 'utf8');
  const r = cp.spawnSync(process.execPath, [GEN, dir, cfgFile], { encoding: 'utf8', env });
  return { status: r.status, stdout: r.stdout, stderr: r.stderr };
}
function fixtureLines() {
  return [
    '<!doctype html>', '<html><head><title>fixture</title></head><body>', '<script src="js/core/app-scope.js"></script>', '<script>', '(function(){', '  "use strict";',
    '  var _settingsKit = window.OurgoalSettingsKit;',
    '  var alpha = _settingsKit.alpha;',                                   // 8  삭제(①)
    '  var beta = _settingsKit.beta;',                                     // 9  삭제(①)
    '  var keepMe = _settingsKit.keepMe;',                                 // 10 보존(names 밖)
    '  var _goalsKit = window.OurgoalGoalsKit;',
    '  var gamma = _goalsKit.gamma;',                                      // 12 보존(다른 키트)
    "  window.OurgoalAppScope.expose('index.html', {",
    '    get alpha(){ return alpha; },',                                   // 14 삭제(②)
    '    get keepMe(){ return keepMe; },',                                 // 15 보존 → 마지막이 되어 쉼표 뗌
    '    get beta(){ return beta; }, set beta(v){ beta = v; }',            // 16 삭제(②)
    '  });',
    "  window.OurgoalAppScope.expose('index.html', {",                     // 18 삭제(② 빈 문)
    '    get alpha(){ return alpha; }',                                    // 19 삭제
    '  });',                                                               // 20 삭제
    '  var state = { n: 1 };',
    '  function useKeep(){ return keepMe() + gamma(); }',
    '  function shadow(){ var alpha = 1; return alpha; }',                 // 지역 alpha — 참조가 아니다
    '  window.alpha = alpha;',                                             // 24 삭제(③)
    "  if(typeof window !== 'undefined'){ window.beta = beta; }",          // 25 삭제(③ 한 줄 블록)
    "  if(typeof window !== 'undefined'){",
    '    window.keepMe = keepMe;',
    '    window.alpha = alpha;',                                           // 28 삭제(③ 블록 안 줄)
    '  }',
    "  if(typeof window !== 'undefined'){",                                // 30 삭제(③ 빈 블록)
    '    window.beta = beta;',                                             // 31 삭제
    '  }',                                                                 // 32 삭제
    '  window.gamma = gamma;',
    '  window.useKeep = useKeep;',
    '})();', '</script>', '</body></html>', '',
  ];
}
const BASE_CFG = { task: 'TASK-B1-UNIT', slot: 'HO', mode: 'unwire', cells: [{ file: 'js/core/cell-registry.js' }], unwire: { kitVar: '_settingsKit', imports: true, exposeGetters: true, windowAssign: true, names: ['alpha', 'beta'] } };
function makeDir(name, lines) { const d = path.join(tmpRoot, name); fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, 'index.html'), lines.join('\n'), 'utf8'); return d; }
function expectFrom(lines, delLines, commaLines) { return lines.map((l, i) => (commaLines.includes(i + 1) ? l.replace(/,\s*$/, '') : l)).filter((l, i) => !delLines.includes(i + 1)).join('\n'); }
function record(id, title, ok, detail) { results.push({ id, title, ok, detail }); console.log((ok ? 'ok  ' : 'FAIL'), id, title, ok ? '' : JSON.stringify(detail).slice(0, 400)); }

// T1·T2
{
  const lines = fixtureLines();
  const dir = makeDir('t1', lines);
  const r = runGen(dir, BASE_CFG);
  const got = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
  const expected = expectFrom(lines, [8, 9, 14, 16, 18, 19, 20, 24, 25, 28, 30, 31, 32], [15]);
  const meta = JSON.parse(fs.readFileSync(path.join(tmpRoot, 'gen-inline-hard-meta.json'), 'utf8'));
  record('T1', '세 종류만 지우고 빈 expose 문·빈 if 블록은 통째로, 새 마지막 속성의 쉼표만 뗀다', r.status === 0 && got === expected,
    { status: r.status, stderr: r.stderr.slice(0, 300), deleted: meta.deletedLines, comma: meta.commaFixedLines, diffAt: got === expected ? null : firstDiff(got, expected) });
  record('T2', 'names 밖 이름(keepMe)·다른 키트(gamma)·함수 본문·상태 변수는 글자 그대로', r.status === 0 && got.includes('var keepMe = _settingsKit.keepMe;') && got.includes('var gamma = _goalsKit.gamma;') && got.includes('function useKeep(){ return keepMe() + gamma(); }') && got.includes('var state = { n: 1 };') && got.includes('    get keepMe(){ return keepMe; }\n  });') && !fs.existsSync(path.join(dir, 'js')), {});
}
// T3 잔존 참조
{
  const lines = fixtureLines(); lines.splice(22, 0, '  function useAlpha(){ return alpha(); }');
  const dir = makeDir('t3', lines); const before = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
  const r = runGen(dir, BASE_CFG);
  record('T3', '철거할 이름을 함수 본문이 아직 쓰면 멈추고 index.html 을 쓰지 않는다', r.status !== 0 && /아직 쓰는 곳이 남는다/.test(r.stderr) && fs.readFileSync(path.join(dir, 'index.html'), 'utf8') === before, { status: r.status, stderr: r.stderr.slice(0, 300) });
}
// T4 정의문 보호
{
  const lines = fixtureLines(); lines[23] = '  window.alpha = function(){ return 1; };';
  const dir = makeDir('t4', lines); const before = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
  const r = runGen(dir, BASE_CFG);
  record('T4', 'window.X = function(){…} 정의문은 지우지 않고 멈춘다', r.status !== 0 && /정의문이라 지우지 않는다/.test(r.stderr) && fs.readFileSync(path.join(dir, 'index.html'), 'utf8') === before, { status: r.status, stderr: r.stderr.slice(0, 300) });
}
// T5 없는 이름
{
  const dir = makeDir('t5', fixtureLines()); const before = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
  const r = runGen(dir, { ...BASE_CFG, unwire: { ...BASE_CFG.unwire, names: ['alpha', 'nothingHere'] } });
  record('T5', 'names 의 이름 중 지울 줄이 하나도 없으면 멈춘다', r.status !== 0 && /지울 줄이 하나도 없다/.test(r.stderr) && fs.readFileSync(path.join(dir, 'index.html'), 'utf8') === before, { status: r.status, stderr: r.stderr.slice(0, 300) });
}
// T6 종류 끄기
{
  const lines = fixtureLines(); const dir = makeDir('t6', lines);
  const r = runGen(dir, { ...BASE_CFG, unwire: { ...BASE_CFG.unwire, imports: false } });
  const got = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
  const expected = expectFrom(lines, [14, 16, 18, 19, 20, 24, 25, 28, 30, 31, 32], [15]);
  record('T6', 'imports:false 면 가져오기 줄은 남기고 expose·window 만 지운다', r.status === 0 && got === expected, { status: r.status, stderr: r.stderr.slice(0, 300), diffAt: got === expected ? null : firstDiff(got, expected) });
}
// T7 실제 index.html
{
  const parser = require('@babel/parser'), traverse = require('@babel/traverse').default;
  const html = fs.readFileSync(path.join(APP, 'index.html'), 'utf8');
  const lines = html.split('\n').map(l => l.replace(/\r$/, ''));
  let s = -1, e = -1;
  for (let i = 0; i < lines.length; i++) if (lines[i].trim() === '<script>' && (lines[i + 1] || '').trim() === '(function(){' && (lines[i + 2] || '').includes('"use strict"')) { s = i + 1; break; }
  for (let i = s; i < lines.length; i++) if (lines[i].startsWith('</script>')) { e = i; break; }
  const code = lines.slice(s, e).join('\n');
  const ast = parser.parse(code, { sourceType: 'script', ranges: true });
  let iife = null; traverse(ast, { FunctionExpression(p) { if (!iife) iife = p; } });
  const top = iife.get('body').get('body');
  const L = n => n.loc.start.line + s;
  // 후보: _settingsKit 가져오기 이름 중, 참조가 전부 「expose getter 줄」또는「window 대입 줄」뿐인 것(= 철거해도 IIFE 안 참조 0)
  const exposeLines = new Set(), windowLines = new Set();
  for (const st of top) {
    const x = st.isExpressionStatement() && st.node.expression;
    if (x && x.type === 'CallExpression' && x.callee.type === 'MemberExpression' && x.callee.property.name === 'expose' && x.arguments[1] && x.arguments[1].type === 'ObjectExpression') for (const p of x.arguments[1].properties) exposeLines.add(L(p));
    const isWA = y => y && y.type === 'AssignmentExpression' && y.left.type === 'MemberExpression' && y.left.object.type === 'Identifier' && y.left.object.name === 'window' && y.right.type === 'Identifier';
    if (x && isWA(x)) windowLines.add(L(st.node));
    if (st.isIfStatement() && st.node.consequent.type === 'BlockStatement') for (const b of st.node.consequent.body) if (b.type === 'ExpressionStatement' && isWA(b.expression)) windowLines.add(L(b));
  }
  const candidates = [];
  for (const st of top) {
    if (!st.isVariableDeclaration() || st.node.declarations.length !== 1) continue;
    const d = st.node.declarations[0];
    if (!d.init || d.init.type !== 'MemberExpression' || d.init.object.type !== 'Identifier' || d.init.object.name !== '_settingsKit' || d.init.property.name !== d.id.name) continue;
    const b = iife.scope.getBinding(d.id.name);
    if (!b || b.constantViolations.length) continue;
    const refs = b.referencePaths.map(r => L(r.node));
    if (refs.every(l => exposeLines.has(l) || windowLines.has(l))) candidates.push({ name: d.id.name, refs });
  }
  const pick = candidates.slice(0, 3);
  if (!pick.length) record('T7', '실제 index.html 철거(참조 없는 _settingsKit 이름)', false, { note: '후보 이름 없음(모든 가져오기가 IIFE 안에서 쓰인다) — 측정불가' });
  else {
    const dir = makeDir('t7', []); fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
    const r = runGen(dir, { ...BASE_CFG, unwire: { ...BASE_CFG.unwire, names: pick.map(p => p.name) } });
    const got = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
    const meta = r.status === 0 ? JSON.parse(fs.readFileSync(path.join(tmpRoot, 'gen-inline-hard-meta.json'), 'utf8')) : null;
    let ok = r.status === 0 && !!meta;
    const detail = { status: r.status, stderr: r.stderr.slice(0, 300), names: pick.map(p => p.name), deleted: meta && meta.deletedLines, comma: meta && meta.commaFixedLines };
    if (ok) {
      const gl = got.split('\n').map(l => l.replace(/\r$/, ''));
      const del = new Set(meta.deletedLines), comma = new Set(meta.commaFixedLines);
      const kinds = [];
      let j = 0, same = true;
      for (let i = 0; i < lines.length; i++) {
        const l = i + 1;
        if (del.has(l)) {
          const t = lines[i].trim();
          const k = /^var [\w$]+ = _settingsKit\.[\w$]+;$/.test(t) ? 'import' : /^(get [\w$]+\(\)\{ return [\w$]+; \})(, set [\w$]+\(v\)\{ [\w$]+ = v; \})?,?$/.test(t) ? 'expose' : /^window\.[\w$]+ = [\w$]+;$/.test(t) || /^if\(typeof window !== 'undefined'\)\{ window\.[\w$]+ = [\w$]+; \}$/.test(t) ? 'window' : /^(if\(typeof window !== 'undefined'\)\{|\}|window\.OurgoalAppScope\.expose\('index\.html', \{|\}\);)$/.test(t) ? 'wrapper' : 'OTHER:' + t.slice(0, 60);
          kinds.push(k);
          continue;
        }
        const want = comma.has(l) ? lines[i].replace(/,\s*$/, '') : lines[i];
        if (gl[j] !== want) { same = false; detail.diffAt = { line: l, got: gl[j], want }; break; }
        j++;
      }
      detail.kinds = kinds.reduce((o, k) => { o[k] = (o[k] || 0) + 1; return o; }, {});
      ok = same && j === gl.length && kinds.every(k => !k.startsWith('OTHER')) && kinds.some(k => k === 'import');
    }
    record('T7', '실제 index.html 에서 참조 없는 _settingsKit 이름 ' + pick.length + '개 철거 — 지운 줄이 세 종류(와 그 빈 껍데기)뿐이고 나머지 줄은 순서대로 같다', ok, detail);
  }
}
// T8 기존 경로 무변화(A1 시범 재생성)
{
  const base = path.join(tmpRoot, 't8-base'); fs.mkdirSync(base);
  // 법정(court/lib/preserve-source.js)과 같이 줄 끝 변환 없이(core.autocrlf=false) 기준 트리를 풀고 blob 을 읽는다 — 이 PC 는 autocrlf=true 라 그냥 두면 CRLF 로 바뀐다
  const ar = cp.spawnSync('git', ['-c', 'core.autocrlf=false', '-C', APP, 'archive', '--format=tar', A1_COMMIT + '^'], { encoding: 'buffer', maxBuffer: 1024 * 1024 * 512 });
  let ok = ar.status === 0, detail = { archiveStatus: ar.status };
  if (ok) {
    fs.writeFileSync(path.join(tmpRoot, 't8.tar'), ar.stdout);
    // 상대 경로로 푼다(Windows 의 GNU tar 는 `C:` 를 원격 호스트로 읽는다)
    const tx = cp.spawnSync('tar', ['-xf', 't8.tar', '-C', 't8-base'], { cwd: tmpRoot, encoding: 'utf8' }); ok = tx.status === 0; detail.tarStatus = tx.status; detail.tarErr = (tx.stderr || '').slice(0, 200);
    // 이 PC(autocrlf=true)에서는 git archive·git show 가 -c core.autocrlf=false 를 줘도 CRLF 로 바꿔 낸다(실측). 생성기의 입력이자 비교 대상인 index.html 은 원시 blob(git cat-file, LF)으로 덮어 법정 clone(autocrlf=false)과 같은 입력을 만든다.
    if (ok) { const raw = cp.spawnSync('git', ['-C', APP, 'cat-file', '-p', A1_COMMIT + '^:index.html'], { encoding: 'buffer', maxBuffer: 1024 * 1024 * 64 }); ok = raw.status === 0; if (ok) fs.writeFileSync(path.join(base, 'index.html'), raw.stdout); detail.inputCr = ok ? raw.stdout.filter(b => b === 13).length : null; }
  }
  if (ok) {
    const cfg = JSON.parse(fs.readFileSync(path.join(APP, 'docs', 'design', 'harness', 'module-split', 'inline-hard-a1-596.json'), 'utf8'));
    const r = runGen(base, cfg); detail.genStatus = r.status; detail.stderr = (r.stderr || '').slice(0, 300); detail.stdout = (r.stdout || '').split('\n')[0];
    ok = r.status === 0;
    if (ok) {
      detail.files = {};
      for (const f of ['index.html', ...cfg.cells.map(c => c.file)]) {
        const gen = fs.readFileSync(path.join(base, f));
        const head = cp.spawnSync('git', ['-C', APP, 'cat-file', '-p', A1_COMMIT + ':' + f], { encoding: 'buffer', maxBuffer: 1024 * 1024 * 64 }).stdout; // 원시 blob(변환 없음)
        const same = Buffer.compare(gen, head) === 0; detail.files[f] = { same, genBytes: gen.length, headBytes: head.length }; if (!same) ok = false;
      }
    }
  }
  record('T8', '수정된 생성기가 A1 시범(e8c34e42) 기준 트리에서 같은 설정으로 index.html·세포 2개를 바이트 그대로 다시 만든다(기존 경로 무변화)', ok, detail);
}

function firstDiff(a, b) { const al = a.split('\n'), bl = b.split('\n'); for (let i = 0; i < Math.max(al.length, bl.length); i++) if (al[i] !== bl[i]) return { line: i + 1, got: al[i], want: bl[i] }; return null; }
const out = { tool: 'docs/design/harness/module-split/unwire-check-b1.js', type: '작업자 측정, 판정 아님', generator: 'docs/design/harness/module-split/gen-inline-hard.js', app: APP, measuredAt: new Date().toISOString(), tmp: tmpRoot, results, passed: results.filter(r => r.ok).length, total: results.length, ok: results.every(r => r.ok) };
if (OUT) { fs.mkdirSync(path.dirname(path.resolve(OUT)), { recursive: true }); fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n', 'utf8'); }
console.log('unwire-check-b1', out.passed + '/' + out.total, out.ok ? 'ok' : 'FAIL');
try { fs.rmSync(tmpRoot, { recursive: true, force: true }); } catch (_) { /* 임시 폴더 정리 실패는 결과에 영향 없음 */ }
process.exit(out.ok ? 0 : 1);
