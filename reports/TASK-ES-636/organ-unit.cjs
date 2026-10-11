#!/usr/bin/env node
'use strict';
// #TASK-ES-636 상태 기관 단위 시험(작업자 측정, 판정 아님) — 진짜 js/core/app-scope.js 와 진짜 js/core/app-state.js 를 vm 에 올려 설계 3.3 「기관 API — 확정」 계약을 항목마다 잰다.
//  O1  define: 통로에 getter 만 달린다. 값이 읽히고, 엄격 모드에서 쓰면 TypeError 이며 값은 그대로다.
//  O2  defineVar: get/set 짝이 달린다. 쓰면 보관 값이 바뀌고 다시 읽힌다.
//  O3  접근자는 그 이름의 첫 define 때 달린다(그 전에는 속성이 없다). 주인은 core/app-state 로 적힌다.
//  O4  이미 있던 데이터 속성(선언 줄보다 먼저 누가 L.X = v 로 만든 것)을 다시 정의해 덮는다.
//  O5  이미 있던 접근자(index.html 이 노출한 getter)를 다시 정의해 덮는다.
//  O6  같은 이름을 두 번 정의하면 오류(ALREADY_DEFINED)이고 값은 그대로다.
//  O7  값을 복사하지 않는다(같은 객체).
//  O8  window 에 상태 이름을 달지 않는다. 파일이 만드는 전역은 OurgoalAppState 하나다.
//  O9  이름이 글자열이 아니거나 비면 오류(NAME_REQUIRED).
//  O10 통로 없이 파일만 로드해도 오류가 없고(로드 때는 아무것도 만지지 않는다), 그 상태에서 define 은 오류(SCOPE_MISSING)다.
//  O11 names() · kindOf(name) 가 맡은 이름과 종류를 돌려준다.
//  O12 진짜 기관 등가: 생성기 unstate 로 바꿔 쓴 꾸러미(#TASK-ES-634 시험 T1 과 같은 꾸러미)를 진짜 기관 위에서 실행한 관찰값이 바꿔 쓰기 전과 같다.
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node reports/TASK-ES-636/organ-unit.cjs <작업 트리> <out.json>
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process'), vm = require('vm');
const APP = path.resolve(process.argv[2] || '.'), OUT = process.argv[3];
const SCOPE_SRC = fs.readFileSync(path.join(APP, 'js', 'core', 'app-scope.js'), 'utf8'), ORGAN_SRC = fs.readFileSync(path.join(APP, 'js', 'core', 'app-state.js'), 'utf8');
const results = [];
const record = (id, title, ok, detail) => { results.push({ id, title, ok: !!ok, detail }); console.log(ok ? 'ok  ' : 'FAIL', id, title, ok ? '' : JSON.stringify(detail).slice(0, 500)); };
function fresh(withScope) { const sb = {}; sb.window = sb; vm.createContext(sb); if (withScope !== false) vm.runInContext(SCOPE_SRC, sb); const before = Object.keys(sb); vm.runInContext(ORGAN_SRC, sb); sb.__newGlobals = Object.keys(sb).filter(k => !before.includes(k)); return sb; }
const run = (sb, code) => { try { return { value: vm.runInContext(code, sb) }; } catch (e) { return { threw: e.constructor.name, code: e.code || null, message: String(e.message || e).slice(0, 120) }; } };
const strict = body => '(function(){ "use strict"; ' + body + ' })()';
const desc = (sb, n) => { const d = Object.getOwnPropertyDescriptor(sb.OurgoalAppScope.scope, n); return !d ? '(absent)' : d.get ? (d.set ? 'get+set' : 'get') : 'data'; };

{ const sb = fresh(); run(sb, 'OurgoalAppState.define("a", 3)'); const w = run(sb, strict('OurgoalAppScope.scope.a = 9; return 1;'));
  record('O1', 'define: getter 만 · 값 읽힘 · 엄격 모드 쓰기는 TypeError · 값 그대로', desc(sb, 'a') === 'get' && sb.OurgoalAppScope.scope.a === 3 && w.threw === 'TypeError' && sb.OurgoalAppScope.scope.a === 3, { accessor: desc(sb, 'a'), write: w }); }
{ const sb = fresh(); run(sb, 'OurgoalAppState.defineVar("b", 1)'); const w = run(sb, strict('OurgoalAppScope.scope.b = 7; return OurgoalAppScope.scope.b;'));
  record('O2', 'defineVar: get/set 짝 · 쓰면 보관 값이 바뀌고 다시 읽힌다', desc(sb, 'b') === 'get+set' && w.value === 7 && sb.OurgoalAppScope.scope.b === 7, { accessor: desc(sb, 'b'), write: w }); }
{ const sb = fresh(); const before = desc(sb, 'c'); const r = run(sb, 'OurgoalAppState.define("c", "v")');
  record('O3', '접근자는 첫 define 때 달린다(그 전에는 속성 없음) · 주인 core/app-state · 반환값 없음', before === '(absent)' && desc(sb, 'c') === 'get' && sb.OurgoalAppScope.ownerOf('c') === 'core/app-state' && r.value === undefined, { before, after: desc(sb, 'c'), owner: sb.OurgoalAppScope.ownerOf('c'), returned: r }); }
{ const sb = fresh(); run(sb, 'OurgoalAppScope.scope.d = 5'); const before = desc(sb, 'd'); run(sb, 'OurgoalAppState.defineVar("d", 1)');
  record('O4', '이미 있던 데이터 속성을 다시 정의해 덮는다', before === 'data' && desc(sb, 'd') === 'get+set' && sb.OurgoalAppScope.scope.d === 1, { before, after: desc(sb, 'd'), value: sb.OurgoalAppScope.scope.d }); }
{ const sb = fresh(); run(sb, 'var old = 11; OurgoalAppScope.expose("index.html", { get e(){ return old; }, set e(v){ old = v; } })'); const before = desc(sb, 'e') + ':' + sb.OurgoalAppScope.ownerOf('e'); run(sb, 'OurgoalAppState.define("e", 2)');
  record('O5', '이미 있던 접근자(index.html 노출)를 다시 정의해 덮는다', before === 'get+set:index.html' && desc(sb, 'e') === 'get' && sb.OurgoalAppScope.scope.e === 2 && sb.OurgoalAppScope.ownerOf('e') === 'core/app-state', { before, after: desc(sb, 'e') + ':' + sb.OurgoalAppScope.ownerOf('e'), value: sb.OurgoalAppScope.scope.e }); }
{ const sb = fresh(); run(sb, 'OurgoalAppState.defineVar("f", 1)'); const r1 = run(sb, 'OurgoalAppState.defineVar("f", 2)'), r2 = run(sb, 'OurgoalAppState.define("f", 3)');
  record('O6', '같은 이름을 두 번 정의하면 오류(ALREADY_DEFINED) · 값 그대로', r1.code === 'ALREADY_DEFINED' && r2.code === 'ALREADY_DEFINED' && sb.OurgoalAppScope.scope.f === 1 && desc(sb, 'f') === 'get+set', { r1, r2, value: sb.OurgoalAppScope.scope.f }); }
{ const sb = fresh(); run(sb, 'var obj = { n: [1] }; OurgoalAppState.define("g", obj); obj.n.push(2);');
  record('O7', '값을 복사하지 않는다(같은 객체 — 바깥의 내용 변경이 그대로 보인다)', run(sb, 'OurgoalAppScope.scope.g === obj').value === true && sb.OurgoalAppScope.scope.g.n.length === 2, {}); }
{ const sb = fresh(); run(sb, 'OurgoalAppState.defineVar("h", 1)');
  record('O8', 'window 에 상태 이름을 달지 않는다 · 파일이 만드는 전역은 OurgoalAppState 하나', JSON.stringify(sb.__newGlobals) === '["OurgoalAppState"]' && !('h' in sb), { newGlobals: sb.__newGlobals, hOnWindow: 'h' in sb }); }
{ const sb = fresh(); const r = [run(sb, 'OurgoalAppState.define("", 1)'), run(sb, 'OurgoalAppState.define(5, 1)'), run(sb, 'OurgoalAppState.defineVar(null, 1)')];
  record('O9', '이름이 글자열이 아니거나 비면 오류(NAME_REQUIRED)', r.every(x => x.code === 'NAME_REQUIRED') && sb.OurgoalAppState.names().length === 0, r); }
{ let loadErr = null, sb = null; try { sb = fresh(false); } catch (e) { loadErr = String(e.message || e); } const r = sb ? run(sb, 'OurgoalAppState.define("i", 1)') : null;
  record('O10', '통로 없이 파일만 로드해도 오류 없음 · 그 상태의 define 은 오류(SCOPE_MISSING)이고 이름을 맡지 않는다', !loadErr && r && r.code === 'SCOPE_MISSING' && sb.OurgoalAppState.names().length === 0, { loadErr, r }); }
{ const sb = fresh(); run(sb, 'OurgoalAppState.define("k2", 1); OurgoalAppState.defineVar("k1", 1)');
  record('O11', 'names() · kindOf(name)', JSON.stringify(sb.OurgoalAppState.names()) === '["k1","k2"]' && sb.OurgoalAppState.kindOf('k1') === 'var' && sb.OurgoalAppState.kindOf('k2') === 'const' && sb.OurgoalAppState.kindOf('zz') === null, { names: sb.OurgoalAppState.names() }); }
// O12: 생성기가 바꿔 쓴 꾸러미를 진짜 기관 위에서
{
  const HEAD = ['<!doctype html>', '<html><head><title>fixture</title></head><body>', '<script src="js/core/app-scope.js"></script>', '<script>', '(function(){', '  "use strict";'], TAIL = ['})();', '</script>', '</body></html>', ''];
  const BODY = ['  var _aKit = window.OurgoalAKit;', '  var alpha = _aKit.alpha;', "  window.OurgoalAppScope.expose('index.html', {", '    get alpha(){ return alpha; },', '    get counter(){ return counter; }, set counter(v){ counter = v; },', '    get label(){ return label; },', '    get keep(){ return keep; },', '    get themes(){ return themes; }', '  });',
    '  var counter = 0;', "  var label = 'a (label) b';", '  var keep = { n: 1 };', '  var themes = [', "    { id: 'a' },", "    { id: 'b' }", '  ];', '  function bump(){ return keep.n + 1; }', '  window.label = label;', "  if(typeof window !== 'undefined'){ window.counter = counter; }", "  if(typeof window !== 'undefined'){", '    window.themes = themes;', '    window.bump = bump;', '  }', '  window.alpha = alpha;'];
  const before = HEAD.concat(BODY, TAIL).join('\n');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'organ-unit-636-'));
  fs.writeFileSync(path.join(tmp, 'index.html'), before, 'utf8');
  fs.writeFileSync(path.join(tmp, 'cfg.json'), JSON.stringify({ task: 'TASK-636-UNIT', slot: 'HO', mode: 'unstate', cells: [{ file: 'js/core/app-state.js' }], unstate: { names: ['counter', 'label', 'themes'] } }), 'utf8');
  const g = cp.spawnSync(process.execPath, [path.join(APP, 'docs', 'design', 'harness', 'module-split', 'gen-inline-hard.js'), tmp, path.join(tmp, 'cfg.json')], { encoding: 'utf8', env: { ...process.env, MODULE_SPLIT_OUT: tmp } });
  const after = g.status === 0 ? fs.readFileSync(path.join(tmp, 'index.html'), 'utf8') : null;
  const observe = (html, withOrgan) => {
    const ls = html.split('\n'), s = ls.indexOf('(function(){'), e = ls.indexOf('})();');
    const sb = {}; sb.window = sb; sb.OurgoalAKit = { alpha: function () { return 'A'; } }; vm.createContext(sb); vm.runInContext(SCOPE_SRC, sb); if (withOrgan) vm.runInContext(ORGAN_SRC, sb);
    vm.runInContext(ls.slice(s, e + 1).join('\n'), sb);
    const L = sb.OurgoalAppScope.scope, o = {}, tryDo = f => { try { return f(); } catch (err) { return 'throw:' + err.constructor.name; } };
    o.read = { counter: L.counter, label: L.label, themes: JSON.stringify(L.themes), keep: JSON.stringify(L.keep), alpha: typeof L.alpha };
    o.window = { label: sb.label, counter: sb.counter, themesSame: sb.themes === L.themes, bump: sb.bump() };
    o.setCounter = tryDo(() => { L.counter = 7; return L.counter; });
    o.setLabelStrict = tryDo(() => vm.runInContext('(function(){ "use strict"; OurgoalAppScope.scope.label = "z"; return OurgoalAppScope.scope.label; })()', sb));
    o.mutate = tryDo(() => { L.themes.push({ id: 'c' }); return sb.themes.length; });
    o.descriptor = ['counter', 'label', 'themes'].map(n => { const d = Object.getOwnPropertyDescriptor(L, n); return n + ':' + (d && d.get ? 'get' : '') + (d && d.set ? '+set' : ''); });
    o.windowCounterAfterSet = sb.counter;
    return o;
  };
  let b = null, a = null, err = g.status === 0 ? null : (g.stderr || '').slice(0, 300);
  if (!err) { try { b = observe(before, false); a = observe(after, true); } catch (e2) { err = String(e2 && e2.stack || e2).slice(0, 400); } }
  record('O12', '진짜 기관 등가: 생성기 unstate 로 바꿔 쓴 꾸러미를 진짜 app-state.js 위에서 실행한 관찰값이 바꿔 쓰기 전과 같다(통로 읽기·쓰기 · getter 전용 이름에 쓰기 · window 일회 복사 · 같은 객체)', !err && after.includes("window.OurgoalAppState.defineVar('counter', 0);") && JSON.stringify(a) === JSON.stringify(b), { err, before: b, after: a });
  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) { /* 임시 폴더 정리 실패는 결과에 영향 없음 */ }
}
const out = { tool: 'reports/TASK-ES-636/organ-unit.cjs', type: '작업자 측정, 판정 아님', app: APP, measuredAt: new Date().toISOString(), results, passed: results.filter(r => r.ok).length, total: results.length, ok: results.every(r => r.ok) };
if (OUT) { fs.mkdirSync(path.dirname(path.resolve(OUT)), { recursive: true }); fs.writeFileSync(path.resolve(OUT), JSON.stringify(out, null, 1) + '\n', 'utf8'); }
console.log('organ-unit', out.passed + '/' + out.total, out.ok ? 'ok' : 'FAIL');
process.exit(out.ok ? 0 : 1);
