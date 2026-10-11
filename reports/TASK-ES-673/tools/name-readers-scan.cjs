#!/usr/bin/env node
'use strict';
// #TASK-ES-673 정적 검사(작업자 측정 도구, 판정 아님) — 공유 함수(shareContent)의 함수 객체가 저장소 제품 코드에서 어떻게 쓰이는지 전부 세어 가른다.
// 상태 이전(unstate)이 `var shareContent = function(opts){…};` 을 `define('shareContent', function(opts){…});` 로 바꾸면 그 함수의 name 이 'shareContent' 에서 '' 로 바뀐다.
// 그 name 을 읽는 코드가 있으면 동작이 달라질 수 있으므로, 함수 객체가 닿는 자리를 전부 찾아 「부른다 · 있는지만 본다 · 딴 이름에 담는다 · 속성을 읽는다」로 가른다.
//   대상: js/**/*.js · ui.js · sw.js · index.html 의 인라인 <script> 전부(문법 분석 — @babel/parser)
//   · 이름 shareContent 가 식별자·속성 이름으로 나오는 자리마다 부모 마디의 꼴로 가른다.
//   · 딴 이름에 담는 자리(var fn = global.shareContent || …)는 그 이름이 같은 함수 안에서 쓰이는 자리를 한 번 더 가른다.
//   · 「속성을 읽는다」 가운데 name · displayName · toString · length · caller · arguments 는 따로 센다.
// 사용: NODE_PATH=C:/dev/ourgoal-app/node_modules node reports/TASK-ES-673/tools/name-readers-scan.cjs <트리> <out.json>
const fs = require('fs'), path = require('path');
const TREE = path.resolve(process.argv[2] || '.'), OUT = process.argv[3];
if (!OUT) { console.error('사용: node name-readers-scan.cjs <트리> <out.json>'); process.exit(2); }
const parser = require('@babel/parser'), traverse = require('@babel/traverse').default;
const NAME = 'shareContent', SENSITIVE = ['name', 'displayName', 'toString', 'length', 'caller', 'arguments'];
const sources = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (e.name.endsWith('.js')) sources.push({ file: path.relative(TREE, p).replace(/\\/g, '/'), code: fs.readFileSync(p, 'utf8'), lineOffset: 0 }); } })(path.join(TREE, 'js'));
for (const f of ['ui.js', 'sw.js']) if (fs.existsSync(path.join(TREE, f))) sources.push({ file: f, code: fs.readFileSync(path.join(TREE, f), 'utf8'), lineOffset: 0 });
{ // index.html 의 인라인 <script>(src 없는 것) 전부
  const html = fs.readFileSync(path.join(TREE, 'index.html'), 'utf8'), re = /<script(\s[^>]*)?>([\s\S]*?)<\/script>/g; let m, k = 0;
  while ((m = re.exec(html))) { if (/\ssrc\s*=/.test(m[1] || '') || /type\s*=\s*["']application\/(ld\+)?json["']/.test(m[1] || '') || !m[2].trim()) continue; const before = html.slice(0, m.index + m[0].indexOf('>') + 1); sources.push({ file: 'index.html(인라인 ' + (++k) + ')', code: m[2], lineOffset: before.split('\n').length - 1 }); }
}
const rows = [], parseErrors = [];
const isRef = n => !!n && ((n.type === 'Identifier' && n.name === NAME) || (n.type === 'MemberExpression' && !n.computed && n.property.type === 'Identifier' && n.property.name === NAME) || (n.type === 'MemberExpression' && n.computed && n.property.type === 'StringLiteral' && n.property.value === NAME));
// 값으로 쓰인 참조(node)를 감싼 마디(parent)의 꼴로 가른다. 논리식(a || b) · 조건식 · 괄호는 한 겹 올라가 다시 본다.
function classify(p) {
  let cur = p, up = p.parentPath;
  while (up && (up.isLogicalExpression() || (up.isConditionalExpression() && up.node.test !== cur.node) || up.isSequenceExpression())) { cur = up; up = up.parentPath; }
  const viaLogical = cur !== p;
  if (!up) return { kind: '그 밖', detail: 'root' };
  const n = up.node, c = cur.node;
  if (up.isCallExpression() && n.callee === c) return { kind: '부른다', detail: viaLogical ? '논리식의 결과를 부름' : '직접 호출' };
  if (up.isNewExpression() && n.callee === c) return { kind: '그 밖', detail: 'new' };
  if (up.isUnaryExpression() && n.operator === 'typeof') return { kind: '있는지만 본다', detail: 'typeof' };
  if (up.isUnaryExpression() && n.operator === '!') return { kind: '있는지만 본다', detail: '!' };
  if ((up.isIfStatement() || up.isConditionalExpression()) && n.test === c) return { kind: '있는지만 본다', detail: '조건' };
  if (up.isLogicalExpression()) return { kind: '있는지만 본다', detail: '논리식' };
  if (up.isMemberExpression() && n.object === c) { const prop = n.computed ? (n.property.type === 'StringLiteral' ? n.property.value : '(계산된 이름)') : n.property.name; return { kind: '속성을 읽는다', detail: prop, sensitive: SENSITIVE.includes(prop) || prop === '(계산된 이름)' }; }
  if (up.isVariableDeclarator() && n.init === c) return { kind: '딴 이름에 담는다', detail: n.id.type === 'Identifier' ? n.id.name : '(구조 분해)', alias: n.id.type === 'Identifier' ? up.scope.getBinding(n.id.name) : null };
  if (up.isAssignmentExpression() && n.right === c) { const l = n.left; const lt = l.type === 'MemberExpression' ? ((l.object.type === 'Identifier' ? l.object.name : '…') + '.' + (l.property.name || l.property.value || '?')) : (l.name || '?'); return { kind: /(^|\.)shareContent$/.test(lt) ? '같은 이름으로 단다' : '딴 이름에 담는다', detail: lt }; }
  if (up.isObjectProperty() && n.value === c) return { kind: '객체 속성 값으로 싣는다', detail: n.key.name || n.key.value || '?' };
  if (up.isCallExpression() && n.arguments.includes(c)) return { kind: '인자로 넘긴다', detail: '호출 인자' };
  if (up.isReturnStatement()) return { kind: '돌려준다', detail: 'return' };
  if (up.isBinaryExpression()) return { kind: '있는지만 본다', detail: '비교 ' + n.operator };
  if (up.isExpressionStatement()) return { kind: '그 밖', detail: '식 문(값을 버림)' };
  return { kind: '그 밖', detail: up.node.type };
}
for (const s of sources) {
  if (!s.code.includes(NAME)) continue;
  let ast; try { ast = parser.parse(s.code, { sourceType: 'script', errorRecovery: true, allowReturnOutsideFunction: true }); } catch (e) { try { ast = parser.parse(s.code, { sourceType: 'module', errorRecovery: true }); } catch (e2) { parseErrors.push({ file: s.file, error: String(e2.message).slice(0, 120) }); continue; } }
  const push = (p, r) => rows.push(Object.assign({ file: s.file, line: p.node.loc.start.line + s.lineOffset }, r));
  const aliasBindings = [];
  traverse(ast, {
    FunctionDeclaration(p) { if (p.node.id && p.node.id.name === NAME) push(p, { kind: '선언한다', detail: 'function ' + NAME + '(' + p.node.params.length + ')' + (p.node.async ? ' async' : '') }); },
    ObjectProperty(p) { const k = p.node.key; if (!p.node.computed && ((k.type === 'Identifier' && k.name === NAME) || (k.type === 'StringLiteral' && k.value === NAME)) && !isRef(p.node.value)) push(p, { kind: '객체 속성 이름', detail: p.node.value.type }); },
    ObjectMethod(p) { const k = p.node.key; if (!p.node.computed && k.type === 'Identifier' && k.name === NAME) push(p, { kind: '객체 속성 이름', detail: p.node.kind + ' 접근자·메서드' }); },
    VariableDeclarator(p) { if (p.node.id.type === 'Identifier' && p.node.id.name === NAME) push(p, { kind: '선언한다', detail: 'var ' + NAME + ' = ' + (p.node.init ? p.node.init.type : '(없음)') }); },
    AssignmentExpression(p) { if (isRef(p.node.left)) push(p, { kind: '값을 단다', detail: (p.node.left.type === 'MemberExpression' ? ((p.node.left.object.name || '…') + '.') : '') + NAME + ' = ' + p.node.right.type + (p.node.right.type === 'MemberExpression' ? '(' + (p.node.right.property.name || '') + ')' : p.node.right.type === 'Identifier' ? '(' + p.node.right.name + ')' : '') }); },
    'Identifier|MemberExpression'(p) {
      const n = p.node; if (!isRef(n)) return;
      const par = p.parentPath;
      if (n.type === 'Identifier') { // 속성 이름 자리·선언 자리·대입 왼쪽은 위에서 셌다
        if (par.isMemberExpression() && par.node.property === n && !par.node.computed) return;
        if ((par.isObjectProperty() || par.isObjectMethod()) && par.node.key === n && !par.node.computed) { if (par.isObjectProperty() && par.node.value === n) { /* 줄임 꼴 아님 */ } else return; }
        if (par.isFunctionDeclaration() && par.node.id === n) return;
        if (par.isVariableDeclarator() && par.node.id === n) return;
      }
      if (par.isAssignmentExpression() && par.node.left === n) return;
      const r = classify(p); if (r.alias && !aliasBindings.some(x => x.binding === r.alias)) aliasBindings.push({ name: r.detail, binding: r.alias }); delete r.alias; push(p, r);
    },
  });
  for (const a of aliasBindings) for (const ref of a.binding.referencePaths) { const r = classify(ref); delete r.alias; rows.push(Object.assign({ file: s.file, line: ref.node.loc.start.line + s.lineOffset, viaAlias: a.name }, r)); }
}
// window · 통로를 통째로 훑는 코드(이름을 모르고도 함수 객체에 닿을 수 있는 길): for…in 과 Object.keys 류의 대상이 window · global · self · 통로(L · S · scope) 그 자체인 줄
const enumRe = new RegExp('for ?[(] ?(var|let|const) [A-Za-z_$]+ in (window|global|self|globalThis|L|S|scope)[)]|Object[.](keys|getOwnPropertyNames|entries|values)[(] ?(window|global|self|globalThis|L|S|scope|window[.]OurgoalAppScope[.]scope) ?[)]');
const wholeObjectEnumerations = [];
for (const s of sources) s.code.split('\n').forEach((l, i) => { if (enumRe.test(l)) wholeObjectEnumerations.push({ at: s.file + ':' + (i + 1 + s.lineOffset), text: l.trim().slice(0, 140) }); });
const byKind = {}; rows.forEach(r => { byKind[r.kind] = (byKind[r.kind] || 0) + 1; });
const propertyReads = rows.filter(r => r.kind === '속성을 읽는다');
// 함수 객체가 「값으로」 딴 곳에 넘어가는 자리: 엔진 파일(js/viral-sharing.js)이 자기 함수를 내보내는 자리는 다른 함수(이름 있는 선언)라 이번 변경과 무관 — 따로 적는다
const escapes = rows.filter(r => ['인자로 넘긴다', '돌려준다', '객체 속성 값으로 싣는다', '그 밖'].includes(r.kind) || (r.kind === '딴 이름에 담는다' && !rows.some(x => x.viaAlias === r.detail && x.file === r.file)));
const out = { tool: 'reports/TASK-ES-673/tools/name-readers-scan.cjs', type: '작업자 측정, 판정 아님', measuredAt: new Date().toISOString(), name: NAME, filesScanned: sources.length, filesMentioning: [...new Set(rows.map(r => r.file))].sort(), parseErrors,
  byKind, total: rows.length,
  wholeObjectEnumerations,
  propertyReads: propertyReads.map(r => ({ at: r.file + ':' + r.line, property: r.detail, sensitive: !!r.sensitive })), sensitivePropertyReads: propertyReads.filter(r => r.sensitive).length,
  valueEscapes: escapes.map(r => ({ at: r.file + ':' + r.line, kind: r.kind, detail: r.detail, viaAlias: r.viaAlias || null })),
  valueEscapesOutsideEngineFile: escapes.filter(r => r.file !== 'js/viral-sharing.js').length,
  rows: rows.map(r => ({ at: r.file + ':' + r.line, kind: r.kind, detail: r.detail, viaAlias: r.viaAlias || undefined })),
  note: '「속성을 읽는다」가 0 이면 저장소 제품 코드에 이 함수 객체의 name · length · toString 등을 읽는 자리가 글자로는 없다. 「인자로 넘긴다 · 돌려준다 · 객체 속성 값으로 싣는다」가 엔진 파일 밖에 0 이면 함수 객체가 이 검사가 따라가지 못하는 곳으로 흘러가지 않는다. window·통로를 통째로 훑는 코드는 이 검사가 보지 않는다(따로 검색).' };
fs.mkdirSync(path.dirname(path.resolve(OUT)), { recursive: true });
fs.writeFileSync(path.resolve(OUT), JSON.stringify(out, null, 1) + '\n', { encoding: 'utf8' });
console.log(JSON.stringify({ files: out.filesScanned, mentioning: out.filesMentioning, byKind, propertyReads: out.propertyReads, sensitive: out.sensitivePropertyReads, escapes: out.valueEscapes, escapesOutsideEngine: out.valueEscapesOutsideEngineFile, enumerations: wholeObjectEnumerations.length, parseErrors: parseErrors.length }));
