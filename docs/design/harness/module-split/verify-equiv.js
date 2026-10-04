'use strict';
// 옮기기 전 코드와 옮긴 뒤 코드의 토큰열이 같은지 검사한다. 차이로 허용하는 것은 'L.'·'K.' 접두(이름 참조 경로)뿐이다.
// 사용: node verify-equiv.js <이전 전 index.html> <APP_DIR>
const fs = require('fs'), path = require('path');
const NM = ''; // @babel/* 는 NODE_PATH 로 찾는다(예: NODE_PATH=C:/dev/ourgoal-app/node_modules)
const parser = require(NM + '@babel/parser');

const ORIG = process.argv[2], APP = process.argv[3];
const html = fs.readFileSync(ORIG, 'utf8').replace(/\r\n/g, '\n');
const lines = html.split('\n');
let s = -1, e = -1;
for (let i = 0; i < lines.length; i++) if (lines[i].trim() === '<script>' && (lines[i + 1] || '').trim() === '(function(){' && (lines[i + 2] || '').includes('"use strict"')) { s = i + 1; break; }
for (let i = s; i < lines.length; i++) if (lines[i].startsWith('</script>')) { e = i; break; }
const code = lines.slice(s, e).join('\n');
const oast = parser.parse(code, { sourceType: 'script', tokens: true });
const body = oast.program.body[0].expression.callee.body.body;
const fnNames = ['renderSettingsHeroCard', 'collapseAllSettingsSections', 'toggleAdvancedSettings', 'formatStorageBytes', 'paintCacheUsage', 'renderSettingsScreen'];
const decl = n => body.find(x => x.type === 'FunctionDeclaration' && x.id.name === n);
const rssIdx = body.indexOf(decl('renderSettingsScreen'));
const hapIdx = body.findIndex((x, i) => i > body.indexOf(decl('renderSettingsHeroCard')) && x.type === 'ExpressionStatement');
const statics = []; for (let i = rssIdx + 1; body[i] && body[i].type === 'ExpressionStatement'; i++) statics.push(body[i]);

const tokOf = (src, from, to) => {
  const ast = parser.parse(src, { sourceType: 'script', tokens: true, allowReturnOutsideFunction: true, allowAwaitOutsideFunction: true });
  return ast.tokens.filter(t => t.start >= (from || 0) && t.end <= (to === undefined ? Infinity : to));
};
const norm = toks => {
  const vals = toks.map(t => (t.type.label === 'name' || t.type.keyword) ? String(t.value) : (t.value !== undefined ? t.type.label + ':' + String(t.value) : t.type.label));
  const out = [];
  for (let i = 0; i < vals.length; i++) {
    if ((vals[i] === 'L' || vals[i] === 'K' || vals[i] === 'U') && vals[i + 1] === '.' && /^[A-Za-z_$]/.test(vals[i + 2] || '')) { i += 1; continue; }
    out.push(vals[i]);
  }
  return out;
};
// 원본 토큰 (한 문/함수씩)
const origTok = node => oast.tokens.filter(t => t.start >= node.start && t.end <= node.end);

// 새 파일
const rd = f => fs.readFileSync(path.join(APP, f), 'utf8').replace(/\r\n/g, '\n');
const render = rd('js/tabs/settings/render.js');
const SUBS = [['sub-profile.js', 'renderProfileSection'], ['sub-security.js', 'renderSecuritySection'], ['sub-notify.js', 'renderNotifySection'], ['sub-appearance.js', 'renderAppearanceSection'], ['sub-integrations.js', 'renderIntegrationsSection'], ['sub-data.js', 'renderDataSection']];
const fileFns = (src) => {
  const ast = parser.parse(src, { sourceType: 'script', tokens: true });
  const iife = ast.program.body[0].expression.callee.body.body;
  const m = {};
  for (const x of iife) if (x.type === 'FunctionDeclaration') m[x.id.name] = x;
  return { ast, m };
};
const R = fileFns(render);
const results = [];
const cmp = (label, a, b) => {
  const na = norm(a), nb = norm(b);
  let same = na.length === nb.length && na.every((v, i) => v === nb[i]);
  let at = -1; if (!same) { for (let i = 0; i < Math.max(na.length, nb.length); i++) if (na[i] !== nb[i]) { at = i; break; } }
  results.push({ label, tokensOrig: na.length, tokensNew: nb.length, same, firstDiff: same ? null : { i: at, orig: na.slice(at - 3, at + 5), neu: nb.slice(at - 3, at + 5) } });
};
const rTok = node => R.ast.tokens.filter(t => t.start >= node.start && t.end <= node.end);
for (const n of fnNames.filter(n => n !== 'renderSettingsScreen')) cmp(n, origTok(decl(n)), rTok(R.m[n]));
// 햅틱 위임: bindSettingsHapticDelegate 본문의 문 = 원래 문
const hapBody = R.m.bindSettingsHapticDelegate.body.body;
cmp('haptic-delegate', origTok(body[hapIdx]), R.ast.tokens.filter(t => t.start >= hapBody[0].start && t.end <= hapBody[hapBody.length - 1].end));
const stBody = R.m.bindSettingsStaticHandlers.body.body;
cmp('static-bindings(' + statics.length + ')', oast.tokens.filter(t => t.start >= statics[0].start && t.end <= statics[statics.length - 1].end), R.ast.tokens.filter(t => t.start >= stBody[0].start && t.end <= stBody[stBody.length - 1].end));
// renderSettingsScreen: render.js 의 머리 + (소블록 호출 6줄 대신) 각 섹션 함수 본문 + 닫는 괄호
const rss = R.m.renderSettingsScreen;
const rssStmts = rss.body.body;
const callStart = rssStmts.findIndex(x => x.type === 'ExpressionStatement' && x.expression.type === 'CallExpression' && x.expression.callee.type === 'MemberExpression' && x.expression.callee.object.type === 'MemberExpression' && x.expression.callee.object.object.name === 'global');
let newT = R.ast.tokens.filter(t => t.start >= rss.start && t.end <= (callStart > 0 ? rssStmts[callStart - 1].end : rss.body.start + 1));
for (const [f, fn] of SUBS) {
  const S = fileFns(rd('js/tabs/settings/' + f));
  const b = S.m[fn].body;
  newT = newT.concat(S.ast.tokens.filter(t => t.start > b.start && t.end < b.end));
}
newT.push(R.ast.tokens.find(t => t.start === rss.end - 1));
cmp('renderSettingsScreen(+6 sections)', origTok(decl('renderSettingsScreen')), newT);
console.log(JSON.stringify(results, null, 1));
const ok = results.every(r => r.same);
console.log(ok ? 'EQUIVALENT: 모든 구간 토큰 동일(L./K. 접두 제외)' : 'DIFFERENT');
fs.writeFileSync(path.join(process.env.MODULE_SPLIT_OUT || require('os').tmpdir(), 'equiv.json'), JSON.stringify({ ok, results }, null, 1));
process.exit(ok ? 0 : 1);
