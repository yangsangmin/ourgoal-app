'use strict';
// 옮긴 파일에 IIFE 스코프 이름이 바꿔 쓰이지 않은 채 남았는지(=전역으로 새어 다른 값을 읽는지), L.<이름> 이 모두 브리지에 노출됐는지 검사한다.
const fs = require('fs'), path = require('path');
const NM = ''; // @babel/* 는 NODE_PATH 로 찾는다(예: NODE_PATH=C:/dev/ourgoal-app/node_modules)
const parser = require(NM + '@babel/parser');
const traverse = require(NM + '@babel/traverse').default;
const APP = process.argv[2];
const html = fs.readFileSync(path.join(APP, 'index.html'), 'utf8').replace(/\r\n/g, '\n');
const lines = html.split('\n');
let s = -1, e = -1;
for (let i = 0; i < lines.length; i++) if (lines[i].trim() === '<script>' && (lines[i + 1] || '').trim() === '(function(){' && (lines[i + 2] || '').includes('"use strict"')) { s = i + 1; break; }
for (let i = s; i < lines.length; i++) if (lines[i].startsWith('</script>')) { e = i; break; }
const ast = parser.parse(lines.slice(s, e).join('\n'), { sourceType: 'script' });
let iife; traverse(ast, { FunctionExpression(p) { if (!iife) iife = p; } });
const iifeNames = new Set(Object.keys(iife.scope.bindings));
// 브리지 노출 이름: expose('index.html', { get X(){...} })
const exposed = new Set();
iife.traverse({ CallExpression(p) { const c = p.node.callee; if (c.type === 'MemberExpression' && c.property.name === 'expose' && p.node.arguments[1] && p.node.arguments[1].properties) for (const pr of p.node.arguments[1].properties) if (pr.kind === 'get') exposed.add(pr.key.name); } });
// renderSettingsScreen 등 정의가 IIFE 에 남았는가
const leftDefs = ['renderSettingsScreen', 'renderSettingsHeroCard', 'collapseAllSettingsSections', 'toggleAdvancedSettings', 'formatStorageBytes', 'paintCacheUsage'].filter(n => { const b = iife.scope.bindings[n]; return b && b.path.isFunctionDeclaration(); });
const files = ['js/tabs/settings/render.js', 'js/tabs/settings/sub-profile.js', 'js/tabs/settings/sub-security.js', 'js/tabs/settings/sub-notify.js', 'js/tabs/settings/sub-appearance.js', 'js/tabs/settings/sub-integrations.js', 'js/tabs/settings/sub-data.js'];
const report = { exposed: exposed.size, leftFunctionDefsInIndex: leftDefs, files: {} };
const usedL = new Set();
for (const f of files) {
  const fa = parser.parse(fs.readFileSync(path.join(APP, f), 'utf8'), { sourceType: 'script' });
  const leaks = new Set(), globals = new Set();
  traverse(fa, {
    Identifier(p) {
      const par = p.parent;
      if (p.parentPath.isMemberExpression() && par.property === p.node && !par.computed) {
        if (par.object.type === 'Identifier' && par.object.name === 'L') usedL.add(p.node.name);
        return;
      }
      if (p.parentPath.isObjectProperty() && par.key === p.node && !par.computed) return;
      if (p.parentPath.isObjectMethod() && par.key === p.node) return;
      if (!p.isReferencedIdentifier() && !(p.parentPath.isAssignmentExpression() && par.left === p.node)) return;
      if (p.scope.getBinding(p.node.name)) return;
      globals.add(p.node.name);
      if (iifeNames.has(p.node.name)) leaks.add(p.node.name);
    }
  });
  report.files[f] = { globals: [...globals].sort(), leaksIIFEName: [...leaks].sort() };
}
report.usedL = [...usedL].sort();
report.notExposed = report.usedL.filter(n => !exposed.has(n));
report.exposedUnused = [...exposed].filter(n => !usedL.has(n));
console.log(JSON.stringify(report, null, 1));
